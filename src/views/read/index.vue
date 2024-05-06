<template>
  <div
    class="read"
    :style="{
      backgroundColor: colorClass.bg.value,
      padding: READ_PADDING,
    }"
  >
    <div class="container">
      <p
        class="chapter-title"
        :style="[{ color: colorClass.title.value }]"
        :class="{
          'status-animate': isAnimate,
          'chapter-title-first': pageIndex === 0,
        }"
      >
        {{ chapterTitle }}
      </p>
      <el-progress
        :percentage="chapterPercentage"
        :show-text="false"
        :stroke-width="PROGRESS_BAR_HEIGHT"
        :color="colorClass.progress.value"
      >
      </el-progress>
      <div class="content">
        <p
          :style="[lineDesignStyle, { color: colorClass.font.value }]"
          class="line-static"
          v-for="(item, key) in pageContent"
          :key="key"
        >
          {{ getLineTxt(item) }}
        </p>
      </div>
    </div>
    <div class="pre-content" @click="prev"></div>
    <div class="next-content" @click="next"></div>
    <div class="directory" @click="openDirectory"></div>
    <div class="settings" @click="settingsVisible = true"></div>
    <el-dialog v-model="settingsVisible">
      <template #header>
        <div style="text-align: center">
          阅读设置
          <el-button :icon="RefreshLeft" @click="resetStyle" text></el-button>
        </div>
      </template>
      <div class="settings-content">
        <c-line-design
          v-for="(_, key) in lineDesign"
          :label="lineDesign[key].label"
          :ele="key"
          :fixed="lineDesign[key].fixed"
          @operate="changeLineDesign"
          :key="key"
        ></c-line-design>
        <div class="color-list">
          颜色
          <span
            v-for="(_, key) in colorClass"
            :key="key"
            v-show="colorClass[key].show"
          >
            {{ colorClass[key].label }}
            <el-color-picker
              v-model="colorClass[key].value"
              @change="changeColorClass(key)"
            />
          </span>
        </div>
        <div class="theme-list">
          主题
          <c-theme-select
            v-for="(item, key) in THEMES"
            :label="item.label"
            :fg="item.fg"
            :bg="item.bg"
            :key="key"
            @select="setTheme"
          ></c-theme-select>
        </div>
      </div>
    </el-dialog>
    <el-drawer
      v-model="directoryDrawer"
      direction="ltr"
      size="45%"
      :show-close="false"
    >
      <template #header>
        <div>目录</div>
      </template>
      <el-scrollbar ref="dirScrollRef">
        <div id="dir-container">
          <p
            class="dirs"
            :class="{ 'dir-select': key === currentChapterIndex }"
            v-for="(item, key) in dirsRef"
            :key="key"
            @click="jumpChapter(key)"
          >
            {{ item.label }}
          </p>
        </div>
        <!-- 用于计算目录滚动位置 -->
      </el-scrollbar>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { EIPC } from '@/../electron/enums'
import { RefreshLeft } from '@element-plus/icons-vue'
import throttle from 'lodash/throttle'
import debounce from 'lodash/debounce'
import { useRoute, useRouter } from 'vue-router'
import { Book } from '@prisma/client'
import { ElMessageBox, ElScrollbar, ElLoading } from 'element-plus'
import {
  initStyle,
  colorClass,
  changeColorClass,
  changeLineDesign,
  lineDesign,
  resetStyle,
  setTheme,
} from './style'
import CLineDesign from './CLineDesign.vue'
import CThemeSelect from './CThemeSelect.vue'

const CHAPTER_INDEX_MAX = 999999999
const PROGRESS_BAR_HEIGHT = 1
const READ_PADDING = '16px'
const THEMES = [
  {
    label: '黑白',
    fg: '#111111',
    bg: '#eeeeee',
  },
  {
    label: '白黑',
    fg: '#eeeeee',
    bg: '#111111',
  },
  {
    label: '护眼',
    fg: '#111111',
    bg: '#e6fae4',
  },
  {
    label: '泛黄',
    fg: '#111111',
    bg: '#f1e5c9',
  },
]

const route = useRoute()
const router = useRouter()
let book: Book
let dirs: IDir[] = []
let full: string[] = []
const dirsRef = ref<IDir[]>([])

