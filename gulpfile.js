var gulp = require('gulp');
var panini = require('panini');
var browser = require('browser-sync');
var babel = require('gulp-babel');
var path = require('path');

var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'uglify-save-license', 'del']
});

var less = require('gulp-less');
var inject = require('gulp-inject');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var gutil = require('gulp-util');

function pages() {
    return gulp.src('./src/app/pages/**/*.html')
        .pipe(panini({
            root: 'src/app/pages/',
            layouts: 'src/app/layouts/',
            partials: 'src/app/partials/',
            data: 'src/app/data/',
            helpers: 'src/app/helpers/',
            pageLayouts: {
                // All pages inside src/pages/blog will use the blog.html layout
                'plp': '2columns-left',
                'account': '2columns-left'
            }
        }))
        .pipe(gulp.dest('./dist/app'))
}

function copy() {
    return gulp.src('./src/app/assets/img/!*')
        .pipe(gulp.dest('./dist/app'))
}

function styles() {
    var lessOptions = {
        style: 'expanded'
    };

    var injectFiles = gulp.src([
        path.join('./src/app/**/*.less'),
        path.join('!' + './src/app/**/_*.less'),
        path.join('!' + './src/app/assets/index.less')
    ], { read: false });

    var injectOptions = {
        transform: function(filePath) {
            filePath = filePath.replace('./src/app/**/assets/less', '');
            return '@import "' + filePath + '";';
        },
        starttag: '// injector',
        endtag: '// endinjector',
        addRootSlash: false
    };

    return gulp.src([
        path.join('./src/app/assets/index.less')
    ])
        .pipe(inject(injectFiles, injectOptions))
        .pipe(sourcemaps.init())
        .pipe(less(lessOptions)).on('error', errorHandler('Less'))
        .pipe(autoprefixer()).on('error', errorHandler('Autoprefixer'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.join('dist/app')))
        .pipe(browser.reload({ stream: true }));
}

function JavaScript() {
    return gulp.src('.src/app/**/js/*.js')
        .pipe(gulp.dest('./dist/app/js'))
}

function resetPages(done) {
    panini.refresh()
    done()
}

function server(done) {
    browser.init({
        server: 'dist/app',
        port: 9999
    })
    done()
}

/**
 *  Common implementation for an error handler of a Gulp plugin
 */
function errorHandler(title) {
    'use strict';

    return function(err) {
        gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
        this.emit('end');
    };
};

function watch() {
    gulp.watch('./src/app/assets/img/!*', copy)
    gulp.watch(['./src/app/pages/*.html']).on('all', gulp.series(resetPages, pages, browser.reload))
    gulp.watch(['./src/app/{layouts,pages,partials,helpers,data}/**/*.html']).on('all', gulp.series(resetPages, pages, browser.reload))
    gulp.watch('./src/app/**/*.less').on('all', styles, browser.reload)
    gulp.watch('./src/app/**/*.js').on('all', gulp.series(JavaScript, browser.reload))
}

function clean() {
    return $.del([path.join('./dist/')]);
}

gulp.task('build', gulp.parallel(pages, JavaScript, styles, copy));
gulp.task('default', gulp.series(clean, 'build', gulp.parallel(server, watch)));
gulp.task('clean', gulp.series(clean));

