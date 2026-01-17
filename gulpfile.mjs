import gulp from 'gulp';
import sharp from 'sharp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import filter from 'gulp-filter';
import path from 'path';
import del from 'del';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

const sass = gulpSass(dartSass);

gulp.task('delete', function () {
    return del(['images/*.*']);
});

gulp.task('resize-images', async function () {
    const imageDir = 'images';
    const fullsDir = 'images/fulls';
    const thumbsDir = 'images/thumbs';

    // Ensure output directories exist
    await fsPromises.mkdir(fullsDir, { recursive: true });
    await fsPromises.mkdir(thumbsDir, { recursive: true });

    // Get all image files
    const files = await fsPromises.readdir(imageDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

    for (const file of imageFiles) {
        const inputPath = path.join(imageDir, file);
        const fullOutputPath = path.join(fullsDir, file);
        const thumbOutputPath = path.join(thumbsDir, file);

        try {
            // Resize for fulls - high quality (92) with metadata preserved
            await sharp(inputPath)
                .resize(3440, null, { withoutEnlargement: true })
                .withMetadata()
                .jpeg({ quality: 92, progressive: true })
                .toFile(fullOutputPath);

            // Resize for thumbs - good quality (85) with metadata preserved
            await sharp(inputPath)
                .resize(840, null, { withoutEnlargement: true })
                .withMetadata()
                .jpeg({ quality: 85, progressive: true })
                .toFile(thumbOutputPath);

            console.log(`Resized: ${file}`);
        } catch (err) {
            console.error(`Error resizing ${file}:`, err.message);
        }
    }
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

// build task
gulp.task('build', gulp.series('sass', 'minify-js'));

// resize images
gulp.task('resize', gulp.series('resize-images', 'delete'));

// default task
gulp.task('default', gulp.series('build', 'resize'));