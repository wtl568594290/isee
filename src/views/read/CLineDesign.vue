<template>
  <div>
      <el-text>
        {{ props.label }}
        <el-button
          :icon="Minus"
          @click="operate(props.ele as keyof typeof lineDesign, 'down')"
          text
        ></el-button>
        {{ getValue }}
        <el-button
          :icon="Plus"
          @click="operate(props.ele as keyof typeof lineDesign, 'up')"
          text
        ></el-button>
      </el-text>
  </div>
</template>
<script setup lang="ts">
import { Plus, Minus} from '@element-plus/icons-vue'
import { lineDesign } from './style'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  fixed: {
    type: Number,
    required: false,
    default: 0,
  },
  ele: {
    type: String,
    required: true,
    validator: (value: string) => {
      return Object.keys(lineDesign).includes(value)
    },
  },
})

const getValue = computed(() => {
  const v = parseFloat(
    lineDesign[props.ele as keyof typeof lineDesign].value + '',
  ).toFixed(props.fixed)
  if (v == '0.0') return '0'
  else return v
})

const emit = defineEmits<{
  operate: [ele: keyof typeof lineDesign, action: 'up' | 'down' | 'reset']
}>()
function operate(
  ele: keyof typeof lineDesign,
  action: 'up' | 'down' | 'reset',
) {
  emit('operate', ele, action)
}
</script>
<style lang="scss" scoped></style>
