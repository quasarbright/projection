# Admin Screenshot Upload with `admin://` Prefix

## Overview

This document describes the implementation of the `admin://` prefix for admin-uploaded screenshots, which ensures proper path resolution regardless of the `baseUrl` configuration.

## Problem

When users upload screenshots through the admin interface, the generated path may not resolve correctly depending on the `baseUrl` configuration. For example:
- If `baseUrl` is `./`, the path `screenshots/image.png` works fine
- If `baseUrl` is `/my-project/`, the path `screenshots/image.png` would resolve to `/my-project/screenshots/image.png`, which may not exist

## Solution

We implemented a special `admin://` prefix for admin-uploaded screenshots:

**Key Features:**
- Admin interface resolves `admin://` to `/screenshots/` for image previews
- Build process resolves `admin://` to `images/` with proper baseUrl
- Proper error messages for validation failures

1. **Admin uploads** are stored in `screenshots/` directory
2. **Paths are saved** with `admin://` prefix (e.g., `admin://project-123.png`)
3. **During build**, files are copied from `screenshots/` to `images/` directory
4. **HTML generation** resolves `admin://` paths to `images/` directory with proper `baseUrl`

## Implementation Details

### 1. Path Resolver (`src/admin/client/src/utils/pathResolver.ts`)

Added utility function to resolve `admin://` paths for the admin interface:

```typescript
export function resolveAdminPath(path: string | undefined | null): string | null {
  if (!path || path === '') {
    return null;
  }

  // If it starts with admin://, resolve to /screenshots/
  if (path.startsWith('admin://')) {
    const filename = path.substring(8);
    return `/screenshots/${filename}`;
  }

  return path;
}
```

This ensures that image previews in the admin interface work correctly by converting `admin://project-123.png` to `/screenshots/project-123.png`.

### 3. ImageUpload Component (`src/admin/client/src/components/ImageUpload.tsx`)

Updated to use the path resolver for displaying previews:

```typescript
import { resolveAdminPath } from '../utils/pathResolver';

// Update preview when currentThumbnail changes
useEffect(() => {
  const resolvedPath = resolveAdminPath(currentThumbnail);
  setPreviewUrl(resolvedPath);
}, [currentThumbnail]);
```

### 4. ImageManager (`src/admin/server/image-manager.ts`)

Updated `getRelativePath()` and `saveTempImage()` to return paths with `admin://` prefix:

```typescript
getRelativePath(projectId: string, extension: string): string {
  return `admin://${projectId}${extension}`;
}
```

### 2. HTMLBuilder (`src/generator/html-builder.ts`)

Updated `resolveThumbnailPath()` to handle `admin://` prefix differently based on mode:

```typescript
if (thumbnailLink.startsWith('admin://')) {
  const filename = thumbnailLink.substring(8);
  
  // In admin mode (preview), resolve to /screenshots/ for live preview
  if (this.adminMode) {
    return '/screenshots/' + filename;
  }
  
  // In production build, resolve to images/ directory with baseUrl
  return baseUrl + 'images/' + filename;
}
```

