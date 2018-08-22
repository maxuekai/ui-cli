const gulp = require('gulp'),
      path = require('path'),
      cssimport = require('gulp-cssimport'),//引入内联样式表
      fileinclude = require('gulp-file-include'),
      sourcemaps = require('gulp-sourcemaps'),//文件映射
      htmlbeautify = require('gulp-html-beautify'),//美化html文件
      postcss = require('gulp-postcss'),
      cssnano = require('gulp-cssnano'),//压缩文件
      postcss2 = require('postcss'),
      calc = require("postcss-calc"),
      cssvariables = require('postcss-css-variables'),//css变量
      precss = require('precss'),//预处理
      //cssnext = require('postcss-cssnext'), //兼容css新特性
      autoprefixer = require('autoprefixer'),
      colorRgbaFallback = require("postcss-color-rgba-fallback"),//兼容rgba
      colorOpacity = require("postcss-opacity"),//兼容opacity
      willChange  = require('postcss-will-change'),//will-change回退动画
      assets = require('postcss-assets'),
      sprite = require('postcss-sprites'),
      updateRule = require('postcss-sprites/lib/core').updateRule,
      webserver = require('gulp-webserver');

// ----------合并雪碧图函数-----------
const spriteHooks = function() {
	return {
		onUpdateRule: function(rule, token, image) {

      var backgroundPositionX = (image.coords.x) * (-1);
			var backgroundPositionY = image.coords.y * (-1);

			backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
      backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;
      
      var date = new Date(),
          year = date.getFullYear().toString(),
          mon = (date.getMonth()+1).toString(),
          day = date.getDate().toString(),
          min = date.getMinutes().toString(),
          s = date.getSeconds().toString(),
          currentTime;
      currentTime = year + mon + day + min + s;

      var backgroundImage = postcss2.decl({
        prop: 'background-image',
        value: 'url(' + image.spriteUrl +'?v='+ currentTime +')'
      });

			var backgroundRepeat = postcss2.decl({
				prop: 'background-repeat',
				value: 'no-repeat'
			});

			var backgroundPosition = postcss2.decl({
				prop: 'background-position',
				value: backgroundPositionX + 'px ' + backgroundPositionY + 'px'
			});

			rule.insertAfter(token, backgroundImage);
			rule.insertAfter(backgroundImage, backgroundPosition);
			rule.insertAfter(backgroundPosition, backgroundRepeat);

		}
		,onSaveSpritesheet: function(opts, spritesheet) {
      var url = Object.keys(spritesheet.coordinates)[0];
      var imageUrl = url.replace(/\\/g,'\/');
      var _spritePath = imageUrl.slice(imageUrl.indexOf('img'), imageUrl.indexOf('/sprite'));
			var filenameChunks = spritesheet.groups.concat(spritesheet.extension);
      return path.join( 'dist/' + _spritePath, 'spr_' + filenameChunks.join('.'));
		}
	}
}
// ----------合并雪碧图函数 end-----------

gulp.task('html', function() {
	return gulp.src('src/*.html')
				.pipe(fileinclude({
				  prefix: '@@',
				  basepath: '@file'
				}))
        .pipe(htmlbeautify({
            indent_size: 2,
            indent_char: ' ',
            // 这里是关键，可以让一个标签独占一行
            // unformatted: true
            extra_liners: []
        }))
        .pipe(sourcemaps.write('maps/html'))
				.pipe(gulp.dest('dist'))
});
gulp.task('css', function () { 
    var processors = [ 
                        sprite({
                          basePath: 'src',
                          spritePath: 'dist',
                          stylesheetPath: 'dist/css',
                          spritesmith: {
                            padding: 4,
                            algorithm: 'binary-tree' //binary-tree, top-down, left-right, diagonal,alt-diagonal 
                          },
                          filterBy: function(image) {
                            if(!~image.url.indexOf('/sprite/')) {
                              return Promise.reject();
                            }
                            return Promise.resolve();
                          },
                          groupBy: function(image) {
                            var name = /\/sprite\/([0-9.A-Za-z\-\_]+)\//.exec(image.url);
                            if (!name) {
                              return Promise.reject(new Error('Not a shape image.'));
                            }
                            return Promise.resolve(name[1]);
                          },
                          hooks: spriteHooks()
                        }), 
                        willChange, 
                        colorOpacity,
                        cssvariables(),
                        assets({
                          cachebuster: true
                        }),
                        calc(),
                        colorRgbaFallback({
                          properties: ["background-color", "background", "color", "border", "border-color", "outline", "outline-color", "box-shadow"]
                        }),
                        autoprefixer({
                          browsers: ['> 1%','last 2 version','ie >= 9']
                        }),
                        precss
                     ]; 
    return gulp.src('src/_css/*.css')
                .pipe(sourcemaps.init())
                .pipe(cssimport())
                .pipe(postcss(processors))
                // .pipe(cssnano({
                //   reduceIdents: false,
                //   safe: true
                // }))
                // .pipe(postcss([ autoprefixer({
                //     browsers: ['> 1%','last 2 version','ie >= 9']
                //   }) 
                // ]))
                .pipe(sourcemaps.write('../maps/css'))
                .pipe(gulp.dest('dist/css/')); 
});
gulp.task('img', function () {
  return gulp.src(['src/_img/*.{jpg,png,jpeg}','!src/_img/sprite/**/*.{jpg,png,jpeg}','!src/_img/base64/**/*.{jpg,png,jpeg}'])
         .pipe(sourcemaps.init())
         .pipe(sourcemaps.write('../maps/img'))
         .pipe(gulp.dest('dist/img/'));
});
gulp.task('images', function () {
  return gulp.src('src/_images/*.png')
         .pipe(sourcemaps.init())
         .pipe(sourcemaps.write('../maps/images'))
         .pipe(gulp.dest('dist/images/'));
});
gulp.task('js', function () {
  return gulp.src('src/_js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('../maps/js'))
        .pipe(gulp.dest('dist/js/'));
});
gulp.task('default',['html','css','img','images','js'],function(){
	gulp.watch('src/**/*.html',['html']);
	gulp.watch('src/_css/**/*.css',['css']);
  gulp.watch(['src/**/*.{jpg,png,jpeg}'],['img']);
  gulp.watch('src/_images/*.png',['images']);
  gulp.watch('src/_js/**/*.js',['js']);
});

//实现热加载自动刷新
gulp.task('webserver', function() {
  gulp.src('dist')
    .pipe(webserver({
      livereload: {
        enable: true, // need this set to true to enable livereload
        filter: function(fileName) {
          if (fileName.match(/.map$/)) { // exclude all source maps from livereload
            return false;
          } else {
            return true;
          }
        }
      }
    }));
});
