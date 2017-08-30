require.ensure([], function() {
  new Vue(require('./App.vue')).$mount('#app');
})