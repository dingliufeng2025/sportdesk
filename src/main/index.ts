import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { initUserData } from './config-manager'
import { seedCacheIfNeeded } from './adapters/fake-adapters'
import { registerIpcHandlers } from './ipc-handlers'

let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口并加载渲染进程。
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'SportDesk',
    backgroundColor: '#0f1117',
    webPreferences: {
      // electron-vite 在 package.json type=module 时输出 preload 为 index.mjs（非 index.js）
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initUserData()
  seedCacheIfNeeded()
  registerIpcHandlers(() => mainWindow)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
