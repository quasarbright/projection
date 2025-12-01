# DRY Principle (Don't Repeat Yourself)

## Overview

This project follows the DRY (Don't Repeat Yourself) principle to maintain clean, maintainable code. When you notice duplicated logic across multiple files, create a shared abstraction.

## Guidelines

### 1. Identify Duplication

Look for:
- **Identical or similar logic** repeated in multiple files
- **File path resolution** patterns (e.g., finding config files, project files)
- **Validation logic** that appears in multiple places
- **Data transformation** code that's duplicated
- **Error handling** patterns that repeat

### 2. Create Shared Utilities

When you find duplication:

1. **Create a utility module** in the appropriate location:
   - `src/utils/` for general utilities
   - `src/generator/` for generator-specific utilities
   - `src/admin/` for admin-specific utilities

2. **Name it descriptively** based on its purpose:
   - `project-file-finder.ts` for finding project files
   - `path-resolver.ts` for path resolution
   - `validator-helpers.ts` for validation utilities

3. **Make it focused** - each utility should have a single, clear responsibility

### 3. Design Shared Abstractions

Good shared utilities should:

- **Be stateless** when possible (use static methods or pure functions)
- **Have clear interfaces** with well-documented parameters and return types
- **Handle edge cases** consistently
- **Provide helpful error messages**
- **Be testable** in isolation

### 4. Example Pattern

```typescript
// ❌ BAD: Duplicated logic in multiple files
// File 1:
function findProjectFile(cwd: string): string | null {
  const files = ['projects.yaml', 'projects.yml', 'projects.json'];
  for (const file of files) {
    const path = join(cwd, file);
    if (existsSync(path)) return path;
  }
  return null;
}

// File 2:
function locateProjects(dir: string): string | null {
  const possibleFiles = ['projects.yaml', 'projects.yml', 'projects.json'];
  for (const f of possibleFiles) {
    const fullPath = join(dir, f);
    if (existsSync(fullPath)) return fullPath;
  }
  return null;
}

// ✅ GOOD: Shared utility
// src/utils/project-file-finder.ts
export class ProjectFileFinder {
  static find(cwd: string): ProjectFileResult | null {
    // Single implementation used everywhere
  }
}

// Usage in both files:
const result = ProjectFileFinder.find(cwd);
```

### 5. Refactoring Process

When refactoring to remove duplication:

1. **Create the shared utility first** with comprehensive tests
2. **Update one usage at a time** to use the new utility
3. **Run tests after each change** to ensure nothing breaks
4. **Remove the old duplicated code** once all usages are updated
5. **Update documentation** to reference the new utility

### 6. When NOT to Apply DRY

Don't create abstractions when:

- **Code looks similar but serves different purposes** - similar structure doesn't always mean duplication
- **The abstraction would be more complex** than the duplication
- **It's used in only one place** - wait until you have at least 2-3 usages
- **The logic is likely to diverge** in the future

### 7. Testing Shared Utilities

Always create comprehensive tests for shared utilities:

```typescript
// tests/unit/project-file-finder.test.ts
describe('ProjectFileFinder', () => {
  it('should find projects.yaml', () => { /* ... */ });
  it('should find projects.yml', () => { /* ... */ });
  it('should find projects.json', () => { /* ... */ });
  it('should return null when no file exists', () => { /* ... */ });
  it('should handle absolute paths', () => { /* ... */ });
  it('should handle relative paths', () => { /* ... */ });
});
```

## Current Shared Utilities

### ProjectFileFinder (`src/utils/project-file-finder.ts`)

Centralizes logic for finding and validating project data files.

**Use cases:**
- CLI commands that need to locate project files
- Generator that loads project data
- Admin server that manages project files

**Key methods:**
- `find(cwd)` - Find projects file in directory
- `findOrThrow(cwd)` - Find or throw error
- `resolve(cwd, providedPath?)` - Resolve with optional user-provided path
- `exists(filePath)` - Check if file exists
- `getPossiblePaths(cwd)` - Get all possible file paths (for error messages)
- `getSupportedFileNames()` - Get list of supported file names

## Benefits of DRY

1. **Easier maintenance** - Fix bugs in one place
2. **Consistency** - Same behavior everywhere
3. **Better testing** - Test once, use everywhere
4. **Clearer intent** - Named utilities document purpose
5. **Reduced errors** - Less code to maintain means fewer bugs

## Action Items

When you see duplication:

1. ✅ Create an issue or note it
2. ✅ Design the shared abstraction
3. ✅ Implement with tests
4. ✅ Refactor existing code
5. ✅ Document in this file

## References

- [DRY Principle - Wikipedia](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/)


## Build Logic Consolidation

### Problem Identified

The `build`, `dev`, and `deploy` commands all had duplicated build logic:
- Each command created its own `Generator` instance
- Each command called `generator.generate()` separately
- Each command had its own error handling for build failures
- Inconsistent behavior between commands (e.g., `dev` forced `baseUrl: './'` but others didn't)

This violated DRY and caused bugs where `projection build` and `projection deploy` generated different output.

### Solution: BuildHelper Utility

Created `src/utils/build-helper.ts` with a shared `BuildHelper.runBuild()` method that:
- Centralizes all build logic in one place
- Provides consistent error handling
- Supports all build options (baseUrl override, clean, silent mode, etc.)
- Returns a `BuildResult` with the output directory and generator instance

### Usage

**Before (duplicated in each command):**
```typescript
// In build.ts
const generator = await Generator.create({ cwd, configPath, outputDir, clean });
await generator.generate();

// In dev.ts  
const generator = await Generator.create({ cwd, configPath, outputDir, baseUrl: './' });
await generator.generate();

// In deploy.ts
const generator = await Generator.create({ cwd, outputDir, clean: false });
await generator.generate();
```

**After (shared helper):**
```typescript
// All commands use the same helper
const result = await BuildHelper.runBuild({
  cwd,
  configPath,
  outputDir,
  clean,
  baseUrl, // Optional override
  silent   // Optional for rebuilds
});
```

### Benefits

1. **Single source of truth** - Build logic exists in one place
2. **Consistent behavior** - All commands generate identical output
3. **Easier maintenance** - Fix bugs once, applies everywhere
4. **Better testing** - Test the helper once instead of each command
5. **Clearer intent** - Commands focus on their specific concerns (serving, deploying) not build details

### Files Modified

- Created: `src/utils/build-helper.ts`
- Updated: `src/cli/build.ts` - Now uses `BuildHelper.runBuild()`
- Updated: `src/cli/dev.ts` - Now uses `BuildHelper.runBuild()` with `baseUrl: './'`
- Updated: `src/cli/deploy.ts` - Now uses `BuildHelper.runBuild()`

### Result

Now `projection build`, `projection dev`, and `projection deploy` all use the exact same build logic, ensuring consistent output and behavior across all commands.
