'use strict';

var gulp = require('gulp');

gulp.task('watch', ['styles', 'templates'], function () {
  gulp.watch(['./sample/**/*.html'], ['serve-reload']);
  gulp.watch(['./src/**/*.js', './sample/**/*.js'], ['serve-reload']);
  gulp.watch(['./src/**/*.css', './sample/**/*.css'], ['serve-reload']);

  gulp.watch(['./src/**/*.html'], ['templates-reload']);
  gulp.watch(['./src/**/*.scss'], ['sass-reload']);
});