const dirScrollRef = ref<InstanceType<typeof ElScrollbar>>()

const chapterTitle = ref('')
/** 章节索引，为-1时是文件开头没有章节目录的所有内容 */
const currentChapterIndex = ref(-1)
/** 章节内容数组 */
let chapterContent: string[] = []
/** 分段索引 */
const pageIndex = ref(0)
/** 分段列表 */
const pageList: IPageContent[][] = reactive([])
/** 当前显示分段 */
const pageContent = ref<IPageContent[]>([])
/** 章节更改动画 */
const isAnimate = ref(false)

/** 章节阅读进度 */
const chapterPercentage = computed(() => {
  if (pageList.length <= 1) return 100
  const percentage = (pageIndex.value / (pageList.length - 1)) * 100
  // const percentage = ((pageIndex.value + 1) / pageList.length) * 100
  return percentage
})

/** lineDesign转style模式 */
const lineDesignStyle = computed(() => {
  const b: { [key in keyof typeof lineDesign]?: string } = {}
  for (const key in lineDesign) {
    const k1 = key as keyof typeof lineDesign
    b[k1] = lineDesign[k1].value + lineDesign[k1].unit
  }
  return b
})

const directoryDrawer = ref(false)
const settingsVisible = ref(false)

async function getBook(bookId: number) {
  const loading = ElLoading.service({ fullscreen: true })
  try {
    const res = await window.ipcRenderer.invoke(EIPC.GET_BOOK, {
      id: bookId,
    })
    book = res.book
    dirs = res.dirs
    full = res.full
    dirsRef.value = dirs
    lastLineToChapterIndex(book.lastLine)
    const { start } = chapterIndexToStartEnd(currentChapterIndex.value)
    getChapter(currentChapterIndex.value)
    // 计算jumpTo的位置
    let cntLine = book.lastLine - start
    let page = 0
    for (page = 0; page < pageList.length; page++) {
      if (
        pageList[page][0].index <= cntLine &&
        pageList[page][pageList[page].length - 1].index >= cntLine
      ) {
        break
      }
    }
    jumpPage(page, false)
  } catch (err) {
    const msg = (err as any).message || '加载Book失败'
    ElMessageBox.alert(msg, '错误', {
      type: 'error',
      confirmButtonText: '返回',
      callback: () => {
        router.back()
      },
    })
  } finally {
    loading.close()
  }
}

/** 查找lastline所在章节的索引 */
function lastLineToChapterIndex(lastLine: number) {
  let index = -1
  for (let i = 0; i < dirs.length; i++) {
    if (lastLine >= dirs[i].index) {
      index = i
    } else {
      break
    }
  }
  currentChapterIndex.value = index
  return index
}

// /** 根据章节索引，获得章节内容起/止位置 */
function chapterIndexToStartEnd(index: number): { start: number; end: number } {
  let start = 0
  let end = 0
  if (index === -1) {
    start = 0
    end = dirs[0].index - 1
  } else if (index === dirs.length - 1) {
    start = dirs[index].index
    end = CHAPTER_INDEX_MAX
  } else {
    start = dirs[index].index
    end = dirs[index + 1].index - 1
  }
  return { start, end }
}

/** 取章节 */
function getChapter(index: number) {
  const { start, end } = chapterIndexToStartEnd(index)
  chapterContent = full.slice(start, end)
  chapterTitle.value = book.name
  if (chapterContent.length > 0) {
    const title = chapterContent[0]
    if (title.match(/第[一二三四五六七八九十百千万零〇0-9]+(章|卷)/)) {
      chapterTitle.value = title
      // 从章节内容中删除标题
      chapterContent.shift()
    }
  }
  processAricles()
}

/** 跳转指定章节 */
function jumpChapter(index: number) {
  currentChapterIndex.value = index
  getChapter(index)
  jumpPage(0)
  directoryDrawer.value = false
}

