'use strict';

var gulp = require('gulp');

var gulpTemplateCache = require('gulp-angular-templatecache');

gulp.task('templates', function () {
  return gulp.src('./src/templates/**/*.html')
      .pipe(gulpTemplateCache({
          module: 'irontec.simpleChat'
      }))
      .pipe(gulp.dest('./src/scripts'));
});

gulp.task('custom-template', function () {
    return gulp.src('./sample/chatTemplate.html')
        .pipe(gulpTemplateCache('chatTemplate.js', {
            module: 'irontec.simpleChat'
        }))
        .pipe(gulp.dest('./sample'));
});