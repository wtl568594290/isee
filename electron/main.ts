import { app, BrowserWindow, Menu, MenuItem } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import store from './store'
import register from './register'
import IPC from './ipc'
import { EIPC, EROUTE } from './enums'

// TODO 临时关闭web安全性，后续需要关闭，否则无法跨域
app.commandLine.appendSwitch('disable-web-security')

createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

const WIN_SIZE = 'windowBounds'
function createWindow() {
  const { width, height } = store.get(WIN_SIZE, {
    width: 800,
    height: 600,
  }) as any
  win = new BrowserWindow({
    title: 'ISee',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  win.on('close', () => {
    if (win?.isMaximized() || win?.isMinimized()) return
    // 关闭时保存窗口大小
    const [width, height] = win?.getSize() || [800, 600]
    store.set(WIN_SIZE, { width, height })
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
    // dev下添加menu
    const menu = Menu.getApplicationMenu()
    if (menu != null) {
      const bookItem = new MenuItem({
        label: 'Books',
        submenu: [
          {
            label: 'Home',
            click: () => {
              // 打开home页面
              win?.webContents.send(EIPC.ROUTE, EROUTE.HOME)
            },
          },
          {
            label: 'Search',
            click: () => {
              win?.webContents.send(EIPC.ROUTE, EROUTE.SEARCH)
            },
          },
        ],
      })
      menu.append(bookItem)
      Menu.setApplicationMenu(menu)
    }
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    // production下删除menu
    Menu.setApplicationMenu(null)
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// 注册软件，首次注册时会清空数据库
register()
IPC()
