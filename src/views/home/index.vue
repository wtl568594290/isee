<template>
  <el-input
    class="search"
    v-model="search.name"
    :prefix-icon="Search"
    placeholder="请输入书名"
    @input="handleSearch"
    clearable
  ></el-input>
  <el-table
    v-loading="loading"
    :data="tableData"
    style="width: 100%"
    :max-height="tableHeight"
    :border="false"
  >
    <el-table-column label="书名" align="center">
      <template #default="{ row }">
        <span class="book-name" @click="openBook(row)">{{ row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="进度" align="center">
      <template #default="{ row }">
        {{ formatProgress(row.lastLine, row.total) }}%
      </template>
    </el-table-column>
    <el-table-column label="更新时间" align="center">
      <template #default="{ row }">
        {{ formatDateTime(row.updatedAt) }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="120" align="center">
      <template #header>
        <el-button text type="primary" size="small" @click="handleImport"
          >导入</el-button
        >
      </template>
      <template #default="{ row }">
        <el-popconfirm
          confirm-button-text="确定"
          cancel-button-text="取消"
          :icon="InfoFilled"
          icon-color="#626AEF"
          :title="'确定删除《' + row.name + '》吗？'"
          :hide-after="0"
          @confirm="handleDelete(row)"
        >
          <template #reference>
            <el-button text type="danger" size="small">删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>
  <div class="pagination-container">
    <el-pagination
      v-model:page-size="search.pageSize"
      v-model:current-page="search.page"
      :total="total"
      layout="sizes,prev, pager, next,total"
      :page-sizes="[10, 20, 50]"
      @change="getBookList"
    >
    </el-pagination>
  </div>
</template>

<script lang="ts" setup>
import debounce from 'lodash/debounce'
import { Search, InfoFilled } from '@element-plus/icons-vue'
import { Book } from '@prisma/client'
import router from '@/router'
import { EIPC } from '@/../electron/enums'
const SPACE_HEIGHT = 120

const search = reactive({
  name: '',
  page: 1,
  pageSize: 10,
})
const total = ref(0)
const tableData = ref<Book[]>([])
const tableHeight = ref(window.innerHeight - SPACE_HEIGHT)
const loading = ref(false)

const handleSearch = debounce(() => {
  getBookList()
}, 500)

function formatProgress(lastLine: number, total: number) {
  // 保留两位小数
  if (total === 0) return '0'
  if (lastLine >= total) return '100'
  let fmt = (((lastLine + 1) / total) * 100).toFixed(2)
  if (fmt === '0.00') {
    fmt = '0'
  } else if (fmt === '100.00') {
    fmt = '100'
  }
  return fmt
}

function formatDateTime(updatedAt: Date) {
  return new Date(updatedAt).toLocaleString()
}

function getBookList() {
  loading.value = true
  window.ipcRenderer
    .invoke(EIPC.GET_BOOKS, {
      name: search.name,
      page: search.page,
      pageSize: search.pageSize,
    })
    .then((res) => {
      tableData.value = res.data
      total.value = res.total
    })
    .finally(() => {
      loading.value = false
    })
}

function handleDelete(row: Book) {
  window.ipcRenderer.invoke(EIPC.DELETE_BOOK, { id: row.id }).then(() => {
    getBookList()
  })
}

function handleImport() {
  loading.value = true
  window.ipcRenderer
    .invoke(EIPC.CREATE_BOOK)
    .then((names: string[]) => {
      if (names.length === 0) return
      getBookList()
    })
    .finally(() => {
      loading.value = false
    })
}

function openBook(row: any) {
  const book = row as Book
  router.push({
    name: 'Read',
    query: { id: book.id },
  })
  import.meta.env.VITE_DATABASE_URL
}

const handleResize = debounce(() => {
  const h = window.innerHeight - SPACE_HEIGHT
  if (h > 0) {
    tableHeight.value = h
  }
}, 100)

onMounted(() => {
  getBookList()
  handleResize()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
<style scoped lang="scss">
.search {
  margin: 10px 0;
}
.book-name {
  cursor: pointer;
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>
