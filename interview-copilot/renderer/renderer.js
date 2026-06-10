/* ── DOM refs ── */
const statusDot        = document.getElementById('statusDot')
const statusText       = document.getElementById('statusText')
const waves            = document.getElementById('waves')
const btnListen        = document.getElementById('btnListen')
const btnListenTxt     = document.getElementById('btnListenText')
const micIcon          = document.getElementById('micIcon')
const btnClear         = document.getElementById('btnClear')
const btnSettings      = document.getElementById('btnSettings')
const btnSave          = document.getElementById('btnSaveSettings')
const btnAsk           = document.getElementById('btnAsk')
const btnCopy          = document.getElementById('btnCopy')
const btnMinimize      = document.getElementById('btnMinimize')
const btnClose         = document.getElementById('btnClose')
const settingsPanel    = document.getElementById('settingsPanel')
const transcriptBox    = document.getElementById('transcriptBox')
const answerBox        = document.getElementById('answerBox')
const apiKeyInput      = document.getElementById('apiKeyInput')
const jobRoleInput     = document.getElementById('jobRoleInput')
const jobDescInput     = document.getElementById('jobDescInput')
const jobUrlInput      = document.getElementById('jobUrlInput')
const btnFetchUrl      = document.getElementById('btnFetchUrl')
const fetchStatus      = document.getElementById('fetchStatus')
const btnUploadResume  = document.getElementById('btnUploadResume')
const resumeName       = document.getElementById('resumeName')
const silenceTimerSlider = document.getElementById('silenceTimerSlider')
const silenceTimerValue  = document.getElementById('silenceTimerValue')
const langSelect       = document.getElementById('langSelect')
const btnTheme         = document.getElementById('btnTheme')
const opacitySlider    = document.getElementById('opacitySlider')
const opacityValue     = document.getElementById('opacityValue')
const btnQuit          = document.getElementById('btnQuit')
const btnHistory       = document.getElementById('btnHistory')
const btnMockOpen      = document.getElementById('btnMockOpen')
const mockPanel        = document.getElementById('mockPanel')
const mockSetup        = document.getElementById('mockSetup')
const mockInterview    = document.getElementById('mockInterview')
const mockResults      = document.getElementById('mockResults')
const mockRole         = document.getElementById('mockRole')
const mockType         = document.getElementById('mockType')
const mockDifficulty   = document.getElementById('mockDifficulty')
const mockCount        = document.getElementById('mockCount')
const mockTTS          = document.getElementById('mockTTS')
const btnMockStart     = document.getElementById('btnMockStart')
const btnMockClose     = document.getElementById('btnMockClose')
const btnMockEnd       = document.getElementById('btnMockEnd')
const btnMockMic       = document.getElementById('btnMockMic')
const btnMockSubmit    = document.getElementById('btnMockSubmit')
const btnMockRestart   = document.getElementById('btnMockRestart')
const btnMockDone      = document.getElementById('btnMockDone')
const mockQNum         = document.getElementById('mockQNum')
const mockQuestionBox  = document.getElementById('mockQuestionBox')
const mockAnswerBox    = document.getElementById('mockAnswerBox')
const mockFeedbackBox  = document.getElementById('mockFeedbackBox')
const mockProgressFill = document.getElementById('mockProgressFill')
const mockScoreNum     = document.getElementById('mockScoreNum')
const mockResultsList  = document.getElementById('mockResultsList')
const btnCodeMode      = document.getElementById('btnCodeMode')
const btnExport        = document.getElementById('btnExport')
const btnMode          = document.getElementById('btnMode')
const listenTimer      = document.getElementById('listenTimer')
const deliveryStats    = document.getElementById('deliveryStats')
const followupRow      = document.getElementById('followupRow')
const followupChips    = document.getElementById('followupChips')
const btnGenQuestions  = document.getElementById('btnGenQuestions')
const btnQBank         = document.getElementById('btnQBank')
const btnQBankBack     = document.getElementById('btnQBankBack')
const qbankPanel       = document.getElementById('qbankPanel')
const qbankList        = document.getElementById('qbankList')
const qbankMeta        = document.getElementById('qbankMeta')
const btnMineStories   = document.getElementById('btnMineStories')
const btnStories       = document.getElementById('btnStories')
const btnStoryBack     = document.getElementById('btnStoryBack')
const storyPanel       = document.getElementById('storyPanel')
const storyList        = document.getElementById('storyList')
const storyMeta        = document.getElementById('storyMeta')
const activeStoryChip  = document.getElementById('activeStoryChip')
const activeStoryLabel = document.getElementById('activeStoryLabel')
const btnClearStory    = document.getElementById('btnClearStory')
const btnSpike         = document.getElementById('btnSpike')
const btnSlim          = document.getElementById('btnSlim')
const codingPanel      = document.getElementById('codingPanel')
const btnCapture       = document.getElementById('btnCapture')
const capturePreview   = document.getElementById('capturePreview')
const captureImg       = document.getElementById('captureImg')
const captureNote      = document.getElementById('captureNote')
const btnAnalyze       = document.getElementById('btnAnalyze')
const historyPanel     = document.getElementById('historyPanel')
const historyList      = document.getElementById('historyList')
const btnHistoryBack   = document.getElementById('btnHistoryBack')
const stealthBadge     = document.getElementById('stealthBadge')
const toast            = document.getElementById('toast')

/* ── State ── */
let isListening        = false
let isProcessing       = false
let recognition        = null
let silenceTimer       = null
let settingsOpen       = false
let finalText          = ''
let isDark             = true
let isStealthy         = false
let preStealthOpacity  = 0.95
let currentQuestion    = ''
let rawAnswerBuffer    = ''
let toastTimer         = null
let silenceDelay       = 2500
let resumeText         = ''
let codingModeOpen     = false
let capturedBase64     = null

