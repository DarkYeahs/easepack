# easepack build

`easepack build` 命令会给你个近乎于零配置来构建你的项目, 一个安装任意构建，高效简单。

## Get started

## Configuration files

默认地，我们会加载根目录下的 `~/easepack.config.js` 配置文件，可以通过 `--config [file]` 自定义配置文件

`easepack` 编译的整个流程都是通过配置来控制的，固化了构建流程，让工程构建变得简单

### easepack.match(glob, props)

首先介绍设置规则的配置接口

* `glob` [String] `easepack` 把匹配文件路径的路径作为 `glob`，匹配到的文件会分配给它设置的 props。关于 `glob` 语法，[请参看glob](https://github.com/isaacs/node-glob)

* `props` [Object] 编译规则属性，包括文件属性和插件属性

我们修改例子的配置文件 `easepack.config.js`，添加以下内容

```javascript
easepack.match('src/*.js', {
  url: '[name].[ext]?[hash]'
});
```

##### 更多属性

* `url` [String] 指定文件的资源定位路径，如 `[name].[ext]?[hash]`

* `name` [String]

##### 重要特性

* 规则覆盖

### easepack.media(media, props)

接口提供多种状态功能，比如有些配置是仅供开发环境下使用，有些则是仅供生产环境使用的。

* `media` [String] 配置的 `media` 值

* `props` [Object] 编译规则属性，包括文件属性和插件属性

```javascript
//通过 easepack build -m dev 来匹配，给 'src/*.js' 文件添加 '[name].[ext]?[hash]' 属性
easepack
  .match('src/*.js')
  .media('dev', {
    url: '[name].[ext]?[hash]'
  });
```

