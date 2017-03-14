# easepack build

`easepack build` 命令会给你个近乎于零配置来构建你的项目, 一个安装任意构建，高效简单。

## Get started

## Configuration files

默认地，`easepack` 会加载根目录下的 `~/easepack.config.js` 配置文件，当然也可以通过 `--config [file]` 自定义配置文件（可参见命令）

通过 `easepack.config.js` 控制编译的整个流程，让工程构建变得简单，下面是 `easepack` 提供的API

### easepack.match(glob, props)

首先介绍设置规则的配置接口，配置处理入口文件（类似 `webpack` 的 `entry` 接口）

* `glob` **[String]** `easepack` 把匹配文件路径的路径作为 `glob`，匹配到的文件会分配给它设置的 props。关于 `glob` 语法，[请参看glob](https://github.com/isaacs/node-glob)

* `props` **[Object]** 编译规则属性，包括文件属性和插件属性

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

##### 更多可设置属性

* `url` **[String]** 指定文件的资源定位路径，如 `[name].[ext]?[hash]`

* `name` **[String]** `webpack` 的 `name`，默认为文件的相对根目录的路径（不带后缀）

### easepack.media(media, props)

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

### easepack.set(key, value)

设置一些全局属性，用于控制构建过程和文件最终的输出形式。

```javascript
//压缩JS文件
easepack.set('useUglifyjs', true);
```

##### 更多可设置属性

* `output` **[String]** 设置文件输出的路径（类似 `webpack` 的 `output`）。

> 当 `output` 为空时

* `useUglifyjs` **[Boolean]**  是否输出压缩的JS文件。






