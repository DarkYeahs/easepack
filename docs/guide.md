<div class="easepack-title">
  <img src="__title__">
</div>

## 简介

easepack 是面向前端的工程构建工具。解决前端工程中性能优化、资源加载（异步、同步、按需、预加载、依赖管理、合并、内嵌）、模块化开发、自动化工具、开发规范、代码部署等问题。

## 安装

使用 npm:

```bash
npm install git+ssh://git@git-cc.nie.netease.com:32200/frontend/easepack.git -g
```

## 快速入门

在正式介绍 easepack 功能之前，请确保你有安装 [Git](https://git-scm.com/)。

```bash
# 初始化项目
easepack init ep-project

# 构建项目
cd ep-project && easepack build
```

easepack 内置了一个 Web Server 提供给构建后的代码进行调试。访问 `http://127.0.0.1:8080` URL 即可查看到页面渲染结果。

* `./output` 输出构建后文件的目录

* `easepack build -h` 获取更多参数

<p class="tip">
  项目根目录：easepack 配置文件（默认 easepack.config.js ）所在的目录为项目根目录。
</p>

## 配置文件

默认配置文件为 `~/easepack.config.js` ，`easepack` 定义了一种类似 CSS 的配置方式。

<p class="tip">
  当然也可以通过 `--config [file]` 自定义配置文件（可参见命令）。
</p>

### easepack.set

首先介绍设置全局属性的接口，用于控制构建过程和全部文件最终的输出形式。

```javascript
easepack.set(key, value); //或者 easepack.set(obj);
```

我们修改例子的配置文件 `easepack.config.js`，添加以下内容

```javascript
//压缩JS文件
easepack.set('useUglifyjs', true);
```

#### 更多全局属性

<p class="danger">
  当 `output` 为空时，`easepack` 会在本地开启服务，通过 `http://127.0.0.1:8080/` 访问编译后的文件内容。
</p>

### easepack.match

匹配需要处理哪里文件，并设置相关的属性。

* `glob` String 匹配到的文件会分配给它设置的 props。关于 `glob` 语法，[请参看glob](https://github.com/isaacs/node-glob)

* `props` Object 编译规则属性，包括文件属性和插件属性

<p class="danger">
  `easepack` 会根据文件的后缀来选择不同的处理方法，如 `.js` 文件则会作为 `webpack` 的入口处理。
</p>

我们修改例子的配置文件 `easepack.config.js`，添加以下内容

若 src 目录下有 entry1.js 文件

```javascript
easepack.match('src/*.js', {
  url: '[name].[ext]?[hash]'
});
```

等同于 webpack 的 webpack.config.js

```
module.exports = {
  entry: {
    'src/entry1': './src/entry1.js'
  },
  output: {
    filename: '[name].js?[chunkhash]'
  }
};
```

不同于 webpack，easepack 也会处理 .html 文件

```
easepack.match('*.html');
```

#### 更多文件属性

* `url` String 指定文件的资源定位路径，如 `[name].[ext]?[hash]`

* `name` String `url`中的 `name`, 默认为文件的相对根目录的路径（不带后缀）

* `emit` Boolean 设置是否输出文件。

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

## easeapck命令

通过以下 `easepack -h` 命令查看 `easepack` 提供了哪些命令。

### easepack init



### easepack build

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

These helpers make it easier to build and to work with css sprites.

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

.bg-sprite-icon {
  background-image: sprite-url($icons);
  background-repeat: no-repeat;

  @each $name in $names {
    &.#{$name} {
      width: -#{sprite-width($icons, $name)}px;
      height: -#{sprite-height($icons, $name)}px;
      background-position: -#{sprite-position-x($icons, $name)}px, -#{sprite-position-y($icons, $name)}px;
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
