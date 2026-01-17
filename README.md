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
npm run dev         # Start development server with watch mode
npm run watch       # Watch SASS changes
npm run serve       # Start Jekyll development server
npm run resize      # Resize images and generate thumbnails
```

## Credits & Attribution

This project was originally based on [rampatra/photography](https://github.com/rampatra/photography) - a photography portfolio template built with Jekyll. 

The v1.0 rewrite modernizes and completely restructures the codebase with:
- Modern JavaScript/TypeScript instead of jQuery
- Updated build pipeline with Gulp 4
- Significantly reduced CSS and JavaScript bundles
- GPU-accelerated animations
- Improved accessibility and user experience

Special thanks to [rampatra](https://github.com/rampatra) for the original template foundation.
