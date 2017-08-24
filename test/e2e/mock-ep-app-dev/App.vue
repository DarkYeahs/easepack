<template>
  <div class="main">
    <vux-load-more
            v-show="loading"
            tip="正在努力加载数据">
    </vux-load-more>

    <vux-x-dialog
            v-model="show"
            :hide-on-blur="true"
            :title="item.title">
      <div v-html="item.content"></div>
    </vux-x-dialog>

    <vux-actionsheet
            v-model="service"
            :show-cancel="true"
            :menus="{menu1: 'A小姐服务',menu2: 'B小姐服务'}">
    </vux-actionsheet>

    <ul class="m-help" v-if="list.length">
      <li v-for="item in list">
        <a @click="handleClick(item)">{{ item.title }}</a>
      </li>
      <li class="more">
        <a class="fl">还没有解决你的问题？</a>
        <a class="fr" @click="handleService">点此进入人工客服</a>
      </li>
    </ul>

  </div>
</template>

<script>
  module.exports = {
    data: function () {
      return {
        list: [],
        item: {},
        show: false,
        loading: true,
        service: false
      }
    },
    components: {
      // vuxXDialog: function (resolve) {
      //   require.ensure([], function () {
      //     resolve(require('vuxXDialog'))
      //   })
      // },
      vuxLoadMore: require('vuxLoadMore'),
      // vuxActionsheet: require('vuxActionsheet')
    },
    mounted: function () {
      var self = this;
      $.ajax({
        url: 'http://192.168.229.152:9038/business/help_title',
        dataType: 'jsonp',
        success: function (res) {
          setTimeout(function () {
            self.list = res.data;
            self.loading = false;
          }, 2000)
        }
      });
    },
    methods: {
      handleClick: function (item) {
        this.item = item;
        this.show = true;
      },
      handleService: function () {
        this.service = true;
      }
    }
  }
</script>

<style>
  @import "~reset";
  @import "~mixins";
  @import "./styles";
</style>

