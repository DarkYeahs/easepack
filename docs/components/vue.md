## VUE组件

### vuxActionsheet

<a class="trigger" @click="handleActionsheet">点击查看DOME</a>

<vux-actionsheet 
  v-model="actionsheet"
  :menus="{menu1: '菜单1', menu2: '菜单2'}"
  :show-cancel="true"></vux-actionsheet>

``` js
var vuxActionsheet = require('vuxActionsheet');
```

<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">value</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示, 使用 v-model 绑定变量 |
| <span class="prop-key" style="white-space:nowrap;">show-cancel</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示取消菜单 |
| <span class="prop-key" style="white-space:nowrap;">cancel-text</span> | <span class="type type-string">String</span> | cancel(取消) | <span style="font-size:12px;white-space:nowrap;"></span> | 取消菜单文字 |
| <span class="prop-key" style="white-space:nowrap;">menus</span> | <span class="type type-object">Object</span><br><span class="type type-array">Array</span> | {} | <span style="font-size:12px;white-space:nowrap;"></span> | 菜单项列表，举例：`{menu1: '删除'}`，如果名字上带有`.noop`表明这是纯文本(HTML)展示，不会触发事件，用于展示描述或者提醒。<br>从`v2.1.0`开始支持数组类型的菜单，见下面说明。 |
| <span class="prop-key" style="white-space:nowrap;">close-on-clicking-mask</span> | <span class="type type-boolean">Boolean</span> | true | <span style="font-size:12px;white-space:nowrap;">v2.0.0</span> | 点击遮罩时是否关闭菜单，适用于一些进入页面时需要强制选择的场景。 |

<span class="vux-props-title">Events</span>

| name    | params   | description |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">on-click-menu</span> |   (menuKey) | 点击菜单时触发，参数为当前菜单项对象 |
| <span class="prop-key" style="white-space:nowrap;">on-click-menu-{menuKey}</span> |   (menuKey) | 点击事件的快捷方式, 如果你有一个菜单名字为`delete`, 那么你可以监听 `on-click-menu-delete` |
| <span class="prop-key" style="white-space:nowrap;">on-click-menu-cancel</span> |   &nbsp; | 点击取消菜单时触发 |

`label`: 菜单名字，支持文字及`html`。

`value`: 英文字符，表示触发事件的名字，如果不设置不会触发`on-click-menu`事件。

`type`: 类型，可选值如下

  - `primary` 主色
  - `warn` 警告色
  - `disabled` 不可操作，灰色。点击时不会关闭
  - `info ` 信息提示，点击时不会关闭。作用同对象类型的`key.noop`。

``` js
[{
  label: 'Are you sure?<br/><span style="color:#666;font-size:12px;">Once deleted, you will never find it.</span>',
  type: 'info'
}, {
  label: 'Primary',
  type: 'primary',
  value: 'primary'
}, {
  label: 'Warn',
  type: 'warn'
}, {
  label: 'Disabled',
  type: 'disabled'
}, {
  label: 'Default'
}]
```

---

### vuxAlert

<a class="trigger" @click="handleAlert">点击查看DOME</a>

<vux-alert v-model="alert" title="Congratulations">
  <span>Your Message is sent successfully~</span>
</vux-alert>

``` js
var vuxAlert = require('vuxAlert');
```

<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">value</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示, 使用 v-model 绑定变量 |
| <span class="prop-key" style="white-space:nowrap;">title</span> | <span class="type type-string">String</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 弹窗标题 |
| <span class="prop-key" style="white-space:nowrap;">button-text</span> | <span class="type type-string">String</span> | ok(确定) | <span style="font-size:12px;white-space:nowrap;"></span> | 按钮文字 |
| <span class="prop-key" style="white-space:nowrap;">mask-transition</span> | <span class="type type-string">String</span> | vux-fade | <span style="font-size:12px;white-space:nowrap;"></span> | 遮罩动画 |
| <span class="prop-key" style="white-space:nowrap;">dialog-transition</span> | <span class="type type-string">String</span> | vux-dialog | <span style="font-size:12px;white-space:nowrap;"></span> | 弹窗主体动画 |

<span class="vux-props-title">Slots</span>

| name    | description   |  version |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">default</span> | 提示内容 | <span style="font-size:12px;white-space:nowrap;"></span> |

<span class="vux-props-title">Events</span>

| name    | params   | description |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">on-show</span> |   &nbsp; | 弹窗显示时触发 |

---

### vuxConfirm

<a class="trigger" @click="handleConfirm">点击查看DOME</a>

<vux-confirm v-model="confirm" title="弹窗标题">
  <span>Your Message is sent successfully~</span>
</vux-confirm>

``` js
var vuxConfirm = require('vuxConfirm');
```

