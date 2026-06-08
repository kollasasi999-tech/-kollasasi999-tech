const { app, BrowserWindow, ipcMain, screen, session, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs')
const Anthropic = require('@anthropic-ai/sdk')

let mainWindow
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media')
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  // Register global hotkeys after window is ready
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
  })
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
ipcMain.handle('close-window', () => app.quit())

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
    mainWindow.webContents.send('claude-error', 'API key not set. Click ⚙️ to add your Anthropic API key.')
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
- Keep answers concise (under 200 words) unless it's a coding problem
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
