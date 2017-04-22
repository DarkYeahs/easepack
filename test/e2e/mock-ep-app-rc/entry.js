import s from './style.scss';

let b = require('./App.vue');

console.log(`this is test entry, and output ${s} ${b}?`);

var [c, ,d] = [1,2,3];
c === 1;
d === 3;