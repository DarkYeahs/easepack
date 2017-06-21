### Vue-ie8

#### 简介

和`Vue`一致的语法，并且完美兼容ie8。 [gitlab]()

#### 使用方法

##### es5-shim

补充IE8中缺失的API

```html
<!--[if lt IE 9]>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/4.5.7/es5-shim.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/4.5.7/es5-sham.js"></script>
<![endif]-->
```

##### $data/$props

IE8下不支持直接使用$data/$props内的值：

```html
<div id="app">
  <p>{{ $data.message }}</p>
  <ul>
    <li v-for="str in $data.list">
      {{ str }}
    </li>
  </ul>
</div>
```

```javascript
const app = new Vue({
  el: '#app',
  data: {
    message: 'Vue-ie8',
    list: [
      'one', 
      'two'
    ]
  },
  created () {
    setTimeout(() => {
      // 不支持 `this.message = 'Vue ie8'`
      this.$data.message = 'Vue ie8'
    }, 1000)
  } 
})
```

<p class="tip">
  `Vue` 也是支持 $data.message 写法
</p>

##### watchers

```html
<div id="watch">
  <p>
    Ask a yes/no question:
    <input v-model="$data.question">
  </p>
  <p>{{ $data.answer }}</p>
</div>
```

```javascript
const app = new Vue({
  el: '#watch',
  data: {
    question: '',
    answer: 'I cannot give you an answer until you ask a question!'
  },
  watch: {
    // 不支持直播使用`message`
    '$data.question' () {
      this.$data.answer = 'Waiting for you to stop typing...'
      this.getAnswer()
    }
  },
  methods: {
    getAnswer () {
      setTimeout(() => {
        this.$data.answer = 'ha ha'
      }, 1000)
    }
  } 
})
```

##### computed

IE8下不支持computed（只能用methods替代）

##### vue-loader

通过vue-loader编译代码的部分语法是不支持IE8的，如：default，class等关键字

easepack的配置如下：

```javascript
// 利用Uglifyjs的配置处理ie8的语法
easepack
  .set('useUglifyjs', {
    output: {
      screw_ie8: false
    },
    mangle: {
      screw_ie8: false
    },
    compress: {
      warnings: false,
      screw_ie8: false
    }
  })
```