/** 跳转到指定片段,更新历史记录 */
function jumpPage(index: number, save = true) {
  if (index < 0) {
    index = 0
  } else if (index >= pageList.length - 1) {
    index = pageList.length - 1
  }
  pageIndex.value = index
  pageContent.value = pageList[pageIndex.value]
  if (save) {
    // 计算lastLine
    const { start } = chapterIndexToStartEnd(currentChapterIndex.value)
    let lastline = pageList[pageIndex.value][0].index + start
    // 为了保证最后一页时阅读率100%,当翻到最后一页时lastline为最后一行
    if (
      currentChapterIndex.value === dirs.length - 1 &&
      pageIndex.value === pageList.length - 1
    ) {
      lastline = full.length - 1
    }
    changeBookLastLine(lastline)
  }
}

/** 章节分段 */
function processAricles() {
  pageList.splice(0, pageList.length)
  // 创建一个虚拟的dom，这个虚拟dom的显示区域与content一样，所有它的padding应该包含content的padding及margin
  let padding = proccessPaddingText(READ_PADDING)
  let virContent = document.createElement('div')
  virContent.style.position = 'absolute'
  virContent.style.width =
    window.innerWidth - padding.left - padding.right + 'px'
  virContent.style.height = 'auto'
  virContent.style.left = '-10000px' // 将容器放在屏幕外的某个地方
  virContent.style.paddingTop =
    padding.top + padding.bottom + PROGRESS_BAR_HEIGHT + 'px'
  const container = document.querySelector('.container')
  container?.appendChild(virContent)
  const title = document.createElement('p')
  title.className = 'chapter-title chapter-title-first'
  title.innerHTML = chapterTitle.value
  virContent.appendChild(title)
  const sc: IPageContent[] = []
  for (let i = 0; i < chapterContent.length; i++) {
    let txt = chapterContent[i]
    const line = document.createElement('p')
    line.style.cssText = Object.entries(lineDesignStyle.value)
      .map(([key, value]) => `${key}:${value}`)
      .join(';')
    line.className = 'line-static'
    line.innerHTML = txt
    virContent.appendChild(line)
    sc.push({ index: i, start: 0, end: chapterContent[i].length })
    if (virContent.clientHeight > window.innerHeight) {
      line.innerHTML = ''
      sc.pop()
      for (let j = 0; j < chapterContent[i].length; j++) {
        const span = document.createElement('span')
        span.innerHTML = chapterContent[i][j]
        line.appendChild(span)
        if (virContent.clientHeight >= window.innerHeight) {
          span.innerHTML = ''
          if (j === 0) {
            pageList.push([...sc])
            sc.splice(0, sc.length)
          } else {
            sc.push({ index: i, start: 0, end: j })
            pageList.push([...sc])
            sc.splice(0, sc.length)
            sc.push({ index: i, start: j, end: chapterContent[i].length })
          }
          break
        }
      }
      // 清空container,准备下个页面
      virContent.innerHTML = ''
      title.className = 'chapter-title'
      virContent.appendChild(title)
      if (sc.length > 0) {
        const aline = line.cloneNode(true) as HTMLElement
        aline.innerHTML = getLineTxt(sc[0])
        virContent.appendChild(aline)
      }
    }
  }
  if (sc.length > 0) {
    pageList.push(sc)
  }
  // 删除虚拟dom
  container?.removeChild(virContent)
}

/** 取每行内容 */
function getLineTxt(item: IPageContent) {
  return chapterContent[item.index].slice(item.start, item.end)
}

/** 更新记录,防抖 */
const changeBookLastLine = debounce((lastLine: number) => {
  book.lastLine = lastLine
  window.ipcRenderer.invoke(EIPC.UPDATE_BOOK_HISTORY, {
    id: book.id,
    lastLine: lastLine,
  })
}, 100)

/** 下一页 */
function next() {
  let target = pageIndex.value + 1
  if (target > pageList.length - 1) {
    if (currentChapterIndex.value === dirs.length - 1) {
      return
    }
    getChapter(++currentChapterIndex.value)
    jumpPage(0)
  } else {
    jumpPage(target)
  }
}

/** 上一页 */
function prev() {
  let target = pageIndex.value - 1
  if (target < 0) {
    if (currentChapterIndex.value === -1) {
      return
    }
    getChapter(--currentChapterIndex.value)
    jumpPage(pageList.length - 1)
  } else {
    jumpPage(target)
  }
}

