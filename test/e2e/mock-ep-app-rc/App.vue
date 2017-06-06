<template>
  <h2>hello</h2>
</template>

<script>
  window.nums = [];
  var vuxDivider = {};

  window.testDefault = {
    class: 'TEST'
  }
  window.testDefault.default = 1

  // var spriteUrl = __sprite_map__('leftright/*.png');
  /* var spriteUrl = __sprite_map__('leftright/*.png'); */
  var spriteStr = "__sprite_map__('leftright/*.png')";

  var spriteUrl = __sprite_map__('leftright/*.png');
  
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
</script>

<style>
  body {
    display: flex;
  }
</style>