const sessionHistory   = []
const opacityCycle     = [1.0, 0.8, 0.6, 0.4]
let opacityCycleIdx    = 0

const answerModes = [
  { key: 'concise',  label: '💬 Brief'   },
  { key: 'detailed', label: '📝 Detailed' },
  { key: 'bullets',  label: '• Bullets'  },
]
let answerModeIdx  = 0
let listenStart    = null
let timerInterval  = null

// Delivery coaching state
let fillerCounts   = {}   // { um: 3, uh: 1 }
let totalFillers   = 0
let lastWPM        = 0

// Question bank
let questionBank   = []
const FILLER_RE    = /\b(um+|uh+|hmm+|er+)\b/gi

// Story bank
let storyBank      = []   // [{ title, s, a, r }]
let activeStoryCtx = null // currently selected story text

// Slim overlay mode
let isSlimMode     = false

/* ── Init ── */
window.addEventListener('DOMContentLoaded', async () => {
  const saved = await window.electronAPI.getSettings()

  if (saved.apiKey)       apiKeyInput.value    = saved.apiKey
  if (saved.jobRole)      jobRoleInput.value   = saved.jobRole
  if (saved.jobDesc)      jobDescInput.value   = saved.jobDesc
  if (saved.language)     langSelect.value     = saved.language
  if (saved.resumeName)   resumeName.textContent = saved.resumeName
  if (saved.resumeText) {
    resumeText = saved.resumeText
    btnMineStories.style.display = 'block'
  }
  if (saved.sessionHistory && Array.isArray(saved.sessionHistory)) {
    sessionHistory.push(...saved.sessionHistory)
    btnHistory.textContent = `History (${sessionHistory.length})`
  }
  if (saved.silenceDelay) {
    silenceDelay = saved.silenceDelay
    silenceTimerSlider.value = silenceDelay / 1000
    silenceTimerValue.textContent = (silenceDelay / 1000) + 's'
  }

  if (saved.opacity != null) {
    const pct = Math.round(saved.opacity * 100)
    opacitySlider.value = pct
    opacityValue.textContent = pct + '%'
    preStealthOpacity = saved.opacity
    opacityCycleIdx = opacityCycle.reduce((best, v, i) =>
      Math.abs(v - saved.opacity) < Math.abs(opacityCycle[best] - saved.opacity) ? i : best, 0)
  }

  if (saved.theme === 'light') {
    isDark = false
    document.querySelector('.app').classList.add('light')
    btnTheme.textContent = '🌙'
    btnTheme.title = 'Switch to dark mode'
  }

  window.electronAPI.onClaudeChunk(handleChunk)
  window.electronAPI.onClaudeDone(handleDone)
  window.electronAPI.onClaudeError(handleError)

  window.electronAPI.onHotkey((action) => {
    switch (action) {
      case 'toggle-listen':  isListening ? stopListening() : startListening(); break
      case 'send-claude': {
        const txt = transcriptBox.innerText.trim()
        if (txt && !txt.includes('Start listening')) sendToClaude(txt)
        break
      }
      case 'copy-answer': {
        const ans = answerBox.innerText
        if (ans && !ans.includes('Answer will stream')) {
          navigator.clipboard.writeText(ans).then(() => {
            btnCopy.textContent = '✓ Copied!'
            setTimeout(() => { btnCopy.textContent = '📋 Copy' }, 2000)
            showToast('Answer copied!')
          })
        }
        break
      }
      case 'clear':          btnClear.click(); break
      case 'opacity-cycle':  cycleOpacity(); break
      case 'stealth-toggle': toggleStealth(); break
      case 'capture-screen': doCapture(); break
      case 'slim-toggle':    toggleSlimMode(); break
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (settingsOpen) { settingsOpen = false; settingsPanel.classList.remove('open') }
      if (historyPanel.classList.contains('open')) hideHistoryPanel()
    }
  })
})

/* ── Claude response handlers ── */
function handleChunk(chunk) {
  rawAnswerBuffer += chunk
  if (answerBox.querySelector('.hint')) answerBox.innerHTML = ''
  const cursor = answerBox.querySelector('.cursor')
  // Streaming preview: escape HTML and show plain text with cursor
  const preview = escapeHtml(rawAnswerBuffer).replace(/\n/g, '<br>')
  answerBox.innerHTML = preview
  const cur = document.createElement('span')
  cur.className = 'cursor'
  answerBox.appendChild(cur)
  answerBox.scrollTop = answerBox.scrollHeight
}

function handleDone() {
  if (rawAnswerBuffer) {
    answerBox.innerHTML = renderAnswer(rawAnswerBuffer)
  }
  rawAnswerBuffer = ''
  isProcessing = false

  const answer = answerBox.innerText.trim()
  if (currentQuestion && answer) {
    addToHistory(currentQuestion, answer)
    triggerFollowups(currentQuestion, answer)
  }

  setStatus(isListening ? 'listening' : 'ready',
            isListening ? 'Listening...' : 'Ready — click Start to listen')
}

function handleError(err) {
  rawAnswerBuffer = ''
  isProcessing = false
  answerBox.innerHTML = `<span style="color:#f04444">⚠ ${escapeHtml(err)}</span>`
  setStatus('error', 'Error — check Settings')
}

/* ── Answer renderer with code block support ── */
function renderAnswer(raw) {
  const parts = raw.split(/(```(?:\w+)?[\s\S]*?```)/g)
  return parts.map(part => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/)
      if (match) {
        const lang = match[1] || 'code'
        const code = escapeHtml(match[2].trim())
        return `<div class="code-block"><span class="code-lang">${lang}</span><pre><code>${code}</code></pre></div>`
      }
    }
    return escapeHtml(part).replace(/\n/g, '<br>')
  }).join('')
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ── Titlebar ── */
btnMinimize.addEventListener('click', () => window.electronAPI.minimize())
btnClose.addEventListener('click',    () => window.electronAPI.close())

