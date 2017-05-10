## v1.9.2

### New Features

* `livereload`  CSS 或 Image 改动时，浏览器更新内容时无需重新加载页面

* 支持 ejs 语法编译 HTML 文件，包括 `require` `include` 等功能

* `webpackDevServer` 支持使用 webpackDevServer[](https://webpack.js.org/configuration/dev-server/) 模式开发项目

### Fixbug

* 修复设置 `upToDate` 为 true 后没有加载组件的问题

* 修复 `include` 空HTML文件时，出现 `[object Object]` 的问题

* 修复 `extract-text-webpack-plugin` CSS重复提取合并的问题