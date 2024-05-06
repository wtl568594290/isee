import { EIPC, ESTORE } from '@/../electron/enums'
const lineDesign = reactive({
  'font-size': {
    value: 16,
    label: '字体',
    fixed: 0,
    unit: 'px',
    estore: ESTORE.FONT_SIZE,
  },
  'line-height': {
    value: 1.5,
    label: '行高',
    fixed: 1,
    unit: 'em',
    estore: ESTORE.LINE_HEIGHT,
  },
  'letter-spacing': {
    value: 0,
    label: '间距',
    fixed: 1,
    unit: 'px',
    estore: ESTORE.LETTER_SPACING,
  },
  'font-weight': {
    value: 400,
    label: '粗细',
    fixed: 0,
    unit: '',
    estore: ESTORE.FONT_WEIGHT,
  },
})

const colorClass = reactive({
  bg: {
    label: '背景',
    value: '#ffffff',
    show: true,
    estore: ESTORE.BACKGROUND_COLOR,
  },
  font: {
    label: '字体',
    value: '#000000',
    show: true,
    estore: ESTORE.FONT_COLOR,
  },
  title: {
    label: '标题',
    value: '#665f5f',
    show: true,
    estore: ESTORE.TITLE_COLOR,
  },
  progress: {
    label: '进度',
    value: '#000000',
    show: true,
    estore: ESTORE.PROGRESS_COLOR,
  },
})

async function changeLineDesign(
  // key: keyof typeof lineDesign,
  key: string,
  action: 'up' | 'down' | 'reset',
) {
  const actionIPC = {
    up: EIPC.INCRECE_STORE,
    down: EIPC.DECRECE_STORE,
    reset: EIPC.RESET_STORE,
  }
  const k1 = key as keyof typeof lineDesign
  const value = await window.ipcRenderer.invoke(
    actionIPC[action],
    lineDesign[k1].estore,
  )
  lineDesign[k1].value = value
}

async function initStyle() {
  for (const key in lineDesign) {
    const k1 = key as keyof typeof lineDesign
    const value = await window.ipcRenderer.invoke(
      EIPC.GET_STORE,
      lineDesign[k1].estore,
    )
    lineDesign[k1].value = value
  }

  for (const key in colorClass) {
    const k1 = key as keyof typeof colorClass
    const value = await window.ipcRenderer.invoke(
      EIPC.GET_STORE,
      colorClass[k1].estore,
    )
    colorClass[k1].value = value
  }
}

async function changeColorClass(key: keyof typeof colorClass) {
  await window.ipcRenderer.invoke(
    EIPC.SET_STORE,
    colorClass[key].estore,
    colorClass[key].value,
  )
}

async function resetStyle() {
  for (const key in lineDesign) {
    const k1 = key as keyof typeof lineDesign
    const value = await window.ipcRenderer.invoke(
      EIPC.RESET_STORE,
      lineDesign[k1].estore,
    )
    lineDesign[k1].value = value
  }

  for (const key in colorClass) {
    const k1 = key as keyof typeof colorClass
    const value = await window.ipcRenderer.invoke(
      EIPC.RESET_STORE,
      colorClass[k1].estore,
    )
    colorClass[k1].value = value
  }
}

async function setTheme(bg: string, fg: string) {
  for (const key in colorClass) {
    const k1 = key as keyof typeof colorClass
    if (k1 == 'bg') {
      colorClass[k1].value = await window.ipcRenderer.invoke(
        EIPC.SET_STORE,
        colorClass[k1].estore,
        bg,
      )
    } else {
      colorClass[k1].value = await window.ipcRenderer.invoke(
        EIPC.SET_STORE,
        colorClass[k1].estore,
        fg,
      )
    }
  }
}

export {
  initStyle,
  colorClass,
  changeColorClass,
  changeLineDesign,
  lineDesign,
  resetStyle,
  setTheme,
}