btnTheme.addEventListener('click', () => {
  isDark = !isDark
  document.querySelector('.app').classList.toggle('light', !isDark)
  btnTheme.textContent = isDark ? '☀' : '🌙'
  btnTheme.title = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  window.electronAPI.saveSettings({ theme: isDark ? 'dark' : 'light' })
  showToast(isDark ? 'Dark mode' : 'Light mode')
})

btnQuit.addEventListener('click', () => window.electronAPI.quitApp())

/* ── Answer Mode Cycle ── */
btnMode.addEventListener('click', () => {
  answerModeIdx = (answerModeIdx + 1) % answerModes.length
  btnMode.textContent = answerModes[answerModeIdx].label
  showToast(`Mode: ${answerModes[answerModeIdx].label}`)
})

/* ── Settings ── */
btnSettings.addEventListener('click', () => {
  settingsOpen = !settingsOpen
  settingsPanel.classList.toggle('open', settingsOpen)
})

btnSave.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim()
  if (!key) { alert('Please enter your Anthropic API key.'); return }
  const opacity = parseInt(opacitySlider.value) / 100
  silenceDelay = parseFloat(silenceTimerSlider.value) * 1000
  await window.electronAPI.saveSettings({
    apiKey:       key,
    jobRole:      jobRoleInput.value.trim(),
    jobDesc:      jobDescInput.value.trim(),
    language:     langSelect.value,
    opacity,
    theme:        isDark ? 'dark' : 'light',
    silenceDelay,
    resumeText,
    resumeName:   resumeName.textContent,
  })
  settingsOpen = false
  settingsPanel.classList.remove('open')
  setStatus('ready', 'Settings saved ✓')
})

/* ── Resume upload ── */
btnUploadResume.addEventListener('click', async () => {
  btnUploadResume.textContent = 'Loading...'
  const result = await window.electronAPI.selectResumeFile()
  btnUploadResume.textContent = 'Upload PDF/TXT'

  if (!result) return  // cancelled
  if (result.error) { showToast('⚠ ' + result.error); return }

  resumeText = result.text
  resumeName.textContent = result.name
  btnMineStories.style.display = 'block'
  showToast('Resume loaded: ' + result.name)
})

/* ── Job URL fetch ── */
btnFetchUrl.addEventListener('click', async () => {
  const url = jobUrlInput.value.trim()
  if (!url) { showToast('Paste a job posting URL first'); return }

  btnFetchUrl.textContent = '...'
  fetchStatus.textContent = 'Fetching...'
  fetchStatus.style.color = 'var(--text2)'

  const result = await window.electronAPI.fetchJobUrl(url)
  btnFetchUrl.textContent = 'Fetch'

  if (!result.success) {
    fetchStatus.textContent = '⚠ ' + (result.error || 'Failed to fetch')
    fetchStatus.style.color = 'var(--red)'
    return
  }

  jobDescInput.value = result.text
  fetchStatus.textContent = '✓ Extracted — review and edit above'
  fetchStatus.style.color = 'var(--green)'
  showToast('Job posting fetched!')
})

/* ── Sliders (real-time) ── */
opacitySlider.addEventListener('input', () => {
  const pct = parseInt(opacitySlider.value)
  opacityValue.textContent = pct + '%'
  window.electronAPI.setOpacity(pct / 100)
  if (!isStealthy) preStealthOpacity = pct / 100
})

silenceTimerSlider.addEventListener('input', () => {
  const val = parseFloat(silenceTimerSlider.value)
  silenceDelay = val * 1000
  silenceTimerValue.textContent = val + 's'
})

/* ── Listen toggle ── */
btnListen.addEventListener('click', () => {
  isListening ? stopListening() : startListening()
})

/* ── Clear ── */
btnClear.addEventListener('click', () => {
  finalText = ''
  currentQuestion = ''
  rawAnswerBuffer = ''
  transcriptBox.innerHTML = '<span class="hint">Start listening — questions will appear here automatically...</span>'
  answerBox.innerHTML     = '<span class="hint">Answer will stream here in real-time...</span>'
  clearTimeout(silenceTimer)
  clearFollowups()
})

/* ── Manual ask ── */
btnAsk.addEventListener('click', () => {
  const txt = transcriptBox.innerText.trim()
  if (txt && !txt.includes('Start listening')) sendToClaude(txt)
})

/* ── Copy ── */
btnCopy.addEventListener('click', () => {
  const txt = answerBox.innerText
  if (txt && !txt.includes('Answer will stream')) {
    navigator.clipboard.writeText(txt).then(() => {
      btnCopy.textContent = '✓ Copied!'
      setTimeout(() => { btnCopy.textContent = '📋 Copy' }, 2000)
    })
  }
})

/* ── History ── */
btnHistory.addEventListener('click', showHistoryPanel)
btnHistoryBack.addEventListener('click', hideHistoryPanel)

function showHistoryPanel() {
  renderHistory()
  historyPanel.classList.add('open')
}

function hideHistoryPanel() {
  historyPanel.classList.remove('open')
}

function addToHistory(question, answer) {
  sessionHistory.unshift({
    question,
    answer,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })
  if (sessionHistory.length > 30) sessionHistory.pop()
  btnHistory.textContent = `History (${sessionHistory.length})`
  // Persist last 20 entries across sessions
  window.electronAPI.saveSettings({ sessionHistory: sessionHistory.slice(0, 20) })
}

