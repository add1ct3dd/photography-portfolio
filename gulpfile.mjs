// @ts-check
/**
 * Build system for photography portfolio
 * Includes: Sass compilation, image resizing, JS transpilation, and asset hashing
 * 
 * IMPORTANT: This file uses @ts-check for TypeScript checking with JSDoc type hints.
 * Type definitions are installed to catch API changes in dependencies:
 * - @types/node: Node.js APIs (fs, path, child_process, crypto)
 * - @types/gulp: Gulp task API
 * - @types/gulp-rename, @types/gulp-gzip, @types/gulp-uglify: Gulp plugin APIs
 * 
 * Version-specific configurations:
 * - gulp-sass 6.0.0+: Uses 'style' option, not 'outputStyle'
 * - del 8.0.0+: Uses named export 'deleteAsync' instead of default export
 */

import gulp from 'gulp';
import sharp from 'sharp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import filter from 'gulp-filter';
import gzip from 'gulp-gzip';
import { deleteAsync } from 'del';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';

const sass = gulpSass(dartSass);

gulp.task('resize-images', async function () {
    const sourceDir = 'images/source';

    // Define responsive breakpoints for photography portfolio
    // Thumbnails: mobile, tablet, desktop
    // Full images: mobile, tablet, desktop, ultra-high-res
    const sizes = [
        { name: 'thumbs', widths: [200, 400, 840], quality: { jpeg: 90, webp: 88, avif: 85 } },
        { name: 'fulls', widths: [600, 1200, 2400, 3440], quality: { jpeg: 95, webp: 94, avif: 92 } }
    ];

    // Ensure output directories exist
    for (const size of sizes) {
        await fsPromises.mkdir(`images/${size.name}`, { recursive: true });
        // Create format subdirectories
        await fsPromises.mkdir(`images/${size.name}/webp`, { recursive: true });
        await fsPromises.mkdir(`images/${size.name}/avif`, { recursive: true });
    }

    // Get all image files from source directory
    const files = await fsPromises.readdir(sourceDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

    const totalImages = imageFiles.length;
    const totalFormats = 3; // JPEG, WebP, AVIF
    const totalSizeVariants = sizes.reduce((sum, s) => sum + s.widths.length, 0); // 7 total (3+4)
    const totalVariants = totalImages * totalFormats * totalSizeVariants;

    console.log(`\n📸 Processing ${totalImages} images for responsive delivery...`);
    console.log(`   Total variants to generate: ${totalVariants} (${totalImages} images × ${totalFormats} formats × ${totalSizeVariants} sizes)\n`);

    let processedImages = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(sourceDir, file);
        const baseName = path.parse(file).name;

        // Check if this image has already been processed (incremental check)
        const existingFile = path.join('images/fulls', `${baseName}-3440w.jpg`);
        if (fs.existsSync(existingFile)) {
            // Image already processed, skip
            console.log(`[${imageFiles.indexOf(file) + 1}/${totalImages}] Skipping: ${baseName} (already generated)`);
            continue;
        }

        processedImages++;
        const progress = ((processedImages / imageFiles.filter(f => !fs.existsSync(path.join('images/fulls', `${path.parse(f).name}-3440w.jpg`))).length) * 100).toFixed(1);
        console.log(`[${processedImages} new - ${progress}%] Processing: ${baseName}`);

        try {
            for (const sizeConfig of sizes) {
                for (const width of sizeConfig.widths) {
                    // JPEG - baseline format
                    await sharp(inputPath)
                        .resize(width, null, { withoutEnlargement: true })
                        .withMetadata()
                        .jpeg({ quality: sizeConfig.quality.jpeg, progressive: true })
                        .toFile(path.join(`images/${sizeConfig.name}`, `${baseName}-${width}w.jpg`));

                    // WebP - modern format (25-35% smaller than JPEG)
                    await sharp(inputPath)
                        .resize(width, null, { withoutEnlargement: true })
                        .withMetadata()
                        .webp({ quality: sizeConfig.quality.webp })
                        .toFile(path.join(`images/${sizeConfig.name}/webp`, `${baseName}-${width}w.webp`));

                    // AVIF - next-gen format (30-40% smaller than JPEG)
                    await sharp(inputPath)
                        .resize(width, null, { withoutEnlargement: true })
                        .withMetadata()
                        .avif({ quality: sizeConfig.quality.avif })
                        .toFile(path.join(`images/${sizeConfig.name}/avif`, `${baseName}-${width}w.avif`));
                }
            }
            console.log(`   ✓ Generated variants (7 sizes × 3 formats)\n`);
        } catch (err) {
            console.error(`   ✗ Error processing ${file}:`, err.message, `\n`);
        }
    }

    if (processedImages === 0) {
        console.log(`✅ All images already processed! No new variants generated.\n`);
    } else {
        console.log(`✅ Image generation complete! Generated ${processedImages * totalSizeVariants} new variants from ${processedImages} new images.\n`);
    }
});

