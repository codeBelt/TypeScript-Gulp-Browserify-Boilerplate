// http://www.davidkudera.com/2015/02/28/typescript-gulp-bower-browserify/

//https://www.airpair.com/typescript/posts/typescript-development-with-gulp-and-sublime-text

var gulp = require('gulp');
var typescript = require('gulp-typescript');

gulp.task('default', function() {
    return gulp.src([__dirname + '/src/assets/scripts/**/*.ts'])
        .pipe(typescript({
            module: 'commonjs',
            removeComments: false
        }))
        .pipe(gulp.dest(__dirname + '/www/public'))
});