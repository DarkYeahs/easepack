var style = require('./config.scss');
var uiVueTicktock = require('vuxActionsheet');
var pickerData = require('../pickerData');

docute.init({
  nav: [{
    title: '首页',
    path: '/',
    markdown: require('!raw-loader!../guide.md')
      .replace('__title__', require('../assets/title.png?__inline'))
  }, {
    title: '组件',
    type: 'dropdown',
    items: [{
      title: '样式库',
      path: '/style',
      markdown: require('!raw-loader!../components/style.md')
    }, {
      title: 'JS工具库',
      path: '/script',
      markdown: require('!raw-loader!../components/script.md'),
      component: {
        components: {
          //vueLottery: require('../components/vueLottery.vue')
        }
      }
    }, {
      title: 'VUE组件库',
      path: '/vue',
      markdown: require('!raw-loader!../components/vue.md'),
      component: {
        data: function () {
          return {
            actionsheet: false,
            alert: false,
            confirm: false,
            toast: false,
            loading: false,
            switchValue: false,
            popup: false,
            picker: [],
            pickerData: pickerData,
            popupPicker: false
          }
        },
        components: {
          vuxAlert: require('vuxAlert'),
          vuxActionsheet: require('vuxActionsheet'),
          vuxConfirm: require('vuxConfirm'),
          vuxDivider: require('vuxDivider'),
          vuxToast: require('vuxToast'),
          vuxLoading: require('vuxLoading'),
          vuxXSwitch: require('vuxXSwitch'),
          vuxPopup: require('vuxPopup'),
          vuxInlineCalendar: require('vuxInlineCalendar'),
          uiVueTicktock: require('uiVueTicktock'),
          vuxPicker: require('vuxPicker'),
          vuxPopupPicker: require('vuxPopupPicker'),
          vuxLoadMore: require('vuxLoadMore')
        },
        methods: {
          handleActionsheet: function () {
            this.actionsheet = true;
          },
          handleAlert: function () {
            this.alert = true;
          },
          handleConfirm: function () {
            this.confirm = true;
          },
          handleToast: function () {
            this.toast = true;
          },
          handleLoading: function () {
            this.loading = true;
            setTimeout(function () {
              this.loading = false;
            }.bind(this), 5000)
          },
          handlePopup: function () {
            this.popup = true;
          },
          handlePopupPicker: function () {
            this.popupPicker = true;
          },
          handelOnHide: function () {
            this.popupPicker = false;
          }
        }
      }
    }]
  }, {
    title: '版本更新',
    path: '/changelog',
    source: 'https://raw.githubusercontent.com/dante1977/easepack/master/docs/release.md'
  }],
  icons: [{
    icon: 'github',
    label: 'Contribute on GitHub',
    link: 'https://github.com/owner/repo'
  }],
  plugins: [
    docsearch({
      apiKey: '65360cf9a91d87cd455d2b286d0d89ee',
      indexName: 'docute',
      tags: ['english', 'zh-Hans', 'zh-Hant', 'ja'],
      url: 'https://docute.js.org'
    })
  ]
});