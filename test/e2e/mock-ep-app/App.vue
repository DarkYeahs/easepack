<template>
  <h2>hello</h2>
</template>

<script>
  var vuxDivider = {};
  if (process.env.NODE_ENV == 'm1') {
    vuxDivider = require('vuxDivider');
  }
  module.exports = {
    components: {
      vuxDivider: vuxDivider
    }
  };
</script>

<style>
  body {
    display: flex;
    background-image: url("./image1.png");
  }
</style>
