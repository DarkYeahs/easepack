// require.ensure([], function() {
//   new Vue(require('./App.vue').default).$mount('#app');
// })

import App from './App'
new Vue(App).$mount('#app')