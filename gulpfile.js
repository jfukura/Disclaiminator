/**
 * Disclaiminator Gulpfile.js
 *
 * Author:  Jason Fukura
 * Version: 1.0.0
 * Date:    06/07/2017
 */


var gulp        = require( 'gulp' ),
    imagemin    = require( 'gulp-imagemin' ),
    cssmin      = require( 'gulp-cssmin' ),
    htmlmin     = require( 'gulp-htmlmin' ),
    uglify      = require( 'gulp-uglify' ),
    pump        = require( 'pump' ),
    // access      = require( 'gulp-accessibility' ),
    prettyData  = require( 'gulp-pretty-data' ),
    browserSync = require( 'browser-sync' ),
    reload      = browserSync.reload,
    serve       = require( 'gulp-serve' ),
    concat      = require( 'gulp-concat' ),
    sass        = require( 'gulp-sass' ),
    sequence    = require( 'run-sequence' );
//    argv        = require( 'minimist' )( process.argv.slice( 2 ) ),
//    exec        = require( 'child_process' ).exec;

var config      = {
    port      : 8888,
    build     : "dist",
    images    : {
        source : "img/*",
        target : "/img",
    },
    css       : {
        source : "css/*.css",
        target : "/css",
    },
    scss      : {
            source : "css/scss/**/*.scss",
            target : "css/",
        },
    js        : {
        // Your array of scripts to concatenate goes here (be sure to put
        // them in the order you need)
        concat : [ 'js/lib/jquery-2.1.0.min.js', 'js/lib/jquery-ui-1.10.4.custom.min.js', 'js/lib/utils.v2.js', 'js/lib/functions.js', 'js/lib/app.js', ],
        // What do you want the final file to be called?
        name   : 'app.js',
        target : "/js",
    },
    media     : {
        source : "media/*",
        target : "/media",
    },
    views     : {
        source : "views/*",
        target : "/views",
    },
    templates : {
        source : "templates/*",
        target : "/templates",
    },
    fonts     : {
        source : "fonts/*",
        target : "/fonts",
    },
    xml       : {
        source : "xml/*",
        target : "/xml",
    },
    html      : {
        source : "*.html",
        target : "/",
    },
};

/* ========================================================================== */
/* DEVELOPMENT TASKS                                                          */

// Compile SASS into an unminified CSS file
gulp.task( 'sass', function () {

    return gulp.src( config.scss.source )
        .pipe( sass().on( 'error', sass.logError ) )
        .pipe( gulp.dest( config.scss.target ) );

} )

// Concatenate scripts
gulp.task( 'concat-scripts', function () {

    return gulp.src( config.js.concat )
        .pipe( concat( config.js.name ) )
        .pipe( gulp.dest( config.js.target.replace( '/', '' ) ) );

} );

// Watch Files For Changes & Reload
gulp.task( 'serve', function () {

    browserSync( {
        notify : false,
        port : config.port,
        logPrefix : config.project + ' :: Dev',
        // https: true, // Can run on https if needed
        server : {
            baseDir: './',
            middleware: function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                next();
              }
          }
    } );


    // HTML pages, views and content (XML) changes will require a reload
    gulp.watch( [ '*.html', ], reload );
    gulp.watch( [ 'views/*.html', ], reload );
    gulp.watch( [ 'content/*', ], reload );

    // SCSS changes require concatenation and reload
    gulp.watch( [ 'css/scss/**/*.scss', ], function () {

        sequence( 'sass', reload );

    } );

    // Script changes require concatenation and reload
    gulp.watch( [ 'js/lib/*.js', ], function () {

        sequence( 'concat-scripts', reload );

    } );

    // Watch for changes to the images folder
    gulp.watch( [ 'img/**/*', ], reload );

} );
/* ========================================================================== */

/* ========================================================================== */
/* BUILD TASKS                                                                */

// Build the final html files
gulp.task( 'html', function () {

    return gulp.src( config.html.source )
        .pipe( htmlmin( {
            collapseWhitespace : true, // Collapse it
            removeComments     : true,     // No comments
            minifyJS           : true,            // Inlined JS will also minify
        } ) )
        .pipe( gulp.dest( config.build + config.html.target ) );

} );

// Build final images with optimization
// NOTE: [Image Build] -- Might need to address SVGs separately
gulp.task( 'img', function () {

    return gulp.src( config.images.source )
        .pipe( imagemin( {
            progressive : true,         // Run image minification
        } ) )
        .pipe( gulp.dest( config.build + config.images.target ) );

} );

// Build final CSS with minification
gulp.task( 'css', function () {

    return gulp.src( config.css.source )
        .pipe( cssmin() )
        .pipe( gulp.dest( config.build + config.css.target ) );

} );

// Build final JS files with minification
gulp.task( 'js', function () {

    pump( [
        gulp.src( config.js.target ),
        uglify(),
        gulp.dest( config.build + config.js.target ),
    ] );

} );

// Copy fonts to the DIST folder
gulp.task( 'fonts', function () {

    return gulp.src( config.fonts.source )
        .pipe( gulp.dest( config.build + config.fonts.target ) );

} );

// Build final content files (XML files that need minification)
gulp.task( 'content', function () {

    return gulp.src( config.content.source )
        .pipe( prettyData( {
            type             : 'minify',
            preserveComments : false,
        } ) )
        .pipe( gulp.dest( config.build + config.content.target ) );

} );

gulp.task( 'views', function () {

    return gulp.src( config.views.source )
    .pipe( htmlmin( { collapseWhitespace : true, } ) )
    .pipe( gulp.dest( config.build + config.views.target ) );

} );

gulp.task( 'templates', function () {

    return gulp.src( config.templates.source )
    .pipe( gulp.dest( config.build + config.templates.target ) );

} );

gulp.task( 'fonts', function () {

    return gulp.src( config.fonts.source )
    .pipe( gulp.dest( config.build + config.fonts.target ) );

} );

gulp.task( 'media', function () {

    return gulp.src( config.media.source )
    .pipe( gulp.dest( config.build + config.media.target ) );

} );

gulp.task( 'xml', function () {

    return gulp.src( config.xml.source )
    .pipe( prettyData( { type : 'minify', preserveComments : false, } ) )
    .pipe( gulp.dest( config.build + config.xml.target ) );

} );

// Start test server
gulp.task( 'test', function () {

    browserSync( {
        notify    : false,
        port      : config.port,
        logPrefix : config.project + ' :: Build Test',
        // https: true,
        server    : [ 'dist/', ],
    } );

} );

// RUN gulp build to handle the build process and start the test server
gulp.task( 'build', function () {

    return sequence( 'css', 'xml' );

} );

