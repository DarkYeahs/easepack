<template>
  <h2>hello</h2>
</template>

<script>
  import vd from 'vuxDivider'
  import u from 'utilities/utility'

  window.nums = [];
  var vuxDivider = {};

  window.testDefault = {
    class: 'TEST'
  }
  window.testDefault.default = 1

  // var spriteUrl = __sprite_map__('leftright/*.png');
  /* var spriteUrl = __sprite_map__('leftright/*.png'); */
  var spriteStr = "__sprite_map__('leftright/*.png')";

  var spriteUrl = __sprite_map__('./leftright/*.png');
  
  if (process.env.NODE_ENV == 'm1') {
    vuxDivider = require('vuxDivider');
  }

  nums.forEach(v => {
    if (v % 5 === 0)
      fives.push(v);
  });
  
  module.exports = {
    components: {
      vuxDivider: vuxDivider
    }
  };

  console.log(u)
  console.log(vd)
</script>

<style lang="scss">
@import "./utilities/importsprite";

body {
  display: flex;
}
</style>
