<template lang="">
  <router-view />
</template>
<script lang="ts" setup>
import router from '@/router'
import { EIPC, EROUTE } from '@/../electron/enums'
window.ipcRenderer.on(EIPC.ROUTE, (_, routeName) => {
  if (Object.values(EROUTE).includes(routeName)) {
    router.push(routeName)
  }
})
</script>
<style lang="scss" scoped></style>
