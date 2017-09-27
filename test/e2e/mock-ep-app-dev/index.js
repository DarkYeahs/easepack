// require.ensure([], function() {
//   new Vue(require('./App.vue').default).$mount('#app');
// })

import './styles'

console.log('this is entry')

import App from './App'
new Vue(App).$mount('#app')