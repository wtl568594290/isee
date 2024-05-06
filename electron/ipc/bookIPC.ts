import { dialog, BrowserWindow } from 'electron'
import {
  createBook,
  deleteBook,
  getBook,
  getBooksByName,
  updateHistory,
} from '../dao/book'
import path from 'path'
import readline from 'readline'
import fs from 'fs'
import { EIPC } from '../enums'

/** 选择文件 */
function selectFile() {
  const win = BrowserWindow.getFocusedWindow()
  return dialog.showOpenDialog(win!!, {
    properties: ['openFile', 'multiSelections'],
    // 单选
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  })
}

/** 文件复制到download下 */
function copyFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const baseName = path.basename(filePath)
    fs.cp(filePath, path.join(process.cwd(), 'download', baseName), (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(baseName)
      }
    })
  })
}

/** 获取文件的行数 */
function getFileLineCount(filename: string): Promise<number> {
  const filePath = path.join(process.cwd(), 'download', filename)
  return new Promise((resolve, reject) => {
    let cnt = 0
    const stream = readline.createInterface({
      input: fs.createReadStream(filePath),
    })
    stream.on('line', () => {
      cnt++
    })
    stream.on('close', () => {
      resolve(cnt)
    })
    stream.on('error', (err) => {
      reject(err)
    })
  })
}

/** 生成目录,文本数组 */
function processBook(
  filename: string,
): Promise<{ dirs: IDir[]; full: string[] }> {
  const filePath = path.join(process.cwd(), 'download', filename)
  return new Promise((resolve, reject) => {
    const stream = readline.createInterface({
      input: fs.createReadStream(filePath),
    })
    const dirs: IDir[] = []
    const full: string[] = []
    let cnt = 0
    stream.on('line', (line) => {
      if (line.match(/第[一二三四五六七八九十百千万零〇0-9]+(章|卷)/)) {
        dirs.push({
          label: line,
          index: cnt,
        })
      }
      full.push(line)
      cnt++
    })
    stream.on('close', () => {
      resolve({ dirs, full })
    })
    stream.on('error', (err) => {
      reject(err)
    })
  })
}

const handleCreateBook = async () => {
  const names = []
  const filePath = await selectFile()
  if (!filePath.canceled) {
    for (const file of filePath.filePaths) {
      const baseName = await copyFile(file)
      const total = await getFileLineCount(baseName)
      const name = path.basename(baseName, path.extname(baseName))
      const book = await createBook(name, total)
      names.push(book.name)
    }
  }
  return names
}

const handleDeleteBook = async (_: any, options: { id: number }) => {
  return await deleteBook(options.id)
}

const handleGetBook = async (_: any, options: { id: number }) => {
  const book = await getBook(options.id)
  if (!book) {
    throw new Error('Book not found')
  }
  const { dirs, full } = await processBook(book.name + '.txt')
  return { book, dirs, full }
}

const handleGetBooks = async (
  _: any,
  options: { name: string; page: number; pageSize: number },
) => {
  return await getBooksByName(options.name, options.page, options.pageSize)
}

const handleUpdateHistory = async (
  _: any,
  options: { id: number; lastLine: number },
) => {
  return await updateHistory(options.id, options.lastLine)
}

export default [
  {
    name: EIPC.GET_BOOKS,
    handler: handleGetBooks,
  },
  {
    name: EIPC.CREATE_BOOK,
    handler: handleCreateBook,
  },
  {
    name: EIPC.DELETE_BOOK,
    handler: handleDeleteBook,
  },
  {
    name: EIPC.GET_BOOK,
    handler: handleGetBook,
  },
  {
    name: EIPC.UPDATE_BOOK_HISTORY,
    handler: handleUpdateHistory,
  },
]
