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