// Full regeneration task - deletes all generated images and regenerates from source
gulp.task('resize-images-full', async function () {
    const sourceDir = 'images/source';

    // Define responsive breakpoints for photography portfolio
    const sizes = [
        { name: 'thumbs', widths: [200, 400, 840], quality: { jpeg: 90, webp: 88, avif: 85 } },
        { name: 'fulls', widths: [600, 1200, 2400, 3440], quality: { jpeg: 95, webp: 94, avif: 92 } }
    ];

    // Delete all generated images
    console.log(`\n🗑️  Clearing existing generated images...\n`);
    for (const size of sizes) {
        await deleteAsync([`images/${size.name}/**`, `!images/${size.name}`]);
    }

    // Ensure output directories exist
    for (const size of sizes) {
        await fsPromises.mkdir(`images/${size.name}`, { recursive: true });
        await fsPromises.mkdir(`images/${size.name}/webp`, { recursive: true });
        await fsPromises.mkdir(`images/${size.name}/avif`, { recursive: true });
    }

    // Get all image files from source directory
    const files = await fsPromises.readdir(sourceDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

    const totalImages = imageFiles.length;
    const totalFormats = 3; // JPEG, WebP, AVIF
    const totalSizeVariants = sizes.reduce((sum, s) => sum + s.widths.length, 0); // 7 total (3+4)
    const totalVariants = totalImages * totalFormats * totalSizeVariants;

    console.log(`\n📸 Regenerating all images for responsive delivery...`);
    console.log(`   Total variants to generate: ${totalVariants} (${totalImages} images × ${totalFormats} formats × ${totalSizeVariants} sizes)\n`);

    let processedImages = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(sourceDir, file);
        const baseName = path.parse(file).name;
        processedImages++;

        const progress = ((processedImages / totalImages) * 100).toFixed(1);
        console.log(`[${processedImages}/${totalImages} - ${progress}%] Processing: ${baseName}`);

        try {
            for (const sizeConfig of sizes) {
                for (const width of sizeConfig.widths) {
                    // JPEG - baseline format
                    await sharp(inputPath)
                        .resize(width, null, { withoutEnlargement: true })
                        .withMetadata()
                        .jpeg({ quality: sizeConfig.quality.jpeg, progressive: true })
                        .toFile(path.join(`images/${sizeConfig.name}`, `${baseName}-${width}w.jpg`));

                    // WebP - modern format (25-35% smaller than JPEG)
                    await sharp(inputPath)
                        .resize(width, null, { withoutEnlargement: true })
                        .withMetadata()
                        .webp({ quality: sizeConfig.quality.webp })
                        .toFile(path.join(`images/${sizeConfig.name}/webp`, `${baseName}-${width}w.webp`));

                    // AVIF - next-gen format (30-40% smaller than JPEG)
                    await sharp(inputPath)
                        .resize(width, null, { withoutEnlargement: true })
                        .withMetadata()
                        .avif({ quality: sizeConfig.quality.avif })
                        .toFile(path.join(`images/${sizeConfig.name}/avif`, `${baseName}-${width}w.avif`));
                }
            }
            console.log(`   ✓ Generated variants (7 sizes × 3 formats)\n`);
        } catch (err) {
            console.error(`   ✗ Error processing ${file}:`, err.message, `\n`);
        }
    }
    console.log(`✅ Full regeneration complete! Generated ${totalVariants} variants from ${totalImages} sources.\n`);
});

// compile scss to css
/**
 * Compiles Sass files to compressed CSS with proper cache-busting names
 * Uses dart-sass with gulp-sass 6.0.0 (note: uses 'style' not 'outputStyle')
 * @see https://github.com/dlmanning/gulp-sass#options
 */
gulp.task('sass', function () {
    return gulp.src('./assets/sass/**/*.scss')  // Target all .scss files
        .pipe(sass.sync({ 
            style: 'compressed',  // gulp-sass 6.0.0+ uses 'style', not 'outputStyle'
            quietDeps: true,  // Suppress warnings from dependencies
            silenceDeprecations: ['import']  // Suppress @import deprecation warnings
        }).on('error', sass.logError))
        .pipe(rename(function (path) {
            path.basename += '.min';  // Append .min to the output filename
        }))
        .pipe(gulp.dest('./assets/css'));  // Output to the CSS directory
});

// minify standalone css files (custom-properties now merged into main.scss)
gulp.task('minify-css', async function () {
    const cssFiles = [];
    const CleanCSS = (await import('clean-css')).default;

    for (const file of cssFiles) {
        try {
            const input = await fsPromises.readFile(file, 'utf-8');
            const output = new CleanCSS().minify(input);
        } catch (err) {
            console.error(`Error minifying ${file}:`, err.message);
        }
    }
});

// watch changes in scss files and run sass task
gulp.task('sass:watch', function () {
    gulp.watch('./assets/sass/**/*.scss', gulp.series('sass'));
});