This ensures that:
- **Admin preview** shows images from `/screenshots/` (where they're actually stored)
- **Production build** references images from `images/` (where they're copied to)

Old code:

```typescript
if (thumbnailLink.startsWith('admin://')) {
  const filename = thumbnailLink.substring(8); // Remove 'admin://' prefix
  return baseUrl + 'images/' + filename;
}
```

### 3. AssetCopier (`src/generator/asset-copier.ts`)

Added `copyAdminScreenshots()` method to copy files from `screenshots/` to `images/`:

```typescript
private async copyAdminScreenshots(thumbnails: string[]): Promise<void> {
  const adminThumbnails = thumbnails.filter(t => t && t.startsWith('admin://'));
  
  for (const thumbnail of adminThumbnails) {
    const filename = thumbnail.substring(8);
    const sourcePath = path.join(screenshotsDir, filename);
    const destPath = path.join(imagesDir, filename);
    
    if (fs.existsSync(sourcePath)) {
      this.copyFile(sourcePath, destPath);
    }
  }
}
```

### 4. Generator (`src/generator/index.ts`)

Updated to pass thumbnail paths to AssetCopier:

```typescript
const thumbnails = projectsData.projects
  .map(p => p.thumbnailLink)
  .filter((t): t is string => !!t);
await this.assetCopier.copyAssets(this.config, thumbnails);
```

### 5. Validator (`src/generator/validator.ts`)

Updated to validate `admin://` prefixed paths by checking the `screenshots/` directory:

```typescript
if (filePath.startsWith('admin://')) {
  const filename = filePath.substring(8);
  const screenshotsPath = path.join(this.cwd, 'screenshots', filename);
  
  if (!fs.existsSync(screenshotsPath)) {
    warnings.push({
      projectId,
      projectIndex: index,
      field,
      message: `Admin-uploaded file not found: "${filePath}" (expected at: screenshots/${filename})`
    });
  }
  
  return warnings;
}
```

## File Structure

```
project-root/
├── screenshots/           # Admin-uploaded images (source)
│   ├── project-123.png
│   └── project-456.jpg
├── images/               # User-provided images
│   └── user-image.png
└── dist/                 # Build output
    └── images/           # All images (admin + user)
        ├── project-123.png  # Copied from screenshots/
        ├── project-456.jpg  # Copied from screenshots/
        └── user-image.png   # Copied from images/
```

## Example

### projects.yaml
```yaml
projects:
  - id: project-123
    title: My Project
    thumbnailLink: admin://project-123.png  # Admin-uploaded
  - id: project-456
    title: Another Project
    thumbnailLink: images/user-image.png    # User-provided
```

### Generated HTML
```html
<!-- Admin-uploaded screenshot -->
<div class="project-card" style="background-image: url('./images/project-123.png');">

<!-- User-provided image -->
<div class="project-card" style="background-image: url('./images/user-image.png');">
```

## Benefits

1. **Base URL Independence**: Works correctly regardless of `baseUrl` configuration
2. **Clear Separation**: Admin-managed vs user-managed assets are clearly distinguished
3. **No Breaking Changes**: Existing projects with regular paths continue to work
4. **Validation**: Validator checks that admin-uploaded files exist in `screenshots/` directory

### 9. Build Error Handling (`src/cli/build.ts`)

Updated error display to properly format validation errors:

```typescript
error.details.errors.forEach((err: any) => {
  if (typeof err === 'string') {
    Logger.dim(`  • ${err}`);
  } else if (err.message) {
    const projectInfo = err.projectId ? `[${err.projectId}]` : `[Project ${err.projectIndex}]`;
    Logger.dim(`  • ${projectInfo} ${err.field}: ${err.message}`);
  }
});
```

This fixes the `[object Object]` error display issue.

## Testing

Comprehensive tests added in:
- `tests/unit/path-resolver.test.ts` - Admin path resolution tests
- `tests/unit/html-builder.test.ts` - Build-time path resolution tests
- `tests/unit/asset-copier.test.ts` - File copying tests
- `tests/integration/admin-screenshot-upload.test.ts` - End-to-end integration tests


## Dev Server Support

### Problem

When running `projection dev` with a production `baseUrl` (e.g., `https://example.com/`), the generated HTML would reference production URLs for images, causing them not to load from the local dev server.

### Solution

The dev server now:

1. **Overrides baseUrl**: Forces `baseUrl: './'` for local development via `GeneratorOptions`
2. **Serves screenshots**: Configures browser-sync to serve the `screenshots/` directory
3. **Uses relative paths**: All images load from `./images/` regardless of production config

### Implementation

**Generator Options** (`src/generator/index.ts`):
```typescript
export interface GeneratorOptions {
  // ... other options
  baseUrl?: string;  // Override baseUrl (useful for dev server)
}
```

**Dev Command** (`src/cli/dev.ts`):
```typescript
const generatorOptions: GeneratorOptions = {
  cwd,
  configPath: options.config,
  outputDir: options.output,
  baseUrl: './'  // Force relative paths for dev server
};
```

**Browser-Sync Configuration**:
```typescript
bs.init({
  server: {
    baseDir: outputDir,
    routes: {
      '/screenshots': path.join(cwd, 'screenshots')
    }
  },
  // ...
});
```

### Result

Now `projection dev` works correctly regardless of your production `baseUrl` configuration:

- **Production config**: `baseUrl: https://example.com/portfolio/`
- **Dev server HTML**: Uses `./images/project.png` (relative paths)
- **Production build HTML**: Uses `https://example.com/portfolio/images/project.png`
