# Config Management & Dynamic Backgrounds - Feature Summary

## Overview

This feature adds configuration management capabilities to the Projection admin interface, with special focus on managing dynamic backgrounds with live preview.

## User Experience

### Accessing Settings
- **Settings button** in the admin header (next to "New Project")
- Opens a **modal dialog** overlaying the current view
- Modal contains tabs or sections for different config areas

### Settings Modal Structure

```
┌─────────────────────────────────────────────────────┐
│  Settings                                      [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  General Settings                                   │
│  ├─ Title: [Mike Delmonaco                    ]   │
│  ├─ Description: [My coding projects          ]   │
│  ├─ Base URL: [https://example.com/           ]   │
│  ├─ Items Per Page: [20]                          │
│  └─ Default Screenshot: [/images/default.png  ]   │
│                                                     │
│  Dynamic Backgrounds                                │
│  ┌───────────────────────────────────────────────┐ │
│  │ [+ Add Background URL]                        │ │
│  │                                               │ │
│  │ ┌─────────────┐  ┌─────────────┐            │ │
│  │ │   Preview   │  │   Preview   │  ...       │ │
│  │ │   [iframe]  │  │   [iframe]  │            │ │
│  │ │             │  │             │            │ │
│  │ │ [URL text]  │  │ [URL text]  │            │ │
│  │ │ [✓] [🗑️] [☰]│  │ [✓] [🗑️] [☰]│            │ │
│  │ └─────────────┘  └─────────────┘            │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Advanced                                           │
│  ├─ Custom Styles: [/styles/custom.css        ]   │
│  ├─ Custom Scripts: [/scripts/custom.js       ]   │
│  └─ Output Directory: [dist                   ]   │
│                                                     │
│                          [Cancel]  [Save Changes]  │
└─────────────────────────────────────────────────────┘
```

## Dynamic Backgrounds Section

### Features

1. **Add New Background**
   - Input field for URL
   - "Add" button
   - Validates URL format
   - Immediately shows preview after adding

2. **Background Preview Cards**
   - Grid layout (2-3 columns depending on screen size)
   - Each card shows:
     - Live iframe preview (small, ~200x150px)
     - Full URL text (truncated with tooltip)
     - Status indicator (✓ loaded, ⚠️ error)
     - Delete button (🗑️)
     - Drag handle (☰) for reordering
   - Click card to expand preview in modal

3. **Preview Modal** (when clicking a card)
   - Large iframe preview (~800x600px)
   - Full URL displayed
   - Test mouse movement (shows cursor position)
   - Close button

4. **Reordering**
   - Drag and drop cards to reorder
   - Order determines random selection pool
   - Visual feedback during drag

## Data Structure

### Config Object (unchanged)
```typescript
interface Config {
  title: string;
  description: string;
  baseUrl: string;
  itemsPerPage?: number;
  dynamicBackgrounds?: string[];  // Simple array of URLs
  defaultScreenshot?: string;
  customStyles?: string;
  customScripts?: string;
  output?: string;
}
```

### Example YAML
```yaml
config:
  title: Mike Delmonaco
  description: My coding projects
  baseUrl: https://quasarbright.github.io/
  itemsPerPage: 20
  dynamicBackgrounds:
    - https://quasarbright.github.io/p5js/boids
    - https://quasarbright.github.io/p5js/random-walk
    - https://quasarbright.github.io/p5js/voronoi?background
  defaultScreenshot: /images/default.png
```

## Technical Implementation Notes

### API Endpoints Needed
- `GET /api/config` - Get current config
- `PUT /api/config` - Update entire config
- `PATCH /api/config` - Update specific config fields

### Components to Create
- `SettingsModal.tsx` - Main modal container
- `ConfigForm.tsx` - General settings form
- `DynamicBackgroundManager.tsx` - Background list manager
- `BackgroundPreviewCard.tsx` - Individual background card
- `BackgroundPreviewModal.tsx` - Expanded preview modal

### Validation
- URL format validation for backgrounds
- Required fields: title, description, baseUrl
- Numeric validation for itemsPerPage
- Path validation for file paths

### Preview Implementation
- Iframe with sandbox attributes for security
- Append `?background=true` to URLs
- Error handling for failed loads
- Optional: Mouse event forwarding test

## User Workflows

### Adding a Background
1. Click "Settings" in header
2. Scroll to "Dynamic Backgrounds" section
3. Enter URL in input field
4. Click "Add" or press Enter
5. Preview appears in grid
6. Click "Save Changes" to persist

### Removing a Background
1. Open Settings modal
2. Find background card
3. Click delete button (🗑️)
4. Card removed from grid
5. Click "Save Changes" to persist

### Reordering Backgrounds
1. Open Settings modal
2. Drag background card by handle (☰)
3. Drop in new position
4. Grid reorders
5. Click "Save Changes" to persist

### Previewing a Background
1. Open Settings modal
2. Click on any background card
3. Large preview modal opens
4. Move mouse to test interaction
5. Close preview modal

## Benefits

- **Visual Management**: See all backgrounds at once
- **Live Preview**: Verify backgrounds work before saving
- **Easy Editing**: No manual YAML editing required
- **Error Detection**: Quickly identify broken backgrounds
- **Flexible Ordering**: Control background rotation order
- **Centralized Config**: All settings in one place

## Future Enhancements (Not in Scope)

- Background metadata (name, description)
- Enable/disable without deleting
- Background categories/tags
- Bulk import from file
- Screenshot capture for thumbnails
- Performance metrics (load time)
