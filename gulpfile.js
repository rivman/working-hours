// Load modules
var cssmin = require('gulp-clean-css')
var concat = require('gulp-concat')
var connect = require('gulp-connect')
var del = require('del')
var gulp = require('gulp')
var htmlmin = require('gulp-htmlmin')
var imagemin = require('gulp-imagemin')
var replace = require('gulp-replace')
var streamify = require('gulp-streamify')
var uglify = require('gulp-uglify')
var run = require('run-sequence')
var pkg = require('./package.json')

// Start development server
gulp.task('dev', function () {
  connect.server({
    root: './src',
    port: 8080
  })
})

// Delete dist folder
gulp.task('delete-dist', function (cb) {
  del.sync(['./dist'])
  cb()
})

// Build - CSS vendor
gulp.task('css-vendor', function (cb) {
  gulp.src('./src/css/*.min.css')
    .pipe(concat('vendor.min.css'))
    .pipe(cssmin({keepSpecialComments: 0}))
    .pipe(gulp.dest('./dist/css'))
    .on('end', cb)
})

// Build - CSS app
gulp.task('css-app', function (cb) {
  gulp.src('./src/css/app.css')
    .pipe(concat('app.min.css'))
    .pipe(cssmin({keepSpecialComments: 0}))
    .pipe(gulp.dest('./dist/css'))
    .on('end', cb)
})

// Build - Fonts
gulp.task('fonts', function (cb) {
  gulp.src('./src/fonts/*')
    .pipe(gulp.dest('./dist/fonts'))
    .on('end', cb)
})

// Build - Images
gulp.task('images', function (cb) {
  gulp.src('./src/img/*')
    .pipe(imagemin())
    .pipe(gulp.dest('./dist/img'))
    .on('end', cb)
})

// Build - JS vendor
gulp.task('js-vendor', function (cb) {
  gulp.src('./src/js/*.min.js')
    .pipe(concat('vendor.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./dist/js'))
    .on('end', cb)
})

// Build - JS app
gulp.task('js-app', function (cb) {
  gulp.src('./src/js/app.js')
    .pipe(concat('app.min.js'))
    .pipe(replace(/console\.log\((.+)\);/g, ''))
    .pipe(streamify(uglify({mangle: {toplevel: true}})))
    .pipe(gulp.dest('./dist/js'))
    .on('end', cb)
})

// Build - HTML
gulp.task('html', function (cb) {
  gulp.src('./src/index.html')
    .pipe(replace(/<script(.+)><\/script>/g, ''))
    .pipe(replace(/<link(.+)rel="stylesheet"(.+)\/>/g, ''))
    .pipe(replace('{version}', pkg.version))
    .pipe(replace('</head>', '<link rel="stylesheet" href="css/vendor.min.css" /><link rel="stylesheet" href="css/app.min.css" /></head>'))
    .pipe(replace('</body>', '<script src="js/vendor.min.js"></script><script src="js/app.min.js"></script></body>'))
    .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
    .pipe(gulp.dest('./dist'))
    .on('end', cb)
})

// Build config.json
gulp.task('json', function (cb) {
  gulp.src('./src/config*.json')
    .pipe(gulp.dest('./dist'))
    .on('end', cb)
})

// Build all
gulp.task('build', function (cb) {
  run('delete-dist',
      ['js-vendor', 'js-app', 'css-vendor', 'css-app', 'fonts', 'images', 'html', 'json'],
      cb)
})
