# Static Site Generator Design

## Overview
Replace the current markdown-based project display (`../index.md`) with a modern, interactive gallery that generates from a single metadata file. The system will create a card-based layout with search functionality and detailed project information.

## Architecture

### Core Components
1. **Project Metadata File** (`projects.json`)
2. **Static Site Generator** (Node.js script)
3. **Template System** (HTML templates with placeholders)
4. **Frontend JavaScript** (search, filtering, modal interactions)
5. **CSS Framework** (responsive card layout)

### Data Model

#### Project Schema
```typescript
interface Project {
  id: string;                    // unique identifier
  title: string;                 // display name
  description: string;           // detailed description
  creationDate: string;          // ISO date string
  tags: string[];               // categorization tags
  pageLink: string;             // primary link (web demo, GitHub, YouTube, blog, etc.)
  sourceLink?: string;          // optional source code link
  thumbnailLink?: string;       // relative path to thumbnail/screenshot
  featured?: boolean;           // highlight important projects
}
```

#### Metadata File Structure
```json
{
  "projects": [
    {
      "id": "mandelbrot-shader",
      "title": "Mandelbrot Set",
      "description": "Interactive mandelbrot set visualization with continuous coloring",
      "creationDate": "2020-07-14",
      "tags": ["fractal", "shader", "web"],
      "pageLink": "https://quasarbright.github.io/p5js/mandelbrotShaderRenormalized/",
      "githubLink": "https://github.com/quasarbright/quasarbright.github.io/tree/master/p5js/mandelbrotShaderRenormalized",
      "thumbnailLink": "https://quasarbright.github.io/p5js/mandelbrotShaderRenormalized/screenshot.png",
      "featured": true
    }
  ],
  "config": {
    "title": "All Projects",
    "description": "Web projects, videos, code libraries, and blog posts",
    "defaultScreenshot": "../images/magnet pendulum.PNG",
    "itemsPerPage": 20
  }
}
```

## File Structure
```
project-display/
├── design.md                 # this document
├── generator.js              # main generator script
├── projects.json             # project metadata
├── templates/
│   ├── index.html           # main page template
│   ├── card.html            # project card template
│   └── modal.html           # detail modal template
├── styles/
│   ├── main.css             # main styles
│   ├── cards.css            # card-specific styles
│   └── modal.css            # modal styles
├── scripts/
│   ├── search.js            # search functionality
│   ├── filter.js            # tag filtering
│   └── modal.js             # modal interactions
└── dist/                    # generated output
    └── index.html           # final generated page
```

## Generator Process

### 1. Data Processing
- Read `projects.json`
- Validate project data
- Sort projects (featured first, then by creation date)
- Generate unique tags list
- Validate file paths and screenshots

### 2. Template Rendering
- Load HTML templates
- Replace placeholders with project data
- Generate individual cards
- Assemble final HTML document
- Inject metadata and configuration

### 3. Asset Management
- Copy CSS and JavaScript files
- Optimize images if needed
- Generate fallback screenshots for missing images
- Create responsive image variants

## Frontend Features

### Card Layout
- **Grid System**: CSS Grid with responsive breakpoints
- **Card Design**: 
  - Screenshot thumbnail (4:3 aspect ratio)
  - Project title
  - Creation date (formatted)
  - Tag chips
  - Info button overlay
- **Hover Effects**: Subtle animations and shadow changes
- **Mobile Responsive**: Stack cards on small screens

### Search & Filtering
- **Search Bar**: Real-time search across title, description, and tags
- **Tag Filter**: Clickable tags that filter the grid
- **Sort Options**: By date, name, or relevance
- **Clear Filters**: Reset to show all projects

### Modal System
- **Trigger**: Info button on cards
- **Content**: 
  - Large screenshot
  - Full description
  - All metadata
  - Links to both pageLink and githubLink
- **Navigation**: Previous/Next project buttons
- **Responsive**: Full-screen on mobile

## Technical Implementation

### Build Process
1. **Development Mode**: Watch files and regenerate on changes
2. **Production Mode**: Minify assets and optimize images
3. **Validation**: Check for broken links and missing screenshots

### Performance Considerations
- **Lazy Loading**: Load screenshots as they come into view
- **Image Optimization**: WebP format with PNG fallbacks
- **Minimal JavaScript**: Vanilla JS to keep bundle small
- **CSS Grid**: Native browser layout engine

### Accessibility
- **Keyboard Navigation**: Full keyboard support for cards and modal
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Trap focus in modal, restore after close
- **High Contrast**: Support for reduced motion and high contrast modes

## Migration Strategy

### Phase 1: Data Extraction
- Parse existing `index.md` to extract project information
- Generate initial `projects.json` with extracted data
- Identify missing screenshots and metadata

### Phase 2: Basic Generation
- Implement core generator functionality
- Create basic templates and styles
- Generate initial static site

### Phase 3: Enhancement
- Add search and filtering features
- Implement modal system
- Polish responsive design

### Phase 4: Optimization
- Performance optimization
- Accessibility improvements
- Add advanced features (tags, sorting)

## Configuration Options

### Generator Config
```json
{
  "input": "projects.json",
  "output": "dist/index.html",
  "templateDir": "templates/",
  "assetsDir": "assets/",
  "screenshotDir": "../screenshots/",
  "baseUrl": "../"
}
```

### Customization
- **Themes**: Swap CSS files for different visual styles
- **Layout**: Configure grid columns and card sizes
- **Content**: Customize which metadata fields to display
- **Behavior**: Enable/disable features like search or modal