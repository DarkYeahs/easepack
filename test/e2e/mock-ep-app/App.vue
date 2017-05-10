<template>
  <h2>hello</h2>
</template>

<script>
  var vuxDivider = {};
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
  @import "./duplicate";
  body {
    display: flex;
    background-image: url("./image1.png");
  }
</style>