<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">show</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示，使用`v-model`绑定 |
| <span class="prop-key" style="white-space:nowrap;">title</span> | <span class="type type-string">String</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 弹窗标题 |
| <span class="prop-key" style="white-space:nowrap;">confirm-text</span> | <span class="type type-string">String</span> | 确认(confirm) | <span style="font-size:12px;white-space:nowrap;"></span> | 确认按钮文字 |
| <span class="prop-key" style="white-space:nowrap;">cancel-text</span> | <span class="type type-string">String</span> | 取消(cancel) | <span style="font-size:12px;white-space:nowrap;"></span> | 取消按钮文字 |
| <span class="prop-key" style="white-space:nowrap;">mask-transition</span> | <span class="type type-string">String</span> | vux-fade | <span style="font-size:12px;white-space:nowrap;"></span> | 遮罩动画 |
| <span class="prop-key" style="white-space:nowrap;">dialog-transition</span> | <span class="type type-string">String</span> | vux-dialog | <span style="font-size:12px;white-space:nowrap;"></span> | 弹窗动画 |

<span class="vux-props-title">Slots</span>

| name    | description   |  version |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">default</span> | 弹窗主体内容 | <span style="font-size:12px;white-space:nowrap;"></span> |

<span class="vux-props-title">Events</span>

| name    | params   | description |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">on-cancel</span> |   &nbsp; | 点击取消按钮时触发 |
| <span class="prop-key" style="white-space:nowrap;">on-confirm</span> |   &nbsp; | 点击确定按钮时触发 |



---

### vuxDivider

<vux-divider>我是有底线的</vux-divider>


``` js
var vuxDivider = require('vuxDivider');
```

<p class="tip">
不支持配置分割线颜色，因为线条是通过图片来实现的。好处是在任何背景颜色下都可以适应。
</p>

``` html
<vux-divider>我是有底线的</vux-divider>
```

<span class="vux-props-title">Slots</span>

| name    | description   |  version |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">default</span> | 分隔线标题 | <span style="font-size:12px;white-space:nowrap;"></span> |



---

### vuxInlineCalendar

<vux-inline-calendar></vux-inline-calendar>

``` js
var vuxInlineCalendar = require('vuxInlineCalendar');
```

<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">value</span> | <span class="type type-string">String</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 当前选中日期，使用`v-model`绑定，默认为空，即选中当天日期 |
| <span class="prop-key" style="white-space:nowrap;">render-month</span> | <span class="type type-array">Array</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 指定渲染日期，如 [2018, 8] |
| <span class="prop-key" style="white-space:nowrap;">start-date</span> | <span class="type type-string">String</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 起始日期，格式为 `YYYY-MM-dd` |
| <span class="prop-key" style="white-space:nowrap;">end-date</span> | <span class="type type-string">String</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 结束日期，格式为`YYYY-MM-dd` |
| <span class="prop-key" style="white-space:nowrap;">show-last-month</span> | <span class="type type-boolean">Boolean</span> | true | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示上个月的日期 |
| <span class="prop-key" style="white-space:nowrap;">show-next-month</span> | <span class="type type-boolean">Boolean</span> | true | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示下个月的日期 |
| <span class="prop-key" style="white-space:nowrap;">highlight-weekend</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否高亮周末 |
| <span class="prop-key" style="white-space:nowrap;">return-six-rows</span> | <span class="type type-boolean">Boolean</span> | true | <span style="font-size:12px;white-space:nowrap;"></span> | 是否总是渲染6行日期 |
| <span class="prop-key" style="white-space:nowrap;">hide-header</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否隐藏日历头部 |
| <span class="prop-key" style="white-space:nowrap;">hide-week-list</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否隐藏星期列表 |
| <span class="prop-key" style="white-space:nowrap;">replace-text-list</span> | <span class="type type-object">Object</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 替换列表，可以将默认的日期换成文字，比如今天的日期替换成今，{'TODAY':'今'} |
| <span class="prop-key" style="white-space:nowrap;">weeks-list</span> | <span class="type type-array">Array</span> | ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] | <span style="font-size:12px;white-space:nowrap;"></span> | 星期列表，从周日开始 |
| <span class="prop-key" style="white-space:nowrap;">render-function</span> | <span class="type type-function">Function</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 用于为特定日期添加额外的html内容，参数为(行index,列index,日期详细属性) |
| <span class="prop-key" style="white-space:nowrap;">render-on-value-change</span> | <span class="type type-boolean">Boolean</span> | true | <span style="font-size:12px;white-space:nowrap;"></span> | 当日期变化时是否重新渲染日历，如果是渲染了多个日历的话需要设为false |
| <span class="prop-key" style="white-space:nowrap;">disable-past</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 禁止选择过去的日期，该选项可以与start-date同时使用 |
| <span class="prop-key" style="white-space:nowrap;">disable-future</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 禁止选择未来的日期，该选项可以end-date同时使用 |





---

### vuxLoading

<a class="trigger" @click="handleLoading">点击查看DOME</a>

<vux-loading v-model="loading"></vux-loading>

``` js
var vuxLoading = require('vuxLoading');
```

<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">value</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 显示状态，使用`v-model`绑定 |
| <span class="prop-key" style="white-space:nowrap;">text</span> | <span class="type type-string">String</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 提示文字 |
| <span class="prop-key" style="white-space:nowrap;">position</span> | <span class="type type-string">String</span> | fixed | <span style="font-size:12px;white-space:nowrap;"></span> | 定位方式，默认为`fixed`，在100%的布局下用`absolute`可以避免抖动 |

