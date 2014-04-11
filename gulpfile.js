var gulp = require('gulp');
var plugins = require("gulp-load-plugins")({lazy:false});

gulp.task('scripts', function(){
    //combine all js files of the web
    gulp.src(['!./web/**/*_test.js','./web/**/*.js'])
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(plugins.concat('app.js'))
        .pipe(gulp.dest('./app/web'));
});

gulp.task('templates',function(){
    //combine all template files of the web into a js file
    gulp.src(['!./web/index.html',
        './web/**/*.html'])
        .pipe(plugins.angularTemplatecache('templates.js',{standalone:true}))
        .pipe(gulp.dest('./app/web'));
});

gulp.task('css', function(){
    gulp.src('./web/**/*.css')
        .pipe(plugins.concat('app.css'))
        .pipe(gulp.dest('./app/web'));
});

gulp.task('vendorJS', function(){
    //concatenate vendor JS files
    gulp.src(['!./bower_components/**/*.min.js',
        './bower_components/**/*.js'])
        .pipe(plugins.concat('lib.js'))
        .pipe(gulp.dest('./app/web'));
});

gulp.task('vendorCSS', function(){
    //concatenate vendor CSS files
    gulp.src(['!./bower_components/**/*.min.css',
        './bower_components/**/*.css'])
        .pipe(plugins.concat('lib.css'))
        .pipe(gulp.dest('./app/web'));
});

gulp.task('copy-index', function() {
    gulp.src('./web/index.html')    
        .pipe(gulp.dest('./app/web'));
});

gulp.task('watch',function(){
    gulp.watch([
        'build/**/*.html',        
        'build/**/*.js',
        'build/**/*.css'        
    ], function(event) {
        return gulp.src(event.path)
            .pipe(plugins.connect.reload());
    });
    gulp.watch(['./web/**/*.js','!./web/**/*test.js'],['scripts']);
    gulp.watch(['!./web/index.html','./web/**/*.html'],['templates']);
    gulp.watch('./web/**/*.css',['css']);
    gulp.watch('./web/index.html',['copy-index']);

});

gulp.task('connect', plugins.connect.server({
    root: ['build'],
    port: 9000,
    livereload: true
}));

gulp.task('devel',['connect','scripts','templates','css','copy-index','vendorJS','vendorCSS','watch']);

gulp.task('default',['scripts','templates','css','copy-index','vendorJS','vendorCSS']);

