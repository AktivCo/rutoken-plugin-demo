var browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    del = require('del'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify-es').default;

gulp.task('clean', function () {
	return del(['build']);
});

gulp.task('pages', function () {
	return gulp.src('src/*.html')
		.pipe(gulp.dest('build'));
});

gulp.task('libs', function () {
	return gulp.src('src/libs/**')
		.pipe(gulp.dest('build/libs'));
});

gulp.task('deps', gulp.series('libs', function () {
	return browserify('src/dependencies.js')
		.bundle()
		.pipe(source('dependencies.js'))
		.pipe(buffer())
		.pipe(uglify())
        .on('error', console.error)
		.pipe(gulp.dest('build/'));
}));

gulp.task('scripts', gulp.series('deps', function () {
	return gulp.src(['src/present.js', 'src/cmc.js'])
		.pipe(gulp.dest('build/'));
}));

gulp.task('styles', function () {
	return gulp.src('src/*.css')
		.pipe(gulp.dest('build/'));
});

gulp.task('images', function () {
	return gulp.src('src/images/*.png')
		.pipe(gulp.dest('build/images'));
});

gulp.task('default', gulp.series('clean', 'pages', 'scripts', 'styles', 'images', function (done) {
    done();
}));

