var browserify = require('browserify'),
    babelify = require('babelify'),
    buffer = require('vinyl-buffer'),
    del = require('del'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify-es').default;

function clean () {
    return del(['build']);
};

function pages () {
    return gulp.src('src/*.html')
        .pipe(gulp.dest('build'));
};

function libs () {
    return gulp.src('src/libs/**')
        .pipe(gulp.dest('build/libs'));
};

function deps () {
    return browserify('src/dependencies.js')
        .add(require.resolve('babel-polyfill'))
        .transform('babelify', {presets: ["@babel/preset-env"], plugins:['@babel/plugin-transform-classes']})
        .bundle()
        .pipe(source('dependencies.js'))
        .pipe(buffer())
        .pipe(uglify())
        .on('error', console.error)
        .pipe(gulp.dest('build/'));
};

function scripts () {
    return gulp.src(['src/present.js', 'src/asn1Utils.js'])
        .pipe(gulp.dest('build/'));
};

function styles () {
    return gulp.src('src/*.css')
        .pipe(gulp.dest('build/'));
};

function images () {
    return gulp.src('src/images/*.png')
        .pipe(gulp.dest('build/images'));
};

buildScripts = gulp.series(libs, deps, scripts)
exports.default = gulp.series(clean, gulp.parallel(pages, buildScripts, styles, images));
