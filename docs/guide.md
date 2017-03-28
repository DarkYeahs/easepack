<div class="easepack-title">
  <img src="__title__">
</div>

## 简介

`easepack build` 命令将会给你个近乎于零配置来构建你的项目, 高效而又简单。

## 安装

Using npm:

```bash
npm install git+ssh://git@git-cc.nie.netease.com:32200/frontend/easepack.git -g
```

## 快速入门

在正式介绍 `easepack` 功能之前，请确保你有安装 [Git](https://git-scm.com/)

<p class="tip">
  项目根目录：`easepack` 配置文件（默认`easepack.config.js`）所在的目录为项目根目录。
</p>

```bash
easepack init ep-project

cd ep-project
easepack build -o ./output
```

* `./output` 输出构建后文件的目录

* `easepack build -h` 获取更多参数

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

### init

### build

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


### 添加文件指纹

`easepack` 是通过修改文件的 `url` 来实现添加 MD5 戳，配置如下：

```javascript
//清除其他配置，只剩下如下配置
easepack.match('a.png', {
  url: '[name].[ext]?[hash]'
});
```

### CSS精灵图

#### sprite-map

根据匹配的图片文件生成一张css雪碧图

* `$glob` [String] 用于匹配需要合成雪碧图的图片

```sass
$icons: sprite-map("icons/*.png");
```

<p class="danger">
 文件
</p>

#### sprite

返回指定图片的 `url` 和 `position`

```sass
// icons目录里有 icons/icon1.png，icons/icon2.png
$icons: sprite-map("icons/*.png");

.bg-icon1 {
  background: sprite($icons, icon1) no-repeat; // url('/icons.png') 0 -24px no-repeat;
}
```

#### sprite-width

#### sprite-names

#### sprite-position-x

#### sprite-position-y

#### sprite-url