function renderHistory() {
  if (sessionHistory.length === 0) {
    historyList.innerHTML = '<span class="hint" style="padding:12px;display:block">No history yet.</span>'
    return
  }
  historyList.innerHTML = sessionHistory.map((item, i) => `
    <div class="history-item" data-index="${i}">
      <div class="history-meta">${item.time}</div>
      <div class="history-q">${escapeHtml(item.question.slice(0, 90))}${item.question.length > 90 ? '…' : ''}</div>
      <div class="history-a">${escapeHtml(item.answer.slice(0, 110))}${item.answer.length > 110 ? '…' : ''}</div>
    </div>
  `).join('')

  historyList.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', () => {
      const item = sessionHistory[parseInt(el.dataset.index)]
      transcriptBox.textContent = item.question
      answerBox.innerHTML = renderAnswer(item.answer)
      hideHistoryPanel()
    })
  })
}

/* ── Coding Mode ── */
btnCodeMode.addEventListener('click', () => {
  codingModeOpen = !codingModeOpen
  codingPanel.classList.toggle('open', codingModeOpen)
  btnCodeMode.classList.toggle('active', codingModeOpen)
  showToast(codingModeOpen ? 'Coding mode on — capture your screen' : 'Coding mode off')
})

btnCapture.addEventListener('click', doCapture)

async function doCapture() {
  if (!codingModeOpen) {
    // Auto-open coding panel when hotkey used
    codingModeOpen = true
    codingPanel.classList.add('open')
    btnCodeMode.classList.add('active')
  }
  btnCapture.textContent = 'Capturing...'
  const result = await window.electronAPI.captureScreen()
  btnCapture.textContent = 'Capture Screen'

  if (!result || result.error) {
    showToast('⚠ ' + (result?.error || 'Capture failed'))
    return
  }

  capturedBase64 = result.base64
  captureImg.src = result.dataURL
  capturePreview.classList.add('show')
  captureNote.textContent = 'Screenshot captured — click Analyze'
  showToast('Screen captured! Press Analyze to solve.')
}

btnAnalyze.addEventListener('click', async () => {
  if (!capturedBase64) { showToast('Capture a screen first'); return }
  if (isProcessing) return

  const extraHint = transcriptBox.innerText.trim()
  const question  = !extraHint.includes('Start listening') ? extraHint : ''

  currentQuestion = 'Coding problem (screenshot)'
  rawAnswerBuffer = ''
  isProcessing    = true
  answerBox.innerHTML = '<span class="cursor"></span>'
  setStatus('processing', 'Solving coding problem...')

  await window.electronAPI.askClaudeCoding({ base64: capturedBase64, question })
})

/* ── Stealth mode ── */
function toggleStealth() {
  if (isStealthy) {
    isStealthy = false
    window.electronAPI.setOpacity(preStealthOpacity)
    stealthBadge.style.display = 'none'
    document.getElementById('appDot').style.background = ''
    showToast(`Stealth off — ${Math.round(preStealthOpacity * 100)}%`)
  } else {
    isStealthy = true
    preStealthOpacity = parseInt(opacitySlider.value) / 100
    window.electronAPI.setOpacity(0.15)
    stealthBadge.style.display = 'flex'
    document.getElementById('appDot').style.background = '#f59e0b'
    showToast('Stealth on — Ctrl+Shift+H to exit')
  }
}

/* ── Slim Overlay Mode ── */
btnSlim.addEventListener('click', toggleSlimMode)

function toggleSlimMode() {
  isSlimMode = !isSlimMode
  const app = document.querySelector('.app')
  app.classList.toggle('slim', isSlimMode)
  btnSlim.textContent = isSlimMode ? '⊞' : '▬'
  btnSlim.title       = isSlimMode ? 'Exit slim mode (⇧M)' : 'Slim overlay mode (⇧M)'
  // Close any open panels when entering slim mode
  if (isSlimMode) {
    if (settingsOpen) { settingsOpen = false; settingsPanel.classList.remove('open') }
    hideHistoryPanel()
    hideQBankPanel()
    hideStoryPanel()
  }
  window.electronAPI.setSlimMode(isSlimMode)
  showToast(isSlimMode ? 'Slim mode — answer only' : 'Full mode restored')
}

/* ── Opacity cycle ── */
function cycleOpacity() {
  if (isStealthy) return
  opacityCycleIdx = (opacityCycleIdx + 1) % opacityCycle.length
  const val = opacityCycle[opacityCycleIdx]
  window.electronAPI.setOpacity(val)
  preStealthOpacity = val
  opacitySlider.value = Math.round(val * 100)
  opacityValue.textContent = Math.round(val * 100) + '%'
  showToast(`Opacity: ${Math.round(val * 100)}%`)
}

/* ── Toast ── */
function showToast(msg, duration = 1800) {
  toast.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration)
}

/* ── Speech Recognition ── */
function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    alert('Speech recognition not supported. Please use a Chromium-based build.')
    return
  }

  recognition = new SR()
  recognition.continuous     = true
  recognition.interimResults = true
  recognition.lang           = langSelect.value || 'en-US'
  finalText                  = ''

  // Reset delivery stats
  fillerCounts = {}
  totalFillers = 0
  lastWPM      = 0

  recognition.onstart = () => {
    isListening = true
    btnListen.classList.add('active')
    btnListenTxt.textContent = 'Stop Listening'
    micIcon.textContent = '⏹'
    setStatus('listening', 'Listening...')
    waves.style.display = 'flex'
    // Start timer
    listenStart = Date.now()
    listenTimer.style.display   = 'inline'
    deliveryStats.style.display = 'inline'
    clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      const s = Math.floor((Date.now() - listenStart) / 1000)
      listenTimer.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    }, 1000)
  }

  recognition.onresult = (event) => {
    let interim  = ''
    let newFinal = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript
      if (event.results[i].isFinal) { finalText += t + ' '; newFinal += t + ' ' }
      else interim = t
    }

    // Count filler words from newly finalized text only
    if (newFinal) {
      const hits = newFinal.match(FILLER_RE) || []
      hits.forEach(h => {
        const key = h.replace(/(.)\1+/g, '$1').toLowerCase()  // "umm" → "um"
        fillerCounts[key] = (fillerCounts[key] || 0) + 1
        totalFillers++
      })
    }

    // WPM from total words ÷ elapsed minutes
    const words   = (finalText + interim).trim().split(/\s+/).filter(w => w)
    const elapsed = (Date.now() - listenStart) / 60000
    lastWPM = elapsed > 0.08 ? Math.round(words.length / elapsed) : 0
    updateDeliveryStats()

    const display = finalText + interim
    if (display.trim()) {
      transcriptBox.textContent = display
      transcriptBox.scrollTop   = transcriptBox.scrollHeight
    }

    clearTimeout(silenceTimer)
    if (finalText.trim().split(' ').length >= 4) {
      silenceTimer = setTimeout(() => {
        if (finalText.trim() && !isProcessing) {
          sendToClaude(finalText.trim())
          finalText = ''
        }
      }, silenceDelay)
    }
  }

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed') {
      setStatus('error', 'Microphone access denied')
      stopListening()
    }
  }

  recognition.onend = () => {
    if (isListening) setTimeout(() => { try { recognition.start() } catch (e) {} }, 150)
  }

  try { recognition.start() } catch (e) { console.error(e) }
}