/** 打开目录列表,并滚动到当前章节目录 */
function openDirectory() {
  directoryDrawer.value = true
  // 这里nexttick效果不行，改用settimeout
  nextTick(() => {
    let scrollTop = 0
    if (currentChapterIndex.value >= 0) {
      const dirContainer = document.getElementById('dir-container')
      if (dirContainer) {
        scrollTop =
          (dirContainer.clientHeight * currentChapterIndex.value) /
          (dirs.length - 1)
      }
    }
    if (scrollTop > window.innerHeight / 3) {
      scrollTop -= window.innerHeight / 3
    }
    dirScrollRef.value?.setScrollTop(scrollTop)
  })
}

/** 解析padding css txt */
function proccessPaddingText(txt: string): {
  left: number
  right: number
  top: number
  bottom: number
} {
  let padding = { left: 0, right: 0, top: 0, bottom: 0 }
  let reg = /(\d+px\s?){1,4}/g
  let res = txt.match(reg)
  if (res) {
    let arr = res[0].split(' ')
    padding.top = parseInt(arr[0])
    padding.right = parseInt(arr[1] || arr[0])
    padding.bottom = parseInt(arr[2] || arr[0])
    padding.left = parseInt(arr[3] || arr[1] || arr[0])
  }
  return padding
}

/** 页面改变大小事件,去抖 */
const handleResize = debounce(() => {
  if (pageContent.value.length === 0) return
  let index = pageContent.value[0].index
  processAricles()
  for (let i = 0; i < pageList.length; i++) {
    if (
      pageList[i][0].index <= index &&
      pageList[i][pageList[i].length - 1].index >= index
    ) {
      jumpPage(i)
      return
    }
  }
  jumpPage(0)
}, 500)

/** 滚动事件,防止频繁触发 */
const handleWheel = throttle((event: WheelEvent) => {
  if (directoryDrawer.value || settingsVisible.value) return
  if (event.deltaY > 0) {
    next()
  } else {
    prev()
  }
}, 80)

/** keydown事件 */
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
    case 'PageDown':
      if (!settingsVisible.value && !directoryDrawer.value) {
        next()
      }
      break
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'PageUp':
      if (!settingsVisible.value && !directoryDrawer.value) {
        prev()
      }
      break
    case 'Escape':
      if (settingsVisible.value) {
        settingsVisible.value = false
      } else if (directoryDrawer.value) {
        directoryDrawer.value = false
      } else {
        router.back()
      }
      break
  }
}

/** 行布局有变化时，重新解析章节 */
watch(lineDesignStyle, () => {
  handleResize()
})

/** 章节变动时更新动画 */
watch(currentChapterIndex, () => {
  isAnimate.value = false
  setTimeout(() => {
    isAnimate.value = true
  }, 1)
})

onMounted(async () => {
  await initStyle()
  await getBook(parseInt(route.query.id as string))
  window.addEventListener('wheel', handleWheel)
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})
</script>
<style lang="scss" scoped>
.read {
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
}
:deep(.chapter-title) {
  text-align: center;
  margin: 10px 0;
}
:deep(.chapter-title-first) {
  font-size: 48px;
  font-weight: bold;
}
:deep(.line-static) {
  text-align: left;
  margin: 0;
}

@keyframes deformation {
  from {
    transform: translateX(-50vw);
  }
  to {
    transform: translateX(0);
  }
}
.status-animate {
  animation: deformation 0.5s forwards;
}

.dirs {
  cursor: pointer;
  padding: 5px;
  margin: 5px 0;
  &:hover {
    background-color: #f0f0f0;
  }
}
.dir-select {
  background-color: #f0f0f0;
}
.pre-content {
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 33vw;
  background-color: #f0f0f0;
  opacity: 0;
}
.next-content {
  position: absolute;
  right: 0;
  top: 0;
  height: 100vh;
  width: 33vw;
  background-color: #f0f0f0;
  opacity: 0;
}
.directory {
  position: absolute;
  left: 33vw;
  top: 0;
  height: 50vh;
  width: 34vw;
  background-color: #f0f0f0;
  opacity: 0;
}
.settings {
  position: absolute;
  left: 33vw;
  top: 50vh;
  height: 50vh;
  width: 34vw;
  background-color: #f0f0f0;
  opacity: 0;
}

.settings-content {
  // 所有元素添加垂直间距
  > * {
    margin-bottom: 5px;
  }

  .color-list {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .theme-list {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
</style>
