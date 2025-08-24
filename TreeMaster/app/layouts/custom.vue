<template>
    <div class="main">
         <p>custom layoup</p>
         <slot />
    </div>
</template>
<style scoped>
.main{
    background: blue;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
}
</style>