function stopListening() {
  isListening = false
  clearTimeout(silenceTimer)
  clearInterval(timerInterval)
  listenTimer.style.display   = 'none'
  deliveryStats.style.display = 'none'
  if (recognition) { recognition.stop(); recognition = null }
  btnListen.classList.remove('active')
  btnListenTxt.textContent = 'Start Listening'
  micIcon.textContent = '🎤'
  waves.style.display = 'none'
  if (!isProcessing) setStatus('ready', 'Ready — click Start to listen')

  // Post-session delivery summary (only if significant speech happened)
  if (totalFillers > 0 || lastWPM > 0) {
    const parts = []
    if (lastWPM > 0) parts.push(`${lastWPM} wpm`)
    if (totalFillers > 0) {
      const top = Object.entries(fillerCounts).sort((a, b) => b[1] - a[1])
        .slice(0, 3).map(([w, c]) => `${w}×${c}`).join(' ')
      parts.push(`fillers: ${top}`)
    }
    showToast('Session — ' + parts.join(' · '), 3500)
  }
}

/* ── Claude call ── */
async function sendToClaude(question) {
  if (isProcessing || !question.trim()) return
  currentQuestion = question
  rawAnswerBuffer = ''
  isProcessing    = true
  answerBox.innerHTML = '<span class="cursor"></span>'
  clearFollowups()
  setStatus('processing', 'Generating answer...')
  waves.style.display = 'none'

  await window.electronAPI.askClaude({
    question,
    jobRole:        jobRoleInput.value.trim(),
    jobDescription: jobDescInput.value.trim(),
    resumeText,
    answerMode:     answerModes[answerModeIdx].key,
    storyContext:   activeStoryCtx,
  })
}

/* ── Follow-up Suggestions ── */
async function triggerFollowups(question, answer) {
  followupRow.style.display = 'flex'
  followupChips.innerHTML   = '<span class="followup-loading">Suggesting follow-ups...</span>'

  const result = await window.electronAPI.getFollowups({
    question,
    answer: answer.slice(0, 600),
  })

  if (!result || result.error || !result.text) {
    followupRow.style.display = 'none'
    return
  }

  const questions = result.text
    .split('\n')
    .map(q => q.replace(/^[\d\.\-\*]+\s*/, '').trim())
    .filter(q => q.length > 8)
    .slice(0, 3)

  if (!questions.length) { followupRow.style.display = 'none'; return }

  followupChips.innerHTML = ''
  questions.forEach(q => {
    const chip = document.createElement('button')
    chip.className   = 'followup-chip'
    chip.textContent = q
    chip.title       = q
    chip.addEventListener('click', () => {
      transcriptBox.textContent = q
      sendToClaude(q)
    })
    followupChips.appendChild(chip)
  })
}

function clearFollowups() {
  followupRow.style.display = 'none'
  followupChips.innerHTML   = ''
}

/* ── Delivery Stats (WPM + fillers) ── */
function updateDeliveryStats() {
  if (!isListening) return

  const wpmColor = lastWPM === 0 ? '' : lastWPM < 110 || lastWPM > 185 ? '#f59e0b' : '#22c55e'
  const wpmPart  = lastWPM > 0
    ? `<span style="color:${wpmColor};font-weight:700">${lastWPM}wpm</span>`
    : ''

  let fillerPart = ''
  if (totalFillers > 0) {
    const top = Object.entries(fillerCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 2)
      .map(([w, c]) => `${w}×${c}`).join(' ')
    const color = totalFillers > 5 ? '#f04444' : totalFillers > 2 ? '#f59e0b' : '#8888aa'
    fillerPart = `<span style="color:${color}">· ${top}</span>`
  }

  deliveryStats.innerHTML = [wpmPart, fillerPart].filter(Boolean).join(' ')
}

/* ── Story Bank ── */
btnMineStories.addEventListener('click', async () => {
  if (!resumeText) { showToast('Upload a resume first'); return }

  btnMineStories.textContent = '⏳ Mining stories...'
  btnMineStories.disabled    = true

  const result = await window.electronAPI.mineResumeStories({ resumeText })

  btnMineStories.textContent = '⚡ Mine Story Bank from Resume'
  btnMineStories.disabled    = false

  if (!result.success) { showToast('⚠ ' + (result.error || 'Failed')); return }

  storyBank = parseStories(result.text)
  showToast(`${storyBank.length} stories found!`)
  settingsOpen = false
  settingsPanel.classList.remove('open')
  showStoryPanel()
})

btnStories.addEventListener('click', () => {
  if (!storyBank.length) {
    showToast('Upload a resume and mine stories first (Settings)')
    return
  }
  showStoryPanel()
})

