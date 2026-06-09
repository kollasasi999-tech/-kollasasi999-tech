const { app, BrowserWindow, ipcMain, screen, session, globalShortcut, Tray, nativeImage, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const zlib = require('zlib')
const Anthropic = require('@anthropic-ai/sdk')

let mainWindow
let tray = null
let forceQuit = false
const settingsPath = path.join(app.getPath('userData'), 'settings.json')

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    }
  } catch (e) {}
  return {}
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  } catch (e) {}
}

let settings = loadSettings()

// Build a 16x16 solid-color PNG in memory (no external deps)
function createTrayIconPNG() {
  const w = 16, h = 16, r = 124, g = 90, b = 240
  const rowSize = 1 + w * 3
  const raw = Buffer.alloc(h * rowSize)
  for (let y = 0; y < h; y++) {
    raw[y * rowSize] = 0 // filter: None
    for (let x = 0; x < w; x++) {
      const i = y * rowSize + 1 + x * 3
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b
    }
  }
  const compressed = zlib.deflateSync(raw)

  function crc32(buf) {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    let crc = -1
    for (const byte of buf) crc = t[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
    return (crc ^ -1) >>> 0
  }

  function pngChunk(type, data) {
    const t = Buffer.from(type, 'ascii')
    const crc = crc32(Buffer.concat([t, data]))
    const out = Buffer.alloc(4 + 4 + data.length + 4)
    out.writeUInt32BE(data.length, 0)
    t.copy(out, 4)
    data.copy(out, 8)
    out.writeUInt32BE(crc, 8 + data.length)
    return out
  }

  const ihdr = Buffer.from([0, 0, 0, 16, 0, 0, 0, 16, 8, 2, 0, 0, 0])
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function createTray() {
  const icon = nativeImage.createFromBuffer(createTrayIconPNG())
  tray = new Tray(icon)
  tray.setToolTip('Interview Copilot — Click to show/hide')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Window', click: () => { mainWindow.show(); mainWindow.focus() } },
      { type: 'separator' },
      { label: 'Quit', click: () => { forceQuit = true; app.quit() } },
    ])
  )
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 400,
    height: 660,
    x: width - 420,
    y: 40,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    skipTaskbar: false,
    opacity: settings.opacity != null ? settings.opacity : 0.95,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!forceQuit) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media')
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  mainWindow.webContents.once('did-finish-load', () => {
    globalShortcut.register('CommandOrControl+Shift+L', () => {
      mainWindow.webContents.send('hotkey', 'toggle-listen')
    })
    globalShortcut.register('CommandOrControl+Shift+S', () => {
      mainWindow.webContents.send('hotkey', 'send-claude')
    })
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      mainWindow.webContents.send('hotkey', 'copy-answer')
    })
    globalShortcut.register('CommandOrControl+Shift+X', () => {
      mainWindow.webContents.send('hotkey', 'clear')
    })
    globalShortcut.register('CommandOrControl+Shift+O', () => {
      mainWindow.webContents.send('hotkey', 'opacity-cycle')
    })
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      mainWindow.webContents.send('hotkey', 'stealth-toggle')
    })
  })

  createTray()
}

app.whenReady().then(createWindow)

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Window controls
ipcMain.handle('minimize-window', () => mainWindow.minimize())
ipcMain.handle('close-window',    () => mainWindow.hide())   // hides to tray
ipcMain.handle('quit-app',        () => { forceQuit = true; app.quit() })

// Opacity
ipcMain.handle('set-opacity', (event, value) => {
  mainWindow.setOpacity(value)
  return true
})

// Settings
ipcMain.handle('get-settings', () => settings)

ipcMain.handle('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings }
  saveSettings(settings)
  return { success: true }
})

// Claude streaming
ipcMain.handle('ask-claude', async (event, { question, jobRole, jobDescription }) => {
  if (!settings.apiKey) {
    mainWindow.webContents.send('claude-error', 'API key not set. Click ⚙ to add your Anthropic API key.')
    return
  }

  const client = new Anthropic({ apiKey: settings.apiKey })

  const systemPrompt = `You are an expert interview coach helping a candidate during a live job interview.
${jobRole ? `The candidate is interviewing for: ${jobRole}` : ''}
${jobDescription ? `Job context: ${jobDescription}` : ''}

Rules:
- Answer in first person as if the candidate is speaking
- For behavioral questions (tell me about a time, describe a situation), use STAR method briefly
- For technical questions, give a precise expert-level answer
- For coding problems, provide clean code with brief explanation
- Keep answers concise (under 200 words) unless it is a coding problem
- Be confident and professional
- Do not mention you are an AI`

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    })

    stream.on('text', (text) => {
      mainWindow.webContents.send('claude-chunk', text)
    })

    stream.on('finalMessage', () => {
      mainWindow.webContents.send('claude-done')
    })

    stream.on('error', (error) => {
      mainWindow.webContents.send('claude-error', error.message)
    })
  } catch (error) {
    mainWindow.webContents.send('claude-error', error.message)
  }
})
