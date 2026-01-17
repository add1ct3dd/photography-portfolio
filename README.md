<img src="https://i.imgur.com/ZG4gSnb.jpeg" alt="demo"/>

# Photography Portfolio
A modern Jekyll website for photographers

## v1.0 - Modern Rewrite
This is a complete modernization of the photography portfolio template with significant performance improvements and modern web technologies:

### Major Updates
- **Removed jQuery** - 77.7% JavaScript reduction (142.4 KB → 31.68 KB)
- **Replaced Poptrox with TypeScript** - Native HTML5 `<dialog>` API for modern lightbox experience
- **Optimized CSS** - 86% reduction (33.7 KB → 4.9 KB) by removing unused template components
- **GPU-Accelerated Animations** - Smooth transitions and fade effects with `will-change` and `transform: translate3d`
- **Dynamic Lightbox Sizing** - Responsive dialog that scales to image aspect ratio
- **Improved UX** - Click outside to close panels, keyboard navigation (ESC, Arrow keys)
- **TypeScript Support** - Full TypeScript compilation with ES2020 target

## Highlights
1. Easy setup and you get a website of your own for __free__. No web hosting charges too.
2. To add new pictures, you need to just upload them. __No code__ changes required.
3. See EXIF data like __aperture, shutter speed, iso__ etc. when you click on any image. Customizable metadata display.
4. Fast and modern - no jQuery dependency, optimized CSS and JavaScript bundle

## Quick Start
If you know a tad about tech and love taking pictures then this open-source project may help you setup a website to showcase
all your creations without effort. And not just that, with this you need not pay a single dime to host your website as
it's hosted by GitHub for __free__.

**Just follow the below steps and your website would be live in no time:**

1. Fork this repo by hitting the `Fork` button at the top right corner.
2. Enable github pages from the repo settings.
3. Upload your pictures to `images/fulls` and `images/thumbs` directory. _You can do that on github.com itself or you can clone and push the images to your repo._
4. Add your own custom domain in `CNAME` file or just remove the file if you don't own a domain and use the default domain that github provides ([yourusername].github.io/photography-portfolio).
5. Update `baseurl` field in `_config.yml` file with whatever domain you used in step 4.
6. Update site metadata in `_config.yml` (title, author, social links, etc.)
7. And that's it, your website is set. Push your changes and visit your live site!

## Run the website locally to test
```bash
$ npm install          # install all dependencies
$ npm run dev          # starts webpack watch + Jekyll serve
```

