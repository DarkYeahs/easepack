## 基础样式 

基本用法
```sass
//引用时前面加 “~”
@import "~mixins";
```

### reset 

重置浏览器样式，详见[源码](https://git-cc.nie.netease.com/frontend/ep_components/blob/master/reset.scss)

* `-webkit-tap-highlight-color: transparent` 会去除将移动端点击高亮

### mixins 

sass的mixins工具类，详见[源码](https://git-cc.nie.netease.com/frontend/ep_components/blob/master/mixins.scss)

#### clearfix

#### gradient-horizontal

水平渐变，从左往右

```sass
@include gradient-horizontal
```

#### gradient-horizontal-repeating

水平渐变，从左往右，平铺

```sass
@include gradient-horizontal-repeating(#333 5%, #ccc 10%);
```

#### gradient-vertical

垂直渐变，从上往下

```sass
@include gradient-vertical(#333 30%, #ccc);
```

#### gradient-vertical-repeating

垂直渐变，从上往下，平铺

```sass
@include gradient-vertical-repeating(#333 30%, #ccc 50%);
```