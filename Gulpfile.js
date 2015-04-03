// http://www.davidkudera.com/2015/02/28/typescript-gulp-bower-browserify/

//https://www.airpair.com/typescript/posts/typescript-development-with-gulp-and-sublime-text

var gulp = require('gulp');
var typescript = require('gulp-typescript');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var sourcemaps = require('gulp-sourcemaps');
var size = require('gulp-size');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var gulpIf = require('gulp-if');
var handlebars = require('gulp-handlebars');
var open = require('gulp-open');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var yuidoc = require("gulp-yuidoc");
var rename = require("gulp-rename");
var copy = require("gulp-copy");
var runSequence = require('run-sequence');
var header = require('gulp-header');
var mochaPhantomJS = require('gulp-mocha-phantomjs');


var DEV = 'development';
var PROD = 'production';
var env = DEV;
//var env = prcess.env.NODE_ENV || DEV;

var srcDir = './src/';
var outputDir = './web/';
var docsDir = './docs/';

var EXTERNAL_LIBS = [

];

var pkg = require('./package.json');

var banner = [
    '/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @author <%= pkg.author %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

gulp.task("external", function() {
    var paths = [];

    // Get just the path to each externalizable lib.
    _.forEach(EXTERNAL_LIBS, function(path) {
        paths.push(path);
    });

    return gulp.src(paths)
        // Log each file that will be concatenated into the common.js file.
        .pipe(size(SIZE_OPTS))
        // Concatenate all files.
        .pipe(concat("common.min.js"))
        // Minify the result.
        .pipe(uglify())
        // Log the new file size.
        .pipe(size(SIZE_OPTS))
        // Save that file to the appropriate location.
        .pipe(gulp.dest(APPS_DIST_DIR + "../lib/"));
});


function handleError(err) {
    console.log(err.toString());
    this.emit('end');
}

gulp.task('test', function () {
    return gulp.src('./tests/*.html')
        .pipe(mochaPhantomJS({ 'webSecurityEnabled': false, "outputEncoding": "utf8", "localToRemoteUrlAccessEnabled": true }))
        .on('error', handleError);
});


gulp.task('browserify', function () {
    // transform regular node stream to gulp (buffered vinyl) stream
    var browserified = transform(function(filename) {
        var b = browserify(filename);
        return b.bundle();
    });

    return gulp.src(outputDir + 'assets/scripts/AppBootstrap.js')
        .pipe(browserified)
        //.pipe(sourcemaps.init({loadMaps: true}))
        //.pipe(uglify())
        //.pipe(sourcemaps.write('./'))
        .pipe(rename('main.min.js'))
        //.pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest(outputDir +'assets/scripts/'))
        .pipe(size());
});

gulp.task('docs', function() {
    return gulp.src(srcDir + 'assets/scripts/**/*.js')
        .pipe(yuidoc({}, {
            themedir: './friendly-theme',
            extension: '.js',
            exclude: ''
        }))
        .pipe(gulp.dest(docsDir))
});

gulp.task('clean', function() {
    return gulp.src([outputDir, docsDir])
        .pipe(clean());
});

gulp.task('copy', function() {
    return gulp.src([
        srcDir + 'index.html'
    ])
        .pipe(gulp.dest(outputDir))
});

gulp.task('templates', function () {
    return gulp.src([srcDir + 'templates/**/*.hbs', srcDir + '!templates/**/_.hbs'])
        .pipe(handlebars())
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declare({
            namespace: 'JST.templates',
            noRedeclare: true, // Avoid duplicate declarations
            processName: function(filePath) {
                return filePath;
            }
        }))
        .pipe(concat('templates.js'))
        .pipe(gulp.dest(outputDir + 'scripts/'))
        .pipe(connect.reload())
});


// Lint Task
gulp.task('lint', function() {
    return gulp.src(srcDir + 'assets/scripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

//gulp.task('scripts', function() {
//    return gulp.src(srcDir + 'assets/scripts/main.js')
//        .pipe(browserify({debug: env === DEV}))
//        .pipe(gulpIf(env === PROD, uglify()))
//        .pipe(gulp.dest(outputDir + 'assets/scripts/'))
//        .pipe(connect.reload())
//});


gulp.task('sass', function() {
    var config = {};

    if (env === DEV) {
        config.sourceCommments = 'map';
    }

    if (env === PROD) {
        config.outputStyle = 'compressed';
    }

    return gulp.src(srcDir + 'assets/scss/*.scss')
        //.pipe(browserify({debug: env === DEV}))
        .pipe(sass(config))
        .pipe(gulp.dest(outputDir + 'assets/css/'))
        .pipe(connect.reload())
});


gulp.task('watch', function() {
    gulp.watch(srcDir + 'templates/**/*.hbs', ['templates']);
    gulp.watch(srcDir + 'assets/scripts/**/*.js', ['scripts']);
    gulp.watch(srcDir + 'assets/sass/**/*.scss', ['sass']);
});


gulp.task('connect', function () {
    return connect.server({
        root: outputDir,
        port: 8001,
        livereload: true
    });
});


gulp.task('open', function(){
    var options = {
        url: 'http://localhost:8001'
    };
    return gulp.src(outputDir + 'index.html')
        .pipe(open('<%file.path%>', options));
});

gulp.task('ts', function() {
    return gulp.src([srcDir + 'assets/scripts/**/*.ts'])
        .pipe(typescript({
            module: 'commonjs',
            removeComments: false
        }))
        .pipe(gulp.dest(outputDir +'assets/scripts/'))
        .pipe(size());
});


gulp.task('default', function() {
    runSequence(
        ['clean'],
        ['ts']
        //['lint', 'browserify', 'templates', 'sass', 'copy'],
        //['watch', 'connect', 'open']
    );
});

