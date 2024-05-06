import { ipcMain } from 'electron'
import bookIPC from './bookIPC'
import storeIPC from './storeIPC'

export default function () {
  bookIPC.forEach(({ name, handler }) => {
    ipcMain.handle(name, handler)
  })
  storeIPC.forEach(({ name, handler }) => {
    ipcMain.handle(name, handler)
  })
}
