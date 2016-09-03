/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

'use strict';

var gulp = require('gulp');
var requireDir = require('require-dir');
var tasks = requireDir('./gulp');

/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', function () {
  gulp.start('serve');
});