// transpile and minify js with babel
/**
 * Transpiles JavaScript with Babel (ES6+ to ES5 compatible)
 * Minifies with UglifyJS and adds .min suffix to output filenames
 * Skips already-minified files (.min.js)
 */
gulp.task('minify-js', function () {
    return gulp.src('./assets/js/**/*.js')
        .pipe(filter(function (file) {
            const filePath = file.path;
            const basename = path.basename(filePath, '.js');

            // Skip files that are already minified
            return !basename.endsWith('.min');
        }))
        .pipe(babel({
            presets: [['@babel/preset-env', { modules: false }]],
            compact: true
        }))
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.basename += '.min';
            path.extname = '.js';
        }))
        .pipe(gulp.dest('./assets/js'));
});

// compile typescript (optional - only if tsc is available)
gulp.task('compile-ts', function (done) {
    try {
        const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        const tsc = spawn(command, ['tsc'], { stdio: 'inherit', shell: true });

        tsc.on('close', (code) => {
            if (code === 0) {
                console.log('[TypeScript] Compiled successfully');
            } else if (code === 127) {
                console.log('[TypeScript] TypeScript not found - skipping compilation');
            } else {
                console.warn(`[TypeScript] Compilation exited with code ${code}`);
            }
            done();
        });

        tsc.on('error', (err) => {
            console.log('[TypeScript] TypeScript not available - skipping: ' + err.message);
            done();
        });
    } catch (err) {
        console.log('[TypeScript] Skipping TypeScript compilation: ' + err.message);
        done();
    }
});

// Generate cache-busting hashes for CSS and JS files
gulp.task('generate-hashes', async function () {
    const jsFiles = [
        'assets/js/icons.js',
        'assets/js/browser.min.js',
        'assets/js/breakpoints.min.js',
        'assets/js/exif.min.js',
        'assets/js/main.min.js',
        'assets/js/lightbox.min.js'
    ];

    const cssFiles = [
        'assets/css/custom.min.css',
        'assets/css/main.min.css',
        'assets/css/noscript.min.css'
    ];

    const hashes = {};

    // Generate hashes for JS files
    for (const file of jsFiles) {
        if (fs.existsSync(file)) {
            const content = await fsPromises.readFile(file);
            const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
            hashes[file] = hash;
        }
    }

    // Generate hashes for CSS files
    for (const file of cssFiles) {
        if (fs.existsSync(file)) {
            const content = await fsPromises.readFile(file);
            const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
            hashes[file] = hash;
        }
    }

    // Write hashes to Jekyll data file
    const dataDir = '_data';
    await fsPromises.mkdir(dataDir, { recursive: true });
    await fsPromises.writeFile(
        path.join(dataDir, 'asset-hashes.json'),
        JSON.stringify(hashes, null, 2)
    );

    console.log('\n📦 Generated asset cache-busting hashes:\n');
    Object.entries(hashes).forEach(([file, hash]) => {
        console.log(`   ${file}: ${hash}`);
    });
    console.log('\n   Hashes written to _data/asset-hashes.json\n');
});

// Precompress assets with gzip (level 9 - maximum)
gulp.task('precompress:gzip', () => {
    return gulp.src(['assets/**/*.{js,css,svg}', '_site/**/*.{js,css,svg}'], { allowEmpty: true })
        .pipe(gzip({ gzipOptions: { level: 9 } }))
        .pipe(gulp.dest((file) => file.base))
        .on('end', () => {
            console.log('\n✓ Gzip compression complete\n');
        });
});

// minify HTML in the built site
gulp.task('minify-html', async () => {
    const htmlFiles = await fsPromises.readdir('_site', { recursive: true });
    const HtmlMinifier = (await import('html-minifier')).minify;
    
    for (const file of htmlFiles) {
        if (!file.endsWith('.html')) continue;
        
        const filePath = path.join('_site', file);
        const stats = await fsPromises.stat(filePath);
        if (!stats.isFile()) continue;
        
        try {
            const input = await fsPromises.readFile(filePath, 'utf-8');
            const output = HtmlMinifier(input, {
                removeComments: true,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                sortAttributes: true,
                sortClassName: true
            });
            await fsPromises.writeFile(filePath, output);
        } catch (err) {
            console.error(`Error minifying ${filePath}:`, err.message);
        }
    }
    console.log('\n✓ HTML minification complete\n');
});

// build task
gulp.task('build', gulp.series('compile-ts', gulp.parallel('sass', 'minify-js'), 'minify-css', 'generate-hashes'));

// build with precompression for production
gulp.task('build:prod', gulp.series('build', 'minify-html', 'precompress:gzip'));

// resize images (incremental - only new images)
gulp.task('resize', gulp.series('resize-images'));

// resize images (full - regenerate all)
gulp.task('resize:full', gulp.series('resize-images-full'));

// default task
gulp.task('default', gulp.series('build', 'resize'));