Then open [http://localhost:4000](http://localhost:4000) in your browser.
## Available Scripts

```bash
npm run build       # Build CSS + Jekyll site
npm run build:css   # Build CSS only (Gulp: TypeScript, SASS, minify)
npm run build:prod  # Build production with HTML minification and Gzip compression
npm run dev         # Start development server with watch mode (SASS + Jekyll)
npm run watch       # Watch SASS changes and recompile
npm run serve       # Start Jekyll development server (http://localhost:4000)
npm run resize      # Generate responsive image variants (Sharp)
npm run resize:full # Full regeneration of all responsive images
npm run lint        # Run ESLint on TypeScript and JavaScript files
```

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server with live reloading
npm run dev

# In another terminal, you can watch individual assets
npm run watch
```

The dev server automatically:
- Recompiles TypeScript and SASS on file changes
- Regenerates the Jekyll site
- Enables source maps for easier debugging (see `tsconfig.dev.json`)
- Runs on http://localhost:4000

### Building for Production
```bash
# Production build with all optimizations
npm run build:prod
```

This runs:
1. **TypeScript compilation** - Compiles TS to minified ES2020 JavaScript
2. **SASS compilation** - Compiles SCSS to compressed CSS
3. **JavaScript minification** - Transpiles and minifies with Babel + UglifyJS
4. **CSS minification** - Minifies CSS files
5. **Asset hashing** - Generates cache-busting hashes for CSS/JS
6. **HTML minification** - Minifies Jekyll output HTML (using html-minifier-terser)
7. **Gzip compression** - Pre-compresses assets for server delivery

### Adding New Images

The project uses **Sharp** for responsive image generation:

```bash
# 1. Add your high-resolution images to images/source/
# 2. Run the resize task
npm run resize

# This generates responsive variants:
# - Thumbnails: 200px, 400px, 840px widths
# - Full images: 600px, 1200px, 2400px, 3440px widths
# - Formats: JPEG (baseline), WebP (25-35% smaller), AVIF (30-40% smaller)
```

Images are organized in:
```
images/
├── source/              # Original high-res images (not committed)
├── thumbs/
│   ├── avif/           # WebP and AVIF variants
│   └── webp/
└── fulls/
    ├── avif/
    └── webp/
```

### Configuration

#### Build Configuration (gulpfile.mjs)
- **TypeScript**: Compiles assets/ts → assets/js (ES2020, strict mode)
- **SASS**: assets/sass → assets/css (compressed output)
- **Babel**: Transpiles modern JS to ES2020 compatible code
- **Sharp**: Responsive image generation with 3 formats

Key TypeScript settings in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",           // Modern browser target
    "strict": true,               // Full type checking
    "sourceMap": false,           // Disabled in production
    "declaration": true,          // Generate .d.ts files
    "outDir": "./assets/js"       // Output directory
  }
}
```

For development with source maps, use `tsconfig.dev.json`:
```bash
# Source maps are enabled for debugging
npx tsc -p tsconfig.dev.json
```

#### Jekyll Configuration (_config.yml)
- Build settings and site metadata
- Permalink structure
- Markdown rendering options
- Plugin configuration

#### SASS Architecture (assets/sass/)
```
sass/
├── main.scss              # Main stylesheet (@import all modules)
├── custom.scss            # Custom overrides and footer styling
├── noscript.scss          # No-JavaScript fallback styles
├── base/                  # Reset, typography, page layout
├── components/            # Reusable components (icon, panel, lightbox, etc.)
├── layout/                # Page structure (header, footer, main, wrapper)
└── libs/                  # Variables, functions, mixins, breakpoints
```

## Build Performance

Current optimizations:
- **CSS**: 86% smaller (4.9 KB vs 33.7 KB template)
- **JavaScript**: 77.7% smaller (31.68 KB vs 142.4 KB template)
- **Images**: Responsive variants in WebP/AVIF (25-40% smaller than JPEG)
- **Caching**: Asset hashes for long-term cache busting
- **Compression**: Gzip pre-compression for web servers

## Quality Assurance

### Linting
```bash
npm run lint
```

Checks:
- ESLint (@eslint/js) for JavaScript code quality
- TypeScript strict mode type checking
- Prettier formatting (configured in .prettierrc)

### Type Safety
- Full TypeScript with JSDoc type hints in gulpfile.mjs
- Type definitions installed for all major dependencies
- Strict mode enabled to catch common errors

### Security
- Replaced vulnerable html-minifier with html-minifier-terser
- Regular npm audit to identify vulnerabilities
- No untrusted dependencies in build pipeline

## Technology Stack

| Layer            | Technology                 | Purpose                             |
| ---------------- | -------------------------- | ----------------------------------- |
| **Static Site**  | Jekyll 4.x                 | Fast, secure static site generation |
| **Styling**      | SASS 1.97                  | Preprocessor for organized CSS      |
| **JavaScript**   | TypeScript 5.3             | Type-safe development               |
| **Build**        | Gulp 4                     | Task orchestration                  |
| **Images**       | Sharp 0.34                 | Responsive image generation         |
| **Optimization** | Babel, UglifyJS, clean-css | Transpilation and minification      |
| **Linting**      | ESLint, Prettier           | Code quality                        |



## Credits & Attribution

This project was originally based on [rampatra/photography](https://github.com/rampatra/photography) - a photography portfolio template built with Jekyll. 

The v1.0 rewrite modernizes and completely restructures the codebase with:
- Modern JavaScript/TypeScript instead of jQuery
- Updated build pipeline with Gulp 4
- Significantly reduced CSS and JavaScript bundles
- GPU-accelerated animations
- Improved accessibility and user experience

Special thanks to [rampatra](https://github.com/rampatra) for the original template foundation.
