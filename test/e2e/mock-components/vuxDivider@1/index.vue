<template>
  <p class="vux-divider">
    <slot></slot>
  </p>
</template>

<style>
  .vux-divider {
    display: table;
    white-space: nowrap;
    height: auto;
    overflow: hidden;
    line-height: 1;
    text-align: center;
    padding: 10px 0;
    color: #666;
  }

  .vux-divider:after, .vux-divider:before {
    content: '';
    display: table-cell;
    position: relative;
    top: 50%;
    width: 50%;
    background-repeat: no-repeat;
    background-image: url("./divider.png");
  }

  .vux-divider:before {
    background-position: right 1em top 50%
  }

  .vux-divider:after {
    background-position: left 1em top 50%
  }
</style>
