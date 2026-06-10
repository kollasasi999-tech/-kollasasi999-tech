const { app, BrowserWindow, ipcMain, screen, session, globalShortcut, Tray, nativeImage, Menu, dialog, desktopCapturer } = require('electron')
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
    globalShortcut.register('CommandOrControl+Shift+P', () => {
      mainWindow.webContents.send('hotkey', 'capture-screen')
    })
    globalShortcut.register('CommandOrControl+Shift+M', () => {
      mainWindow.webContents.send('hotkey', 'slim-toggle')
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

// Slim overlay mode
ipcMain.handle('set-slim-mode', (event, isSlim) => {
  if (isSlim) {
    mainWindow.setSize(400, 180)
  } else {
    mainWindow.setSize(400, 660)
  }
  return true
})

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

// Mock interview — multi-turn conversation
ipcMain.handle('mock-interview-turn', async (event, { messages, systemPrompt }) => {
  if (!settings.apiKey) {
    mainWindow.webContents.send('mock-error', 'API key not set.')
    return
  }
  const client = new Anthropic({ apiKey: settings.apiKey })
  try {
    // Inject STAR scoring format reminder into system prompt if not already present
    const enhancedSystem = systemPrompt.includes('STAR:') ? systemPrompt
      : systemPrompt + '\nWhen evaluating answers always include STAR: S:[1-10] T:[1-10] A:[1-10] R:[1-10] on its own line between FEEDBACK and SCORE.'

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: enhancedSystem,
      messages,
    })
    stream.on('text',         (t) => mainWindow.webContents.send('mock-chunk', t))
    stream.on('finalMessage', ()  => mainWindow.webContents.send('mock-done'))
    stream.on('error',        (e) => mainWindow.webContents.send('mock-error', e.message))
  } catch (e) {
    mainWindow.webContents.send('mock-error', e.message)
  }
})

// Screen capture for coding interviews
ipcMain.handle('capture-screen', async () => {
  try {
    // Hide window so it doesn't appear in the screenshot
    mainWindow.hide()
    await new Promise(r => setTimeout(r, 300))

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1440, height: 900 },
    })

    mainWindow.show()
    mainWindow.focus()

    if (!sources.length) return { error: 'No screen found' }

    const jpeg   = sources[0].thumbnail.toJPEG(85)
    const base64 = jpeg.toString('base64')
    return { base64, dataURL: `data:image/jpeg;base64,${base64}`, success: true }
  } catch (e) {
    mainWindow.show()
    return { error: e.message }
  }
})

// Ask Claude with a screenshot (coding mode)
ipcMain.handle('ask-claude-coding', async (event, { base64, question }) => {
  if (!settings.apiKey) {
    mainWindow.webContents.send('claude-error', 'API key not set.')
    return
  }

  const client = new Anthropic({ apiKey: settings.apiKey })

  const systemPrompt = `You are an expert software engineer helping solve a live coding interview problem.
Analyze the coding problem shown in the screenshot and provide:
1. Brief problem summary
2. Optimal approach with time and space complexity
3. Clean, working solution in the most appropriate language
4. Key steps explained

Always wrap code in triple backticks with the language name (e.g. \`\`\`python).`

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text',  text: question || 'Analyze this coding problem and provide a complete solution.' },
        ],
      }],
    })

    stream.on('text',         (text)  => mainWindow.webContents.send('claude-chunk', text))
    stream.on('finalMessage', ()      => mainWindow.webContents.send('claude-done'))
    stream.on('error',        (error) => mainWindow.webContents.send('claude-error', error.message))
  } catch (e) {
    mainWindow.webContents.send('claude-error', e.message)
  }
})

// Resume file picker + PDF parser
ipcMain.handle('select-resume-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Documents', extensions: ['pdf', 'txt'] }],
  })
  if (result.canceled || !result.filePaths.length) return null

  const filePath = result.filePaths[0]
  const ext = path.extname(filePath).toLowerCase()
  const name = path.basename(filePath)

  try {
    if (ext === '.txt') {
      const text = fs.readFileSync(filePath, 'utf-8').slice(0, 8000)
      return { name, text, success: true }
    }
    if (ext === '.pdf') {
      // pdf-parse is an optional dep; give a friendly error if not installed yet
      let pdfParse
      try { pdfParse = require('pdf-parse') } catch {
        return { error: 'Run  npm install  inside the interview-copilot folder first, then restart.' }
      }
      const data = await pdfParse(fs.readFileSync(filePath))
      return { name, text: data.text.slice(0, 8000), success: true }
    }
    return { error: 'Only PDF and TXT files are supported.' }
  } catch (e) {
    return { error: e.message }
  }
})

// Export session notes to markdown file
ipcMain.handle('export-notes', async (event, { content, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'interview-notes.md',
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Text File', extensions: ['txt'] },
    ],
  })
  if (result.canceled || !result.filePath) return { canceled: true }

  try {
    fs.writeFileSync(result.filePath, content, 'utf-8')
    return { success: true, filePath: result.filePath }
  } catch (e) {
    return { error: e.message }
  }
})