btnStoryBack.addEventListener('click', hideStoryPanel)

btnClearStory.addEventListener('click', () => {
  activeStoryCtx = null
  activeStoryChip.style.display = 'none'
  showToast('Story context cleared')
})

function parseStories(text) {
  return text.split(/---+/).map(block => {
    const titleM = block.match(/TITLE:\s*(.+)/i)
    const sM     = block.match(/S:\s*(.+)/i)
    const aM     = block.match(/A:\s*([\s\S]+?)(?=R:|$)/i)
    const rM     = block.match(/R:\s*(.+)/i)
    if (!titleM) return null
    return {
      title: titleM[1].trim(),
      s:     sM  ? sM[1].trim()  : '',
      a:     aM  ? aM[1].trim()  : '',
      r:     rM  ? rM[1].trim()  : '',
    }
  }).filter(Boolean)
}

function showStoryPanel() {
  renderStoryList()
  storyPanel.classList.add('open')
}

function hideStoryPanel() {
  storyPanel.classList.remove('open')
}

function renderStoryList() {
  storyMeta.textContent = `${storyBank.length} stories — click to use as answer context`
  storyList.innerHTML   = storyBank.map((story, i) => `
    <div class="qbank-item story-item" data-i="${i}">
      <span class="qbank-num">${i + 1}</span>
      <div class="story-content">
        <div class="story-title">${escapeHtml(story.title)}</div>
        <div class="story-preview">${escapeHtml(story.r)}</div>
      </div>
    </div>
  `).join('')

  storyList.querySelectorAll('.story-item').forEach(el => {
    el.addEventListener('click', () => {
      const story = storyBank[parseInt(el.dataset.i)]
      activeStoryCtx = `Title: ${story.title}\nSituation: ${story.s}\nAction: ${story.a}\nResult: ${story.r}`
      activeStoryLabel.textContent = `📖 ${story.title}`
      activeStoryChip.style.display = 'flex'
      hideStoryPanel()
      showToast(`Story set: ${story.title}`)
    })
  })
}

/* ── Behavioral Spike Drill ── */
btnSpike.addEventListener('click', async () => {
  const q = currentQuestion
  const a = answerBox.innerText.trim()
  if (!q || !a || a.includes('Answer will stream')) {
    showToast('Complete a Q&A first, then probe deeper')
    return
  }

  btnSpike.textContent = '⏳'
  const result = await window.electronAPI.getSpike({ question: q, answer: a })
  btnSpike.textContent = '🔍 Probe'

  if (!result.success) { showToast('⚠ ' + result.error); return }

  transcriptBox.textContent = result.text
  showToast('Probing deeper — asking Claude for guidance...')
  sendToClaude(result.text)
})

/* ── Question Bank ── */
btnGenQuestions.addEventListener('click', async () => {
  const jd   = jobDescInput.value.trim()
  const role = jobRoleInput.value.trim()
  if (!jd) { showToast('Paste a job description first'); return }

  btnGenQuestions.textContent = '⏳ Generating...'
  btnGenQuestions.disabled    = true

  const result = await window.electronAPI.generateQuestions({ jobDescription: jd, jobRole: role })

  btnGenQuestions.textContent = '🎯 Generate 15 Interview Questions'
  btnGenQuestions.disabled    = false

  if (!result.success) { showToast('⚠ ' + (result.error || 'Generation failed')); return }

  questionBank = result.text
    .split('\n')
    .map(q => q.replace(/^[\d\.\-\*]+\s*/, '').trim())
    .filter(q => q.length > 10)
    .slice(0, 15)

  showToast(`${questionBank.length} questions generated!`)

  // Auto-open the question bank panel
  settingsOpen = false
  settingsPanel.classList.remove('open')
  showQBankPanel()
})

btnQBank.addEventListener('click', () => {
  if (!questionBank.length) {
    showToast('Generate questions first — paste a JD in Settings')
    return
  }
  showQBankPanel()
})

btnQBankBack.addEventListener('click', hideQBankPanel)

function showQBankPanel() {
  renderQBankList()
  qbankPanel.classList.add('open')
}

function hideQBankPanel() {
  qbankPanel.classList.remove('open')
}

function renderQBankList() {
  const role = jobRoleInput.value.trim()
  qbankMeta.textContent = role ? `${questionBank.length} questions for: ${role}` : `${questionBank.length} questions`

  qbankList.innerHTML = questionBank.map((q, i) => `
    <div class="qbank-item" data-i="${i}">
      <span class="qbank-num">${i + 1}</span>
      <span class="qbank-text">${escapeHtml(q)}</span>
    </div>
  `).join('')

  qbankList.querySelectorAll('.qbank-item').forEach(el => {
    el.addEventListener('click', () => {
      const q = questionBank[parseInt(el.dataset.i)]
      transcriptBox.textContent = q
      hideQBankPanel()
      sendToClaude(q)
    })
  })
}

/* ── Export Session Notes ── */
btnExport.addEventListener('click', async () => {
  if (sessionHistory.length === 0) {
    showToast('No Q&As to export yet')
    return
  }

  const date    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const role    = jobRoleInput.value.trim()
  const header  = `# Interview Copilot — Session Notes\n**Date:** ${date}${role ? `\n**Role:** ${role}` : ''}\n\n---\n\n`

  const body = sessionHistory
    .slice()
    .reverse()
    .map((item, i) => `## Q${i + 1} · ${item.time}\n\n**Question:**\n${item.question}\n\n**Answer:**\n${item.answer}\n`)
    .join('\n---\n\n')

  const content     = header + body
  const dateStr     = new Date().toISOString().slice(0, 10)
  const defaultName = `interview-notes-${dateStr}.md`

  btnExport.textContent = '...'
  const result = await window.electronAPI.exportNotes({ content, defaultName })
  btnExport.textContent = '⬇ Notes'

  if (result.canceled) return
  if (result.error)    { showToast('⚠ Export failed: ' + result.error); return }

  showToast(`Saved: ${result.filePath.split('/').pop().split('\\').pop()}`)
})

