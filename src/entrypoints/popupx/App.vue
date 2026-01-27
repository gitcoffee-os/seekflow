<script lang="ts" setup>
// 移除 HelloWorld 组件的导入，因为我们的项目中可能没有这个组件
</script>

<template>
  <div>
    <!-- 使用我们项目中已有的 logo.svg 文件 -->
    <img src="@/assets/logo.svg" class="logo" alt="SeekFlow logo" />
  </div>
  <h1>Welcome to SeekFlow!</h1>
  <p>This is a simple popup page for SeekFlow extension.</p>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #54bc4ae0);
}
</style>
