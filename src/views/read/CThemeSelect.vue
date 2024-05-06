<template>
  <el-tooltip
    class="box-item"
    effect="dark"
    :content="label"
    placement="bottom"
    :disabled="!label"
  >
    <div :style="style" class="theme-select" @click="select"></div>
  </el-tooltip>
</template>
<script lang="ts" setup>
const emit = defineEmits<{
  select: [bg: string, fg: string]
}>()
const select = () => {
  emit('select', props.bg, props.fg)
}
const props = defineProps({
  label: {
    type: String,
    required: false,
  },
  bg: {
    type: String,
    required: true,
  },
  fg: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: false,
    default: 30,
  },
})
const style = reactive({
  width: props.size + 'px',
  height: props.size + 'px',
  background:
    'linear-gradient(135deg,' + props.fg + ' 50%,' + props.bg + ' 50%)',
})
</script>
<style lang="scss" scoped>
.theme-select {
  display: inline-block;
  cursor: pointer;
  border: 2px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  // 鼠标放上去添加阴影效果
  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }
  // 鼠标点击添加重影效果
  &:active {
    box-shadow: var(--el-box-shadow);
  }
}
</style>