<span class="vux-props-title">Slots</span>

| name    | description   |  version |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">default</span> | 提示文字区域 | <span style="font-size:12px;white-space:nowrap;"></span> |




---

### vuxPopup

<a class="trigger" @click="handlePopup">点击查看DOME</a>

<vux-popup v-model="popup">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</vux-popup>

``` js
var vuxPopup = require('vuxPopup');
```

<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">value</span> | <span class="type type-boolean">Boolean</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 是否关闭，使用`v-model`绑定 |
| <span class="prop-key" style="white-space:nowrap;">height</span> | <span class="type type-string">String</span> | auto | <span style="font-size:12px;white-space:nowrap;"></span> | 高度，设置`100%`为整屏高度 |
| <span class="prop-key" style="white-space:nowrap;">hide-on-blur</span> | <span class="type type-boolean">Boolean</span> | true | <span style="font-size:12px;white-space:nowrap;"></span> | 点击遮罩时是否自动关闭 |
| <span class="prop-key" style="white-space:nowrap;">is-transparent</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;">v2.1.1-rc.9</span> | 是否为透明背景 |

<span class="vux-props-title">Slots</span>

| name    | description   |  version |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">default</span> | 弹窗主体内容 | <span style="font-size:12px;white-space:nowrap;"></span> |

<span class="vux-props-title">Events</span>

| name    | params   | description |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">on-hide</span> |   &nbsp; | 关闭时触发 |
| <span class="prop-key" style="white-space:nowrap;">on-show</span> |   &nbsp; | 显示时触发 |
| <span class="prop-key" style="white-space:nowrap;">on-first-show</span> |   &nbsp; | 第一次显示时触发，可以在该事件回调里初始化数据或者界面 |





---

### vuxToast

<a class="trigger" @click="handleToast">点击查看DOME</a>

<vux-toast v-model="toast">hello world</vux-toast>

``` js
var vuxToast = require('vuxToast');
```


<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">value</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示, 使用 v-model 绑定 |
| <span class="prop-key" style="white-space:nowrap;">time</span> | <span class="type type-number">Number</span> | 2000 | <span style="font-size:12px;white-space:nowrap;"></span> | 显示时间 |
| <span class="prop-key" style="white-space:nowrap;">type</span> | <span class="type type-string">String</span> | success | <span style="font-size:12px;white-space:nowrap;"></span> | 类型，可选值 success, warn, cancel, text |
| <span class="prop-key" style="white-space:nowrap;">width</span> | <span class="type type-string">String</span> | 7.6em | <span style="font-size:12px;white-space:nowrap;"></span> | 宽度 |
| <span class="prop-key" style="white-space:nowrap;">is-show-mask</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否显示遮罩，如果显示，用户将不能点击页面上其他元素 |
| <span class="prop-key" style="white-space:nowrap;">text</span> | <span class="type type-string">String</span> |  | <span style="font-size:12px;white-space:nowrap;"></span> | 提示内容，支持 html，和默认slot同样功能 |
| <span class="prop-key" style="white-space:nowrap;">position</span> | <span class="type type-string">String</span> | default | <span style="font-size:12px;white-space:nowrap;">v2.1.1-rc.4</span> | 显示位置，可选值 default, top, middle, bottom |

<span class="vux-props-title">Slots</span>

| name    | description   |  version |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">default</span> | 默认slot, 提示内容 | <span style="font-size:12px;white-space:nowrap;"></span> |

<span class="vux-props-title">Events</span>

| name    | params   | description |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">on-show</span> |   &nbsp; | 提示弹出时触发 |
| <span class="prop-key" style="white-space:nowrap;">on-hide</span> |   &nbsp; | 提示隐藏时触发 |


---


### vuxXSwitch

<vux-x-switch v-model="switchValue"></vux-x-switch>&nbsp;&nbsp;<vux-x-switch :disabled="true"></vux-x-switch>

``` js
var vuxXSwitch = require('vuxXSwitch');
```


```html
<x-switch v-model="value"></x-switch>
```


<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">disabled</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 是否不可点击 |
| <span class="prop-key" style="white-space:nowrap;">value</span> | <span class="type type-boolean">Boolean</span> | false | <span style="font-size:12px;white-space:nowrap;"></span> | 表单值, 使用`v-model`绑定 |

<span class="vux-props-title">Events</span>

| name    | params   | description |
|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">on-change</span> |   `(value)` | 值变化时触发，参数为 (currentValue) |





---

### uiVueTicktock

一个VUE的倒计时组件

<ui-vue-ticktock :seconds="10000"></ui-vue-ticktock>

```js
<ui-vue-ticktock :seconds="100" @ended="handleEnded"/> //输出：<span>00:01:30</span>
```

<span class="vux-props-title">Props</span>

| name   | type | default  |  version | description   |
|-------|-------|-------|-------|-------|
| <span class="prop-key" style="white-space:nowrap;">seconds</span> | <span class="type type-boolean">Integer</span> | 0 | <span style="font-size:12px;white-space:nowrap;"></span> | 是否不可点击 |

---