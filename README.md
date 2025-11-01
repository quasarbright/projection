# 🎬 Projection

A modern static site generator that creates beautiful, interactive galleries to showcase your coding projects. Built with vanilla JavaScript and modern CSS, featuring search, filtering, dark theme, responsive design, and hot reloading for development.

## ✨ Features

- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🔍 Search & Filter** - Real-time search and tag-based filtering
- **🌙 Dark Theme** - Modern dark color scheme
- **⭐ Featured Projects** - Highlight your best work with special styling
- **🖼️ Background Images** - Project thumbnails as card backgrounds with gradient overlays
- **🏷️ Tagging System** - Organize projects with flexible tags (ANY/ALL filtering)
- **📊 Multiple Formats** - Support for both YAML and JSON configuration
- **🚀 Fast Generation** - Efficient static site generation
- **🔥 Hot Reloading** - Development server with automatic rebuild and refresh
- **🎨 No Framework Dependencies** - Pure HTML, CSS, and JavaScript

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0.0 or higher

### Installation

```bash
git clone https://github.com/quasarbright/quasarbright.github.io.git
cd quasarbright.github.io/p5js/project-display
npm install
```

### Usage

1. **Create your projects file** (YAML preferred, JSON supported):
   ```bash
   # Edit the existing projects.yaml or create your own
   cp projects.yaml my-projects.yaml
   ```

2. **Development with hot reloading**:
   ```bash
   npm run dev
   ```
   This will:
   - Build the site
   - Start a development server at http://localhost:8080
   - Watch for changes to `projects.yaml`
   - Auto-rebuild and refresh when you save changes

3. **Production build**:
   ```bash
   npm run build
   ```

4. **Serve locally**:
   ```bash
   npm run serve
   ```

## 📋 Available Scripts

- `npm run dev` - **🔥 Hot reloading development server** (recommended for development)
- `npm run build` - Generate the static site
- `npm run start` - Build and serve (one-time)
- `npm run serve` - Serve the generated site locally on port 8080
- `npm run watch` - Watch for changes and rebuild (no server)
- `npm run clean` - Remove the dist directory
- `npm run rebuild` - Clean and build

## 📁 Project Structure

```
projection/
├── assets/           # Static assets (favicon, etc.)
├── dist/            # Generated site (created by build)
├── scripts/         # JavaScript source files
│   ├── search.js    # Search functionality
│   ├── filter.js    # Filtering and sorting
│   └── modal.js     # Modal functionality (currently unused)
├── styles/          # CSS source files
│   ├── main.css     # Layout, theme, components, dark color scheme
│   ├── cards.css    # Project card styling, 3D hover effects, background images
│   └── modal.css    # Modal styling (currently commented out)
├── projects.yaml    # Your projects data (YAML format)
├── projects.json    # Alternative JSON format (auto-detected)
├── generator.js     # Main generator script
├── nodemon.json     # File watching configuration
└── package.json     # NPM configuration
```

## 🛠️ Configuration

### Projects File Format

Projection supports both YAML (preferred) and JSON formats. The generator will look for files in this order:
1. `projects.yaml`
2. `projects.yml` 
3. `projects.json`

#### YAML Example:
```yaml
config:
  title: "My Projects"
  description: "A showcase of my coding projects"
  baseUrl: "https://username.github.io/"
  itemsPerPage: 20

projects:
  - id: "awesome-project"
    title: "Awesome Project"
    description: "This project does amazing things"
    creationDate: "2024-01-15"
    tags: ["web", "javascript"]
    pageLink: "./awesome-project/"
    sourceLink: "https://github.com/username/awesome-project"
    thumbnailLink: "./screenshots/awesome.png"
    featured: true
```

#### JSON Example:
```json
{
  "config": {
    "title": "My Projects",
    "description": "A showcase of my coding projects",
    "baseUrl": "https://username.github.io/",
    "itemsPerPage": 20
  },
  "projects": [
    {
      "id": "awesome-project",
      "title": "Awesome Project",
      "description": "This project does amazing things",
      "creationDate": "2024-01-15",
      "tags": ["web", "javascript"],
      "pageLink": "./awesome-project/",
      "sourceLink": "https://github.com/username/awesome-project",
      "thumbnailLink": "./screenshots/awesome.png",
      "featured": true
    }
  ]
}
```

### Field Descriptions

#### Config Object:
- `title`: Site title displayed in header
- `description`: Site description and meta description
- `baseUrl`: Base URL for resolving relative links
- `itemsPerPage`: Number of projects per page (currently unused)

#### Project Object:
- `id`: Unique identifier (required)
- `title`: Project title (required)
- `description`: Brief project description (required, truncated with ellipsis on cards)
- `creationDate`: ISO date string (required)
- `tags`: Array of tags for filtering (required)
- `pageLink`: Link to project page (required)
- `sourceLink`: Link to source code (optional, shows "Source Code" button)
- `thumbnailLink`: Link to project screenshot (optional, used as card background)
- `featured`: Boolean to highlight special projects (optional, adds border and badge)

### Path Resolution

The `baseUrl` in config is used to resolve relative paths:

- **Relative paths** (`./path`, `../path`, `filename`) are resolved relative to `baseUrl`
- **Absolute paths** (`/path`) are used as-is
- **Full URLs** (`https://...`) are used as-is
- **Special handling**: For `baseUrl` ending in `/`, relative paths get appropriate prefixes

## 🎨 Customization

### Styling
- Edit files in `styles/` directory
- `main.css` - Layout, theme, components, dark color scheme
- `cards.css` - Project card styling, 3D hover effects, background images
- `modal.css` - Modal styling (currently commented out)

### Functionality
- Edit files in `scripts/` directory
- `search.js` - Real-time search with URL state management
- `filter.js` - Tag filtering (ALL logic), sorting, URL state management
- `modal.js` - Modal functionality (currently commented out for future use)

### Development Workflow
1. Edit `projects.yaml` to add/modify projects
2. Run `npm run dev` for hot reloading
3. Changes are automatically detected and rebuilt
4. Browser refreshes automatically

## 🚢 Deployment

The generated `dist/` directory contains everything needed for deployment:

```bash
npm run build
# Upload dist/ contents to your web server
```

Works with:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Live Demo](https://quasarbright.github.io/p5js/project-display/)
- [Source Code](https://github.com/quasarbright/quasarbright.github.io/tree/master/p5js/project-display)
- [Author's Projects](https://quasarbright.github.io/)

---

Built with ❤️ by [Mike Delmonaco](https://quasarbright.github.io/) 