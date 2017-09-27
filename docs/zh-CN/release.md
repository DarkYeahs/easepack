## v1.12.0

### Improvement

* 添加版本更新的提示

* 降低组件更新的频率（组件是存放在Gitlab上，构建时不再每次都pull代码）

## v1.11.0

### Feature

##### import sprite

支持使用 `@import` 以相对路径引入图片，并合成相应的精灵图

```scss
// 引入当前目录下 icons1 文件夹里的 png 图片
@import "icons1/*.png";

// 引入上级目录 icons2 文件夹里的 png 图片
@import "../icons2/*.png";

// 支持 webpack config 中设置的 alias 路径
@import "~alias/icons3/*.png";
```

引入图片后，scss文件中会生成2个对应的变量可直接使用

```scss
// 生成以文件夹命名的 $icons, $icons-names 两个变量
@import "./icons/*.png";

.bg-sprite-icon {
  background-image: sprite-url($icons);
  background-repeat: no-repeat;
  @each $name in $icons-names {
    &.#{$name} {
      width: #{sprite-width($icons, $name)}px;
      height: #{sprite-height($icons, $name)}px;
    }
  }
}
```

### Improvement

##### remove deprecation warning

删除以下 nodejs 抛出来的过期信息

```
(node:13551) DeprecationWarning: loaderUtils.parseQuery() received a non-string value...
```

##### update packages

webpack@2.4.3 -> webpack@2.7.0
babel-loader@6.4.1 -> babel-loader@7.1.0

##### Chunk File Name

支持修改 `chunkFilename`，默认为 `_c_/[name].chunk.js?[chunkhash:6]`

```js
easepack.set('filename', {
  chunk: '_c_/[id].chunk.js?[chunkhash:6]'
})
```

## v1.10.0

### Improvement

##### Alias

创建 import 或 require 的别名，来确保模块引入变得更简单

```js
easepack.set('alias', {
  utilities: './utilities'
})
```

##### Use SourceMap

`useSourceMap` 可接受一个`String`对象，用于设置Webpack的devtool参数。

##### context

提供 context 对当前环境进行设置

```js
easepack.set('context', './feature')
```

## v1.9.5

### Fixbug

* 修复多项目同时运行BUG

* 修复sprite图的间距问题（修改成4px）

* 修复sprite图偶尔无法生成的问题

## v1.9.4

### New Features

##### 提供karma的preprocessor插件

`karma.conf.js` 配置如下：

```js
// karma.conf.js
module.exports = function (config) {
  config.set({
    preprocessors: {
      './test/index.js': ['easepack']
    },
    plugins: [
      require('easepack').karma.preprocessor
    ]
  })
}
```

### Improvement

##### Use Uglifyjs

`useUglifyjs` 可接受一个 Object 对象，用于设置压缩的参数。

### Fixbug

`Livereload` 修复无刷新问题。

## ~v1.9.3

### New Features

##### Livereload

以开发模式开发项目时，修改 CSS 或 IMAGE 文件，页面更新浏览器无需重新加载。

##### webpackDevServer

新增的全局属性，允许使用 [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) 模式开发项目，
支持 [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) [热更新]。

```js
easepack.set('webpackDevServer', true);
```

<p class="tip">
  因为开启 webpackDevServer 需要使用到部分 ES2015 的新特性，导致无法在低版本浏览器预览页面。
</p>

##### HTML 支持 EJS 语法

* 使用 `<% code %>` 在 HTML 中加入 Javascript 逻辑

```html
<!-- 当发布到正式服时才会有这段代码 -->
<% if (process.env.NODE_ENV == 'production') { %>
  <script src="//cc.res.netease.com/统计代码的URL"></script>
<% } %>
```

* 使用 `<%= code %>` 输出内容到 HTML 中

```html
<script>
// 输出当前环境到页面中
var env = '<%= process.env.NODE_ENV %>';
</script>
```

* 使用 `include` 包含其它 HTML 文件

```html
<%= include('head.html') %>
<h1>Title</h1>
<p>My page</p>
<%= include('foot.html') %>
```

* 使用 `require` 加载其它的模块

```html
<!DOCTYPE html>
<body>
  <!-- logo.png 以 base64 格式添加到文件中 -->
  <img data-base64="<%= require('./img/logo.png?__inline') %>">
</body>
```

### Fixbug

* 修复设置 `upToDate` 为 true 后没有加载组件的问题

* 修复 `extract-text-webpack-plugin` CSS重复提取合并的问题