// Job URL scraper — fetches HTML, strips tags, returns raw text
function fetchUrl(url, redirectsLeft = 4) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http')
    const req = mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
        return fetchUrl(res.headers.location, redirectsLeft - 1).then(resolve).catch(reject)
      }
      let body = ''
      res.on('data', c => { body += c })
      res.on('end', () => resolve(body))
    })
    req.on('error', reject)
    req.setTimeout(9000, () => { req.destroy(); reject(new Error('Request timed out')) })
  })
}

ipcMain.handle('fetch-job-url', async (event, url) => {
  try {
    const html = await fetchUrl(url)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000)
    return { text, success: true }
  } catch (e) {
    return { error: e.message, success: false }
  }
})

// Mine STAR stories from uploaded resume
ipcMain.handle('mine-resume-stories', async (event, { resumeText }) => {
  if (!settings.apiKey) return { error: 'API key not set' }
  const client = new Anthropic({ apiKey: settings.apiKey })
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      messages: [{
        role: 'user',
        content: `Analyze this resume and extract 5-8 of the strongest career stories that would make compelling STAR-format behavioral interview answers.

For each story use EXACTLY this format (separate stories with ---):
TITLE: [5-8 word title for this story]
S: [One sentence: the situation or challenge]
A: [One to two sentences: the specific actions taken]
R: [One sentence: the measurable result or impact]
---

Resume:
${resumeText}

Output ONLY the stories in that format. No intro text, no conclusion, no numbering.`,
      }],
    })
    return { text: msg.content[0].text, success: true }
  } catch (e) {
    return { error: e.message }
  }
})

// Behavioral spike drill — generate one tough follow-up probe question
ipcMain.handle('get-spike', async (event, { question, answer }) => {
  if (!settings.apiKey) return { error: 'API key not set' }
  const client = new Anthropic({ apiKey: settings.apiKey })
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `You are a tough interviewer. Based on this Q&A, generate ONE sharp follow-up question that probes for specifics, challenges a vague claim, or pushes the candidate to give a harder example. Output ONLY the follow-up question — no preamble, no explanation.\n\nQ: ${question}\nA: ${answer}`,
      }],
    })
    return { text: msg.content[0].text.trim(), success: true }
  } catch (e) {
    return { error: e.message }
  }
})

// Generate a tailored question bank from the job description
ipcMain.handle('generate-questions', async (event, { jobDescription, jobRole }) => {
  if (!settings.apiKey) return { error: 'API key not set' }
  const client = new Anthropic({ apiKey: settings.apiKey })
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `Generate exactly 15 likely interview questions for this position. Include 5 behavioral (Tell me about a time...), 6 technical/role-specific, and 4 situational (What would you do if...) questions. Make them specific to the job description — not generic templates.

Job Role: ${jobRole || 'Not specified'}
Job Description:
${jobDescription}

Output ONLY the 15 questions, one per line. No numbering, no category labels, no extra text.`,
      }],
    })
    return { text: msg.content[0].text, success: true }
  } catch (e) {
    return { error: e.message }
  }
})

// Follow-up question suggestions (non-streaming, fast Haiku call)
ipcMain.handle('get-followups', async (event, { question, answer }) => {
  if (!settings.apiKey) return { error: 'API key not set' }
  const client = new Anthropic({ apiKey: settings.apiKey })
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Interview question: ${question}\n\nAnswer: ${answer}\n\nSuggest exactly 3 brief follow-up questions an interviewer would likely ask next. Output only the 3 questions, one per line, no numbering or bullets or extra text.`,
      }],
    })
    return { text: msg.content[0].text, success: true }
  } catch (e) {
    return { error: e.message }
  }
})

// Claude streaming
ipcMain.handle('ask-claude', async (event, { question, jobRole, jobDescription, resumeText, answerMode, storyContext }) => {
  if (!settings.apiKey) {
    mainWindow.webContents.send('claude-error', 'API key not set. Click ⚙ to add your Anthropic API key.')
    return
  }

  const client = new Anthropic({ apiKey: settings.apiKey })

  let lengthRule
  if (answerMode === 'detailed') lengthRule = 'Provide thorough answers (300-400 words) with specific examples and context'
  else if (answerMode === 'bullets') lengthRule = 'Structure your answer as 4-6 concise bullet points; start each with a strong action word'
  else lengthRule = 'Keep answers concise (under 200 words) unless it is a coding problem'

  const systemPrompt = `You are an expert interview coach helping a candidate during a live job interview.
${jobRole ? `Role being interviewed for: ${jobRole}` : ''}
${jobDescription ? `Job description / company context:\n${jobDescription}` : ''}
${resumeText ? `\nCandidate resume / background:\n${resumeText}` : ''}
${storyContext ? `\nKey story from candidate's experience to weave into the answer:\n${storyContext}` : ''}

Rules:
- Answer in first person as if the candidate is speaking
- Use specific experiences from the resume when relevant — make answers personal, not generic
- For behavioral questions use STAR method (Situation, Task, Action, Result) drawing from the resume
- For technical questions give a precise expert-level answer
- For coding problems provide clean code with a brief explanation; wrap code in triple backticks with the language name
- ${lengthRule}
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
