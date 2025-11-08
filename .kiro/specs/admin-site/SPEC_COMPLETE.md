# Admin Site Spec - Config Management & Dynamic Backgrounds

## Status: ✅ COMPLETE

This spec extends the existing admin-site spec with configuration management and dynamic background features.

## What Was Added

### Requirements (5 new requirements)
- **Requirement 12**: Access site configuration settings from admin interface
- **Requirement 13**: Manage dynamic background URLs
- **Requirement 14**: Preview dynamic backgrounds before adding
- **Requirement 15**: See all dynamic backgrounds at once

### Design
Added comprehensive design for:
- **Settings Modal**: Tabbed interface (General, Dynamic Backgrounds, Advanced)
- **Config API**: GET and PUT endpoints for configuration
- **Dynamic Background Components**:
  - DynamicBackgroundManager (list manager)
  - BackgroundPreviewCard (grid item with iframe preview)
  - BackgroundPreviewModal (expanded view)
- **Drag-and-Drop**: HTML5 API for reordering backgrounds
- **Security**: iframe sandbox attributes
- **Validation**: URL format, duplicates, required fields

### Tasks (11 new subtasks)
- **Task 15**: Configuration Management (5 subtasks)
  - API endpoints
  - SettingsModal component
  - ConfigForm and AdvancedConfigForm
  - Integration with App
  
- **Task 16**: Dynamic Backgrounds (6 subtasks)
  - DynamicBackgroundManager
  - BackgroundPreviewCard with live previews
  - Drag-and-drop reordering
  - BackgroundPreviewModal
  - Integration and styling

## Key Features

### Settings Modal
- Opens from header button
- Modal overlay (non-blocking)
- Tabbed interface for organization
- Single save action for all changes
- Dirty state tracking

### Dynamic Backgrounds
- **Add/Remove**: Simple URL list management
- **Live Preview**: Iframe previews (250x200px cards)
- **Status Indicators**: ✓ loaded, ⚠️ error
- **Reorder**: Drag-and-drop to change order
- **Expand**: Click for 800x600px preview modal
- **Security**: Sandbox attributes on iframes
- **Validation**: URL format and duplicate checking

### Configuration Fields
**General:**
- Title (required)
- Description (required)
- Base URL (required)
- Items Per Page (optional)
- Default Screenshot (optional)

**Advanced:**
- Custom Styles (optional)
- Custom Scripts (optional)
- Output Directory (optional)

**Dynamic Backgrounds:**
- Array of URLs (optional)

## Implementation Notes

### Data Structure
Backgrounds remain a simple string array:
```yaml
config:
  dynamicBackgrounds:
    - https://example.com/bg1
    - https://example.com/bg2
```

### API
- `GET /api/config` - Fetch config (already exists)
- `PUT /api/config` - Update entire config (new)

### Components
- `SettingsModal` - Main container
- `ConfigForm` - General settings
- `AdvancedConfigForm` - Advanced settings
- `DynamicBackgroundManager` - Background list
- `BackgroundPreviewCard` - Grid item with preview
- `BackgroundPreviewModal` - Expanded preview

### Security
Iframes use sandbox attributes:
```html
<iframe sandbox="allow-scripts allow-same-origin" />
```

## Next Steps

To implement this feature:
1. Start with Task 15 (Configuration Management)
2. Then Task 16 (Dynamic Backgrounds)
3. All tasks are required (no optional tasks)

## Files Modified

- `.kiro/specs/admin-site/requirements.md` - Added Requirements 12-15
- `.kiro/specs/admin-site/design.md` - Added config management and dynamic backgrounds design
- `.kiro/specs/admin-site/tasks.md` - Added Tasks 15-16
- `.kiro/specs/admin-site/config-management-summary.md` - Visual mockup (reference)
- `.kiro/specs/admin-site/SPEC_COMPLETE.md` - This summary

## Ready for Implementation

The spec is complete and ready for implementation. All requirements have acceptance criteria, design decisions are documented, and tasks are broken down into manageable subtasks.
