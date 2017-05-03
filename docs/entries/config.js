var vuxXDialog = require('vuxXDialog');
var lotteryround = require('lotteryround');
var uiVueTicktock = require('vuxActionsheet');

var style = require('./config.scss');
var pickerData = require('./pickerData');

docute.init({
  nav: [{
    title: '首页',
    path: '/',
    markdown: require('../zh-CN/guide.md?__inline')
      .replace('__title__', require('../assets/title.png'))
  }, {
    title: '组件库',
    path: '/component',
    markdown: require('../zh-CN/component.md?__inline')
    // items: [{
    //   title: '样式库',
    //   path: '/style',
    //   markdown: require('../components/style.md?__inline')
    // }, {
    //   title: 'JS组件库',
    //   path: '/script',
    //   markdown: require('../components/script.md?__inline'),
    //   component: {
    //     data: function () {
    //       return {
    //         lotteryRound: false
    //       };
    //     },
    //     mounted: function () {
    //       var obj = lotteryround({
    //         width: 488,//flash宽度
    //         height: 488,//flash高度
    //         contentId: 'swfcontent',
    //         bg: require('../assets/pan.png'),
    //         btn: require('../assets/btn.png'),
    //         pointer: require('../assets/pointer.png'),
    //         total_num: 8
    //       }).getFlashInstance();

    //       window.start_lottery = function () {
    //         if (obj.start_lottery()) {
    //           obj.show_lottery();
    //           setTimeout(function () {
    //             obj.stop_lottery(5);
    //           }, 5000);
    //         }
    //       }

    //       window.lottery_result = function () {
    //       }
    //     },
    //     components: {
    //       vuxXDialog: vuxXDialog
    //     },
    //     methods: {
    //       handleLottery: function () {
    //         this.lotteryRound = true;
    //       }
    //     }
    //   }
    // }, {
    //   title: 'VUE组件库',
    //   path: '/vue',
    //   markdown: require('../components/vue.md?__inline'),
    //   component: {
    //     data: function () {
    //       return {
    //         actionsheet: false,
    //         alert: false,
    //         confirm: false,
    //         toast: false,
    //         loading: false,
    //         switchValue: false,
    //         popup: false,
    //         picker: [],
    //         pickerData: pickerData,
    //         popupPicker: false,
    //         xDialog: false
    //       }
    //     },
    //     components: {
    //       vuxAlert: require('vuxAlert'),
    //       vuxActionsheet: require('vuxActionsheet'),
    //       vuxConfirm: require('vuxConfirm'),
    //       vuxDivider: require('vuxDivider'),
    //       vuxToast: require('vuxToast'),
    //       vuxLoading: require('vuxLoading'),
    //       vuxXSwitch: require('vuxXSwitch'),
    //       vuxPopup: require('vuxPopup'),
    //       vuxInlineCalendar: require('vuxInlineCalendar'),
    //       uiVueTicktock: require('uiVueTicktock'),
    //       vuxPicker: require('vuxPicker'),
    //       vuxPopupPicker: require('vuxPopupPicker'),
    //       vuxLoadMore: require('vuxLoadMore'),
    //       vuxXDialog: vuxXDialog
    //     },
    //     methods: {
    //       handleActionsheet: function () {
    //         this.actionsheet = true;
    //       },
    //       handleAlert: function () {
    //         this.alert = true;
    //       },
    //       handleConfirm: function () {
    //         this.confirm = true;
    //       },
    //       handleToast: function () {
    //         this.toast = true;
    //       },
    //       handleLoading: function () {
    //         this.loading = true;
    //         setTimeout(function () {
    //           this.loading = false;
    //         }.bind(this), 5000)
    //       },
    //       handlePopup: function () {
    //         this.popup = true;
    //       },
    //       handlePopupPicker: function () {
    //         this.popupPicker = true;
    //       },
    //       handelOnHide: function () {
    //         this.popupPicker = false;
    //       },
    //       handleXDialog: function () {
    //         this.xDialog = true;
    //       }
    //     }
    //   }
    // }]
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