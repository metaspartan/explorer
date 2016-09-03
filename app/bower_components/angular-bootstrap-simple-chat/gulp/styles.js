'use strict';

var gulp = require('gulp');
var gulpSass = require('gulp-sass');
var gulpAutoprefixer = require('gulp-autoprefixer');

gulp.task('styles', function () {
  return gulp.src('./src/sass/**/*.scss')
      .pipe(gulpSass({outputStyle: 'expanded'}).on('error', gulpSass.logError))
      .pipe(gulpAutoprefixer({
          browsers: ['last 2 versions'],
          cascade: false
      }))
      .pipe(gulp.dest('./src/css'));
});