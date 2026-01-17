import gulp from 'gulp';
import sharp from 'sharp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import filter from 'gulp-filter';
import cleanCSS from 'clean-css';
import { spawn } from 'child_process';
import path from 'path';
import del from 'del';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

const sass = gulpSass(dartSass);

gulp.task('delete', function () {
    return;
    // return del(['images/fulls/*', 'images/thumbs/*']);
});

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
            console.log(`   ✓ Generated variants (3 sizes × 3 formats)\n`);
        } catch (err) {
            console.error(`   ✗ Error processing ${file}:`, err.message, `\n`);
        }
    }
    console.log(`✅ Image generation complete! Generated ${totalVariants} variants from ${totalImages} sources.\n`);
});

// compile scss to css
gulp.task('sass', function () {
    return gulp.src('./assets/sass/**/*.scss')  // Target all .scss files
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(rename(function (path) {
            path.basename += '.min';  // Append .min to the output filename
        }))
        .pipe(gulp.dest('./assets/css'));  // Output to the CSS directory
});

// minify standalone css files (custom-properties now merged into main.scss)
gulp.task('minify-css', async function () {
    const cssFiles = [];
    
    for (const file of cssFiles) {
        try {
            const input = await fsPromises.readFile(file, 'utf-8');
            const output = new (await import('clean-css')).default().minify(input);
            const outputFile = file.replace('.css', '.min.css');
            await fsPromises.writeFile(outputFile, output.styles);
            console.log(`Minified: ${outputFile}`);
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

// build task
gulp.task('build', gulp.series('compile-ts', 'sass', 'minify-css', 'minify-js'));

// resize images
gulp.task('resize', gulp.series('resize-images'));

// default task
gulp.task('default', gulp.series('build', 'resize'));