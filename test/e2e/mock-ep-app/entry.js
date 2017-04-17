import s from './style.scss';

let b = require('./App.vue');
let f = require('./fileUrl.sac');
let pf = require('./filepath/filePath.sac');
let p = require('./package.json?__inline');

console.log(p);
console.log(f);
console.log(pf);
console.log(`this is test entry, and output ${s} ${b}?`);

var [c, ,d] = [1,2,3];
c === 1;
d === 3;