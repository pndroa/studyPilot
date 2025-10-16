import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  })

  setTimeout(() => {
    win.loadURL('http://localhost:3000')
  }, 2000)
}

app.whenReady().then(createWindow)
