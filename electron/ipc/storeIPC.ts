import store from '../store'
import { EIPC, ESTORE } from '../enums'

const stores = {
  [ESTORE.FONT_SIZE]: {
    max: 32,
    min: 12,
    step: 2,
    default: 20,
  },
  [ESTORE.LINE_HEIGHT]: {
    max: 3,
    min: 1,
    step: 0.2,
    default: 1.8,
  },
  [ESTORE.LETTER_SPACING]: {
    max: 2,
    min: 0,
    step: 0.2,
    default: 0,
  },
  [ESTORE.FONT_WEIGHT]: {
    max: 900,
    min: 100,
    step: 100,
    default: 400,
  },
  [ESTORE.FONT_COLOR]: {
    default: '#111111',
  },
  [ESTORE.BACKGROUND_COLOR]: {
    default: '#eeeeee',
  },
  [ESTORE.TITLE_COLOR]: {
    default: '#665f5f',
  },
  [ESTORE.PROGRESS_COLOR]: {
    default: '#111111',
  },
}

export default [
  {
    name: EIPC.GET_STORE,
    handler: async (_: any, key: ESTORE) => store.get(key, stores[key].default),
  },
  {
    name: EIPC.SET_STORE,
    handler: async (_: any, key: ESTORE, value: any) => {
      const max = (stores[key] as any).max
      const min = (stores[key] as any).min
      if (max && value > max) value = max
      if (min && value < min) value = min
      store.set(key, value)
      return value
    },
  },
  {
    name: EIPC.INCRECE_STORE,
    handler: async (_: any, key: ESTORE.FONT_SIZE | ESTORE.LINE_HEIGHT) => {
      let value = store.get(key, stores[key].default) as number
      value += stores[key].step
      // 只保留一位小数，四舍五入
      value = Math.round(value * 10) / 10
      if (value > stores[key].max) value = stores[key].max
      store.set(key, value)
      return value
    },
  },
  {
    name: EIPC.DECRECE_STORE,
    handler: async (_: any, key: ESTORE.FONT_SIZE | ESTORE.LINE_HEIGHT) => {
      let value = store.get(key, stores[key].default) as number
      value -= stores[key].step
      // 只保留一位小数，四舍五入
      value = Math.round(value * 10) / 10
      if (value < stores[key].min) value = stores[key].min
      store.set(key, value)
      return value
    },
  },
  {
    name: EIPC.RESET_STORE,
    handler: async (_: any, key: ESTORE) => {
      const value = stores[key].default
      store.set(key, value)
      return value
    },
  },
]