/* ── Status helper ── */
function setStatus(state, text) {
  statusDot.className    = `status-dot ${state === 'ready' ? '' : state}`
  statusText.textContent = text
  if (state === 'listening') waves.style.display = 'flex'
  else if (state !== 'processing') waves.style.display = 'none'
}

/* ── Mock Interview ── */
let mockPhase    = 'idle'   // 'idle' | 'asking-q' | 'waiting-answer' | 'evaluating'
let mockMsgBuf   = ''
let mockQIdx     = 0        // 1-based index of the question currently displayed
let mockTotalQs  = 5
let mockCfg      = {}
let mockScores   = []
let mockQA       = []       // { question, answer, feedback, score }
let mockMsgs     = []       // multi-turn messages array for the API
let mockMicOn    = false
let mockMicRecog = null

/* Open / Close */
btnMockOpen.addEventListener('click', () => mockPanel.classList.add('open'))

function closeMockPanel() {
  mockPanel.classList.remove('open')
  stopMockMic()
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

btnMockClose.addEventListener('click', closeMockPanel)

btnMockDone.addEventListener('click', () => {
  closeMockPanel()
  setTimeout(() => {
    mockResults.style.display   = 'none'
    mockInterview.style.display = 'none'
    mockSetup.style.display     = 'block'
  }, 300)
})

btnMockRestart.addEventListener('click', () => {
  stopMockMic()
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  mockResults.style.display   = 'none'
  mockInterview.style.display = 'none'
  mockSetup.style.display     = 'block'
})

btnMockEnd.addEventListener('click', () => {
  stopMockMic()
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  showMockResults()
})

/* Start */
btnMockStart.addEventListener('click', async () => {
  const role       = mockRole.value.trim() || 'Software Engineer'
  const type       = mockType.value
  const difficulty = mockDifficulty.value
  const count      = parseInt(mockCount.value)
  const useTTS     = mockTTS.checked

  mockCfg    = { role, type, difficulty, count, useTTS }
  mockTotalQs = count
  mockQIdx   = 0
  mockScores = []
  mockQA     = []
  mockMsgs   = []
  mockMsgBuf = ''

  mockSetup.style.display     = 'none'
  mockInterview.style.display = 'flex'
  mockResults.style.display   = 'none'

  mockAnswerBox.textContent     = ''
  mockFeedbackBox.style.display = 'none'
  mockFeedbackBox.innerHTML     = ''
  mockQuestionBox.innerHTML     = '<span class="hint">Loading first question...</span>'
  updateMockMeta()

  window.electronAPI.removeListeners('mock-chunk')
  window.electronAPI.removeListeners('mock-done')
  window.electronAPI.removeListeners('mock-error')
  window.electronAPI.onMockChunk(handleMockChunk)
  window.electronAPI.onMockDone(handleMockDone)
  window.electronAPI.onMockError(handleMockError)

  mockPhase  = 'asking-q'
  mockMsgBuf = ''
  mockMsgs.push({ role: 'user', content: 'Please begin the mock interview. Ask me the first question.' })

  await window.electronAPI.mockInterviewTurn({
    messages:     mockMsgs,
    systemPrompt: buildMockSystemPrompt(),
  })
})

function buildMockSystemPrompt() {
  const { role, type, difficulty, count } = mockCfg
  return `You are a professional ${type} interviewer conducting a ${difficulty}-level mock interview for a ${role} position. You will ask exactly ${count} questions total.

Rules:
- On the first message: respond with ONLY the first question text, no preamble or numbering.
- After each candidate answer: respond in EXACTLY this format, no extra text:
FEEDBACK: [2-3 sentence honest and encouraging assessment]
SCORE: [integer 1 to 10]
NEXT: [text of the next question, or the word END if all ${count} questions are done]

Questions must be ${difficulty}-difficulty and relevant to the ${role} role.`
}

/* Streaming handlers */
function handleMockChunk(chunk) {
  mockMsgBuf += chunk
  if (mockPhase === 'asking-q') {
    mockQuestionBox.innerHTML = escapeHtml(mockMsgBuf).replace(/\n/g, '<br>') + '<span class="cursor"></span>'
  } else if (mockPhase === 'evaluating') {
    mockFeedbackBox.style.display = 'block'
    mockFeedbackBox.innerHTML = escapeHtml(mockMsgBuf).replace(/\n/g, '<br>') + '<span class="cursor"></span>'
    mockFeedbackBox.scrollTop = mockFeedbackBox.scrollHeight
  }
}

function handleMockDone() {
  if (mockPhase === 'asking-q') {
    const question = mockMsgBuf.trim()
    mockMsgBuf = ''
    mockQIdx++
    mockQA.push({ question, answer: '', feedback: '', score: 0 })
    mockMsgs.push({ role: 'assistant', content: question })

    mockQuestionBox.textContent = question
    updateMockMeta()
    if (mockCfg.useTTS) speakMockText(question)

    mockPhase = 'waiting-answer'
    mockAnswerBox.textContent = ''
    mockAnswerBox.focus()

  } else if (mockPhase === 'evaluating') {
    const { feedback, star, score, next } = parseMockFeedback(mockMsgBuf)

    const qa = mockQA[mockQA.length - 1]
    if (qa) { qa.feedback = feedback; qa.score = score; qa.star = star }
    mockScores.push(score)

    mockMsgs.push({ role: 'assistant', content: mockMsgBuf.trim() })
    mockMsgBuf = ''

    const starHtml = star ? `<div class="mock-star-row">${['S','T','A','R'].map(k =>
      `<div class="mock-star-bar">
        <span class="mock-star-label">${k}</span>
        <div class="mock-star-track"><div class="mock-star-fill" style="width:${star[k] * 10}%"></div></div>
        <span class="mock-star-val">${star[k]}</span>
      </div>`).join('')}</div>` : ''

    mockFeedbackBox.innerHTML = `<strong>Score: ${score}/10</strong><br>${escapeHtml(feedback).replace(/\n/g, '<br>')}${starHtml}`

    const isDone = next === 'END' || mockQIdx >= mockTotalQs
    setTimeout(() => {
      if (isDone) {
        showMockResults()
      } else {
        mockQIdx++
        mockQA.push({ question: next, answer: '', feedback: '', score: 0 })

        mockQuestionBox.textContent   = next
        mockFeedbackBox.style.display = 'none'
        updateMockMeta()
        if (mockCfg.useTTS) speakMockText(next)

        mockPhase = 'waiting-answer'
        mockAnswerBox.textContent = ''
        mockAnswerBox.focus()
      }
    }, isDone ? 2000 : 3000)
  }
}

function handleMockError(err) {
  mockPhase = 'waiting-answer'
  showToast('⚠ ' + (err || 'Mock interview error'))
  mockQuestionBox.innerHTML = '<span style="color:var(--red)">Error — check API key and try again.</span>'
}

/* Submit answer */
btnMockSubmit.addEventListener('click', submitMockAnswer)

async function submitMockAnswer() {
  if (mockPhase !== 'waiting-answer') return
  const answer = mockAnswerBox.innerText.trim()
  if (!answer) { showToast('Please speak or type your answer first'); return }

  const qa = mockQA[mockQA.length - 1]
  if (qa) qa.answer = answer

  mockMsgs.push({ role: 'user', content: answer })
  mockPhase  = 'evaluating'
  mockMsgBuf = ''
  mockFeedbackBox.style.display = 'block'
  mockFeedbackBox.innerHTML = '<span class="hint">Evaluating your answer...</span>'

  await window.electronAPI.mockInterviewTurn({
    messages:     mockMsgs,
    systemPrompt: buildMockSystemPrompt(),
  })
}

/* Mock mic */
btnMockMic.addEventListener('click', () => {
  if (mockPhase !== 'waiting-answer') return
  mockMicOn ? stopMockMic() : startMockMic()
})

function startMockMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { showToast('Speech not supported in this build'); return }

  mockMicRecog = new SR()
  mockMicRecog.continuous     = true
  mockMicRecog.interimResults = true
  mockMicRecog.lang           = langSelect.value || 'en-US'

  mockMicRecog.onstart = () => {
    mockMicOn = true
    btnMockMic.classList.add('active')
    btnMockMic.textContent = '⏹ Stop'
  }

  mockMicRecog.onresult = (event) => {
    let text = ''
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript + ' '
    }
    mockAnswerBox.textContent = text.trim()
  }

  mockMicRecog.onerror = () => stopMockMic()
  mockMicRecog.onend   = () => {
    if (mockMicOn) { try { mockMicRecog.start() } catch (e) {} }
  }

  try { mockMicRecog.start() } catch (e) { showToast('Mic error — check permissions') }
}

