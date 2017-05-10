<div class="easepack-title">
  <img src="__title__">
</div>

## 简介

easepack 是面向前端的工程构建工具。解决前端工程中性能优化、资源加载（异步、同步、按需、预加载、依赖管理、合并、内嵌）、模块化开发、组件化开发、自动化工具、开发规范、代码部署等问题。

## 安装

使用 npm （Node.js Version, 6.x preferred）:

```bash
npm install git+ssh://git@git-cc.nie.netease.com:32200/frontend/easepack.git -g
```

## 快速入门

在正式介绍 easepack 功能之前，请确保你有安装 [Git](https://git-scm.com/)。

```bash
# 下载远程项目的模板
easepack init ep-project

# 构建项目，并输出到 ep-project-dist 中
cd ep-project && easepack build -o ../ep-project-dist
```

你也可以构建发布项到其它的目录下

```bash
#发布到项目根目录的 beta 目录下
easepack build -o ./beta

#发布到项目父级目录的 dist 子目录下
easepack build -o ../dist

#发布到其他盘的目录下 （Windows）
easepack build -o E:\\htdocs\\m\\daily\\ep_dome
```

当没有明确指定 output 输出目录时，easepack 会开启内置了一个 Web Server 提供给构建后的代码进行调试。

```bash
easepack build
```

然后在浏览器中输入 http://127.0.0.1:8080/dome.html 查看编译后的结果。

<p class="tip">
为了方便开发，easepack 支持文件监听，当启动文件监听时，修改文件会重新构建发布。easepack 内置的 Server 不是常驻的，如果结束构建服务将会关闭的。
</p>


## 命令行

你可以通过 `easepack -h` 命令查看 easepack 的用法及提供了哪些命令。

### easepack init

```bash
easepack init <project-name> [template-name]
```

例子：

```bash
easepack init ep-project
```

上面的命令表示从 [ep_dome](https://git-cc.nie.netease.com/frontend/ep_dome/tree/master) 里复制代码到 `./ep-project/` 里。

<br>

### easepack build

`easepack build` 命令给你一个近乎于零配置的开发步骤, 构建你的项目。

可以通过 easepack build 的查看命令的所有选项。

```bash
easepack build --help
easepack build -h
```

***Build source using a config file***

Specifies a different configuration file to pick up. Use this if you want to specify something different than webpack.config.js, which is the default.

```bash
easepack -c example.config.js
easepack --config example.config.js
```

## 配置文件

默认配置文件为 easepack.config.js，easepack 编译的整个流程都是通过配置来控制的。easepack 定义了一种类似 CSS 的配置方式。固化了构建流程，让工程构建变得简单。

### easepack.set

首先介绍设置全局属性的接口，用于控制构建过程和全部文件最终的输出形式。

```js
easepack.set(key, value);
```

* `key` ： 可配置的全局属性，useUglifyjs, useCleancss 等。

* `value` ： 对应属性的值。

我们修改例子的配置文件 easepack.config.js ，添加以下内容

```js
//压缩JS文件
easepack.set('useUglifyjs', true);
```

#### 全局属性

##### output

`string`

指定构建输出文件的目录，默认为 false 。若 output 为 false 时，则会开启内置的 Web Server。

##### publicPath

`string`

此选项指定在浏览器中引用时输出目录的公共URL。当加载外部资源（如图像，文件等）时，这是一个重要的选项。如果指定的值不正确，则在加载这些资源时会收到404错误。

简单规则：从HTML页面的视图中输出的路径的URL。

```js
easepack.set('publicPath', '//cdn.example.com/'); // CDN (same protocol)
```

对于文件的配置：

```js
easepack.match('assets/spinner.gif', {
  url: '[name].[hash].[png]'
});
```

输出的文件URL就会是：

```css
background-image: url(//cdn.example.com/assets/spinner.a53582.gif);
```

##### autoRsync

`boolean`

当我们开发项目后，需要同步代码到测试机上（`192.168.229.171`），将 autoRsync 设成 true 即可。

##### rsyncMsg

`string`

指定 autoRsync 的日志消息。

##### spriteUrl

`string`

指定 CssSprite 合并生成的图片的URL

##### useAutoprefixer

`boolean/string`

设置是否需要启用 [autoprefixer](https://github.com/postcss/autoprefixer) 。

```js
// ['iOS >= 7', 'Android >= 4.1']
easepack.set('useAutoprefixer', true);

// 自定义 browserslist
easepack.set('useAutoprefixer', {browserslist: ['> 1%', 'last 2 versions']});
```

##### useUglifyjs

`boolean`

设置是否需要压缩 javascript 文件。当 output 为 false 时，默认为 false，反之。

##### useCleancss

 `boolean`

设置是否需要压缩 css 文件。当 output 为 false 时，默认为 false，反之。

##### useImagemin

 `boolean`

设置是否需要压缩 png 文件。当 output 为 false 时，默认为 false，反之。

##### useSourceMap

`boolean`

设置是否生成 source-map 文件，默认为 false。

##### useEs2015

`boolean`

设置是否允许在 JS/Vue 文件中使用 ES2015，默认为 false。easepack 内部使用 `babel` 编译ES2015语法，默认的配置如下：

```js
{
  presets: [
    ['es2015', {modules: false}], 
    'stage-2'
  ]
}
```

<p class="warning">
  easepack 遵守 `.babelrc`，因此这是配置 Babel presets 和插件推荐的方法。
</p>

##### useBase64

`boolean/string`

默认地，easepack 在构建过程会将小于 2kb 的图片文件以 base64 嵌入其它对其依赖的文件中。

```js
//嵌入小于 5kb 的图片文件
easepack.set('useBase64', '5kb');

 //嵌入所有的图片文件
easepack.set('useBase64', true);

//不对图片文件进行嵌入
easepack.set('useBase64', false);
```

除了上面的全局配置属性，也可以给资源加 `?__inline` 参数来标记资源嵌入需求（可无视 useBase64 的设定）。

```css
.logo {
  background-image: url('./image/logo.png?__inline');
}
```

<p class="warning">
  easepack 不会对合成的 CssSprite 图进行 base64 的嵌入的。
</p>

##### useExtract

`boolean`

是否提取 CSS 到单独文件。

##### webpackDevServer

`boolean`

启动 webpackDevServer[](https://webpack.js.org/configuration/dev-server/)

```js
easepack
  .set('useExtract', false)
  .set('webpackDevServer', true)
```

---

### easepack.match

匹配需要处理哪里文件，并设置相关的属性。

* `glob` String 匹配到的文件会分配给它设置的 props。关于 `glob` 语法，[请参看glob](https://github.com/isaacs/node-glob)

* `props` Object 编译规则属性，包括文件属性和插件属性

<p class="danger">
  easepack 会根据文件的后缀来选择不同的处理方法，如 `.js` 文件则会作为 `webpack` 的入口处理。
</p>

我们修改例子的配置文件 `easepack.config.js`，添加以下内容

```js
easepack.match('entries/*.js', {
  url: '[name].[ext]?[hash]'
});
```

#### 文件属性

##### url

`string`

指定文件的资源定位路径。如文件：entries/dome.js

```js
easepack.set('output', 'E:\\htdocs\\m\\daily\\ep_dome');
easepack.set('publicPath', '//cdn.example.com/');

// 输出路径为到 E:\\htdocs\\m\\daily\\ep_dome\\entries\\dome.6802ae.js
// URL: //cdn.example.com/entries/dome.6802ae.js
easepack.match('entries/dome.js', {
  url: '[path][name].[hash].[ext]'
});

// 输出路径为到 E:\\htdocs\\m\\daily\\ep_dome\\entries\\dome.js
// URL: //cdn.example.com/entries/dome.js?6802ae
easepack.match('entries/dome.js', {
  url: '[path][name].[ext]?[hash]'
});

// 输出路径为到 E:\\htdocs\\m\\daily\\ep_dome\\dome.js
// URL: //cdn.example.com/dome.js?6802ae
easepack.match('entries/dome.js', {
  url: '[name].[ext]?[hash]'
});
```

| template    | value   | description |
|-------|-------|-------|
| [path] | entries/ | 文件模块路径 |
| [name] | dome | 文件模块名称，默认为文件的不带后缀的文件名 |
| [ext] |  js | 文件的后缀，不带"."的 |
| [hash] | 6802ae | 文件模块6位数的hash值 |

##### emit

`boolean`

设置是否输出文件。

| file prefix    | default   | description |
|-------|-------|-------|
| .js | true | .js 后缀的文件 emit 的默认值为 true，不可设置 |
| .html |  true | .html 后缀的文件 emit 的默认值为 true，不可设置 |
| 其它 | false | 其它后缀的文件 emit 的默认值为 false |

<p class="warning">
  easepack 在处理文件过程中只输出 emit 属性 true 的文件，和被 emit 为 true 的文件所依赖的文件。
</p>

默认的，如果 entries/dome.js 对 image/icon.png 没有依赖时， easepack 不会输出 image/icon.png 文件。当前 image/icon.png 文件的 emit 设置成 true，将会输出到目录中。

```js
easepack.match('entries/dome.js', {
  url: '[name].[ext]?[hash]'
});
easepack.match('image/icon.png', {
  emit: true,
  url: '[name].[ext]?[hash]'
});
```

#### 规则覆盖



---

### easepack.within

---

### easepack.media

接口提供多种状态功能，比如有些配置是仅供开发环境下使用，有些则是仅供生产环境使用的。

* `media` **[String]** 配置的 `media` 值

* `props` **[Object]** 编译规则属性，包括文件属性和插件属性

```javascript
//通过 easepack build -m dev 来匹配，给 'src/*.js' 文件添加 '[name].[ext]?[hash]' 属性
easepack
  .match('src/*.js', {
    url: '[name].[ext]'
  })
  .media('dev', {
    url: '[name].[ext]?[hash]'
  });
```

## 组件系统

组件系统是 easepack 最核心的功能，使用时你可以无须关心组件代码内部逻辑，文件的位置，包含什么文件。而你只需在了解组件对外提供的接口方法后，在自己代码中默默添加一句 `require('组件名')` 即可。 
 
<p class="warning">
  一个组件内部可以包含JS文件，CSS文件，图片文件，字体文件，swf文件等等，easepack 在构建过程中已经替用户解决所有文件间的依赖关系。
</p>


## 初级使用

### 压缩资源

默认的，`easepack` 对输出的 js，css, png 文件是进行压缩的，但也可以通过给文件自定义配置。

```javascript
//配置对JS文件是否压缩
easepack.set('useUglifyjs', false);

//配置对CSS文件是否压缩
easepack.set('useCleancss', false);

//配置对PNG文件是否压缩
easepack.set('useImagemin', false);
```

---

### HTML模板语法

easepack 所处理的HTML文件中可以使用类似 `ejs` 语法。

* 通过 `include` 包含其它的html文件（不一定需要是 .html 后缀）

```html
<!DOCTYPE html>
<head>
  <title>include其它文件</title>
  <%= include('./file.html') %>
</head>
```

* 通过 `process.env.NODE_ENV` 判断当前环境而加载不同的文件

```html
<!DOCTYPE html>
<body>
<% if (process.env.NODE_ENV == 'production') { %>
<!-- 当发布到正式服时才会有这段代码 -->
<script src="//cc.res.netease.com/统计代码的URL"></script>
<% } %>
</body>
```

* 通过 `require` 加载其它模块的文件

```html
<!DOCTYPE html>
<body>
  <img data-base64="<%= require('./img/logo.png?__inline') %>">
</body>
```


---

### 添加文件指纹

easepack 是通过 match 方法来匹配文件，并赋于 url 属性来实现添加 MD5 戳，配置如下：

```js
easepack.match('a.png', {
  url: '[name].[ext]?[hash]' //将会生成 a.png?eccc43
});
```

又或者：

```js
easepack.match('a.png', {
  url: '[name]-[hash].[ext]?' //将会生成 a-eccc43.png
});
```

---

### CssSprite图片合并

#### Function for JS CODE

easepack 已经在代码中注入 `__sprite_map__` 方法，为满足在js代码中生成sprite图的需求。

```js
//icons目录里有 icons/i1.png，icons/i2.png文件
var spriteObject = __sprite_map__('icons/*.png');
```

<p class="tip">
  `__sprite_map__` 方法目前只支持 left-right 的合并方式
</p>

编译后可以得到一个含图片信息的JSON对像（下面例子），赋值给 `spriteObject` 变量。

```js
{
  i1: {
    x:0,               //图片i1的x轴位置（像素）
    y:0,               //图片i1的y轴位置（像素）
    width:202,         //图片i1的宽（像素）
    height:127         //图片i1的高（像素）
  },
  i2: {
    x:202,             //图片i2的x轴位置（像素）
    y:0,               //图片i2的y轴位置（像素）
    width:202,         //图片i2的宽（像素）
    height:127         //图片i2的高（像素）
  },
  __sprite__: {
    width:404,         //合成sprite图的宽（像素）
    height:127,        //合成sprite图的高（像素）
    url: "/icons.png"  //合成sprite图的url地址
  }
}
```



#### Functions for SASS/SCSS

easepack 编译 sass 时已经注入一系列的 Functions，可以使你更简单的在你的项目中使用 css sprites。

While it is allowed to use these directly, to do so is considered "advanced usage". It is recommended that you instead use the css sprite mixins that are designed to work with these functions.

<p class="danger">
 easepack 的 CssSprite 的实现主要参考compass（文档是从那边复制过来的）。
</p>

**sprite-map($glob, $layout)**

Generates a css sprite map from the files matching the glob pattern.

The `$glob` should be glob pattern relative to the images directory that specifies what files will be in the css sprite. For example:

```css
/* icons目录里有 icons/i1.png，icons/i2.png文件 */
$map: sprite-map("images/icons/*.png");
background: sprite($map, i1) no-repeat;
```

This will generate a css sprite map and return a reference to it. It's important to capture this to a variable, because you will need to use it later when creating css sprites. In the above example you might end up with a new file named `images/icons.png` and your css stylesheet will have:

```css
background: url('/images/icons.png') 0px -24px no-repeat;
```


**sprite($map, $sprite)**

Returns the image and background position for use in a single shorthand property:

```css
$map: sprite-map("images/icons/*.png");
background: sprite($map, i1) no-repeat;
```

Becomes:

```css
background: url('/images/icons.png') 0 -24px no-repeat;
```

**sprite-names($map)**

Returns a list of all sprite names within the supplied map

**sprite-url($map)**

Returns a url to the sprite image.

**sprite-width($map, $sprite:?)**

Returns the width of the generated sprite

**sprite-height($map, $sprite:?)**

Returns the height of the generated sprite

**sprite-position-x($map, $sprite)**

Returns the position for the original image in the sprite. This is suitable for use as a value to background-position.

**sprite-position-y($map, $sprite)**

Returns the position for the original image in the sprite. This is suitable for use as a value to background-position:

```css
$map: sprite-map("images/icons/*.png");
background-position: -#{sprite-position-x($map, i1)}px -#{sprite-position-y($map, i1)}px;
```

Might generate something like:

```css
background-position: 0 -20px;
```

```css
$icons: sprite-map("icons/*.png");
$names: sprite-names($icons); // output ['i1', 'i2']
```

```css
.bg-sprite-icon {
  background-image: sprite-url($icons);
  background-repeat: no-repeat;

  @each $name in $names {
    &.#{$name} {
      width: #{sprite-width($icons, $name)}px;
      height: #{sprite-height($icons, $name)}px;
      background-position: -#{sprite-position-x($icons, $name)}px 
        -#{sprite-position-y($icons, $name)}px;
    }
  }
}
```

编译后

```css
.bg-sprite-icon {
  background-image: url(/icons.png);
  background-repeat: no-repeat; }
.bg-sprite-icon.i1 {
  width: 20px;
  height: 20px;
  background-position: 0 0; }
.bg-sprite-icon.i2 {
  width: 20px;
  height: 20px;
  background-position: 0 -20px; }
```

---

### 自动同步到远端机器


## 中级使用

## 高级使用