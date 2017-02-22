## v1.0.3

### New Features

#### SCSS Sprite Functions

##### sprite-map($glob)

根据匹配的图片文件生成一张css雪碧图

* `$glob` [String] [glob](https://github.com/isaacs/node-glob) 用于匹配需要合成雪碧图的图片

例如：

```sass
$icons: sprite-map("icons/*.png");
```

##### sprite($map, $sprite)

返回指定图片的 `url` 和 `position`，例如：

```sass
// icons目录里有 icons/icon1.png，icons/icon2.png
$icons: sprite-map("icons/*.png");

.bg-icon1 {
  background: sprite($icons, icon1) no-repeat;
}
```

生成：

```sass
.bg-icon1 {
  background: url('/icons.png') 0 -24px no-repeat;
}
```

##### sprite-width($map, $sprite)

返回指定图片的 `width`，如果 `$sprite` 为空，则返回合成的雪碧图的宽度

##### sprite-height($map, $sprite)

返回指定图片的 `height`，如果 `$sprite` 为空，则返回合成的雪碧图的高度

##### sprite-names($map)

返回所匹配图片的名字列表

```sass
// icons目录里有 icons/icon1.png，icons/icon2.png
$icons: sprite-map("icons/*.png");

$iconsnames: sprite($icons) // 输出 [icon1, icon2]

@each $icon in $iconsnames {
  .#{$icon}-bg {
    background: sprite($icons, $icon) no-repeat;
  }
}
```

##### sprite-position-x($map, $sprite)

返回指定图片的 `position-x`

##### sprite-position-y($map, $sprite)

返回指定图片的 `position-y`

##### sprite-url($map)

返回雪碧图的 `url`

```sass
$icons: sprite-map("icons/*.png");

.bg-icon {
  background-image: sprite-url($icons, icon1); //输出 url('/icons.png')
}
```

### Fixed

* `easepack.media` 的二次匹配问题

* `privateRepo` 输出文件时，若存在依赖的组件存在 `privateRepo` 中，会发出警告

## v1.0.2

released this on 2017.2.20

### New Features

#### privateRepo

通过 `privateRepo` 属性来设置个人的组件目录，此时会同时加载两个组件库的组件，若存在同名，privateRepo目录中组件会覆盖公共组件库

```javascript
//easepack.config.js中
easepack.set(privateRepo, 'E:/workplace/ep_components');
```

或命令

```bash
easepack build --private-repo E:/workplace/ep_components
```

### Improvements

- auto banner：打包后文件会自动添加banner（添加了开发者名称）

```javascript
//如 开发者，开发目录
/*! zhengquanbin,htdocs\activity\mobileActivity */
```

## v1.0.1

### Fixed

- Asset Path 条件判断的正则为空的问题

- webpack RawSource 的引用问题

## v1.0.0

基础功能