function stopMockMic() {
  mockMicOn = false
  if (mockMicRecog) { mockMicRecog.stop(); mockMicRecog = null }
  btnMockMic.classList.remove('active')
  btnMockMic.textContent = '🎤 Answer'
}

/* TTS */
function speakMockText(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate  = 0.9
  utt.pitch = 1
  window.speechSynthesis.speak(utt)
}

/* Parse Claude's feedback response */
function parseMockFeedback(text) {
  const fbMatch    = text.match(/FEEDBACK:\s*([\s\S]+?)(?=\nSTAR:|\nSCORE:|$)/i)
  const starMatch  = text.match(/STAR:\s*S:(\d+)\s+T:(\d+)\s+A:(\d+)\s+R:(\d+)/i)
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i)
  const nextMatch  = text.match(/NEXT:\s*([\s\S]+?)$/i)

  return {
    feedback: fbMatch    ? fbMatch[1].trim()                                                        : text.trim(),
    star:     starMatch  ? { S: +starMatch[1], T: +starMatch[2], A: +starMatch[3], R: +starMatch[4] } : null,
    score:    scoreMatch ? Math.min(10, Math.max(1, parseInt(scoreMatch[1])))                        : 5,
    next:     nextMatch  ? nextMatch[1].trim()                                                       : 'END',
  }
}

/* Meta / progress bar */
function updateMockMeta() {
  mockQNum.textContent         = `Q ${mockQIdx} / ${mockTotalQs}`
  mockProgressFill.style.width = `${(mockQIdx / mockTotalQs) * 100}%`
}

/* Results screen */
function showMockResults() {
  stopMockMic()
  mockInterview.style.display = 'none'
  mockResults.style.display   = 'flex'

  const avg = mockScores.length
    ? (mockScores.reduce((a, b) => a + b, 0) / mockScores.length).toFixed(1)
    : '--'

  mockScoreNum.textContent = avg

  mockResultsList.innerHTML = mockQA
    .filter(qa => qa.question)
    .map((qa, i) => `
      <div class="mock-result-item">
        <div class="mock-result-q">
          <span class="mock-result-num">Q${i + 1}</span>
          ${escapeHtml(qa.question)}
        </div>
        ${qa.feedback ? `<div class="mock-result-feedback">${escapeHtml(qa.feedback)}</div>` : ''}
        <div class="mock-result-bottom">
          ${qa.score ? `<div class="mock-result-score">Score: ${qa.score}/10</div>` : ''}
          ${qa.star  ? `<div class="mock-star-mini">${['S','T','A','R'].map(k =>
            `<span class="star-mini-badge">${k}:${qa.star[k]}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    `).join('')
}
