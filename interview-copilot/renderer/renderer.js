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

const sessionHistory   = []
const opacityCycle     = [1.0, 0.8, 0.6, 0.4]
let opacityCycleIdx    = 0

/* ── Init ── */
window.addEventListener('DOMContentLoaded', async () => {
  const saved = await window.electronAPI.getSettings()

  if (saved.apiKey)       apiKeyInput.value    = saved.apiKey
  if (saved.jobRole)      jobRoleInput.value   = saved.jobRole
  if (saved.jobDesc)      jobDescInput.value   = saved.jobDesc
  if (saved.language)     langSelect.value     = saved.language
  if (saved.resumeName)   resumeName.textContent = saved.resumeName
  if (saved.resumeText)   resumeText           = saved.resumeText
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
  // Final render with code block formatting
  if (rawAnswerBuffer) {
    answerBox.innerHTML = renderAnswer(rawAnswerBuffer)
  }
  rawAnswerBuffer = ''
  isProcessing = false

  const answer = answerBox.innerText.trim()
  if (currentQuestion && answer) addToHistory(currentQuestion, answer)

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
function showToast(msg) {
  toast.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800)
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

  recognition.onstart = () => {
    isListening = true
    btnListen.classList.add('active')
    btnListenTxt.textContent = 'Stop Listening'
    micIcon.textContent = '⏹'
    setStatus('listening', 'Listening...')
    waves.style.display = 'flex'
  }

  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript
      if (event.results[i].isFinal) finalText += t + ' '
      else interim = t
    }

    const display = finalText + interim
    if (display.trim()) {
      // Set as plain text (user can then edit in the contenteditable box)
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
  if (recognition) { recognition.stop(); recognition = null }
  btnListen.classList.remove('active')
  btnListenTxt.textContent = 'Start Listening'
  micIcon.textContent = '🎤'
  waves.style.display = 'none'
  if (!isProcessing) setStatus('ready', 'Ready — click Start to listen')
}

/* ── Claude call ── */
async function sendToClaude(question) {
  if (isProcessing || !question.trim()) return
  currentQuestion = question
  rawAnswerBuffer = ''
  isProcessing    = true
  answerBox.innerHTML = '<span class="cursor"></span>'
  setStatus('processing', 'Generating answer...')
  waves.style.display = 'none'

  await window.electronAPI.askClaude({
    question,
    jobRole:        jobRoleInput.value.trim(),
    jobDescription: jobDescInput.value.trim(),
    resumeText,
  })
}

/* ── Status helper ── */
function setStatus(state, text) {
  statusDot.className    = `status-dot ${state === 'ready' ? '' : state}`
  statusText.textContent = text
  if (state === 'listening') waves.style.display = 'flex'
  else if (state !== 'processing') waves.style.display = 'none'
}
