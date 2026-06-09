/* ── DOM refs ── */
const statusDot     = document.getElementById('statusDot')
const statusText    = document.getElementById('statusText')
const waves         = document.getElementById('waves')
const btnListen     = document.getElementById('btnListen')
const btnListenTxt  = document.getElementById('btnListenText')
const micIcon       = document.getElementById('micIcon')
const btnClear      = document.getElementById('btnClear')
const btnSettings   = document.getElementById('btnSettings')
const btnSave       = document.getElementById('btnSaveSettings')
const btnAsk        = document.getElementById('btnAsk')
const btnCopy       = document.getElementById('btnCopy')
const btnMinimize   = document.getElementById('btnMinimize')
const btnClose      = document.getElementById('btnClose')
const settingsPanel = document.getElementById('settingsPanel')
const transcriptBox = document.getElementById('transcriptBox')
const answerBox     = document.getElementById('answerBox')
const apiKeyInput   = document.getElementById('apiKeyInput')
const jobRoleInput  = document.getElementById('jobRoleInput')
const jobDescInput  = document.getElementById('jobDescInput')
const langSelect    = document.getElementById('langSelect')
const btnTheme      = document.getElementById('btnTheme')
const opacitySlider = document.getElementById('opacitySlider')
const opacityValue  = document.getElementById('opacityValue')
const btnQuit       = document.getElementById('btnQuit')
const btnHistory    = document.getElementById('btnHistory')
const historyPanel  = document.getElementById('historyPanel')
const historyList   = document.getElementById('historyList')
const btnHistoryBack= document.getElementById('btnHistoryBack')
const stealthBadge  = document.getElementById('stealthBadge')
const toast         = document.getElementById('toast')

/* ── State ── */
let isListening       = false
let isProcessing      = false
let recognition       = null
let silenceTimer      = null
let settingsOpen      = false
let finalText         = ''
let isDark            = true
let isStealthy        = false
let preStealthOpacity = 0.95
let currentQuestion   = ''
let toastTimer        = null

const sessionHistory  = []
const opacityCycle    = [1.0, 0.8, 0.6, 0.4]
let opacityCycleIdx   = 0

/* ── Init ── */
window.addEventListener('DOMContentLoaded', async () => {
  const saved = await window.electronAPI.getSettings()
  if (saved.apiKey)   apiKeyInput.value  = saved.apiKey
  if (saved.jobRole)  jobRoleInput.value = saved.jobRole
  if (saved.jobDesc)  jobDescInput.value = saved.jobDesc
  if (saved.language) langSelect.value   = saved.language

  if (saved.opacity != null) {
    const pct = Math.round(saved.opacity * 100)
    opacitySlider.value = pct
    opacityValue.textContent = pct + '%'
    preStealthOpacity = saved.opacity
    // Sync cycle index to nearest value
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
      case 'toggle-listen':
        isListening ? stopListening() : startListening()
        break
      case 'send-claude': {
        const txt = transcriptBox.textContent.trim()
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
      case 'clear':
        btnClear.click()
        break
      case 'opacity-cycle':
        cycleOpacity()
        break
      case 'stealth-toggle':
        toggleStealth()
        break
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
  if (answerBox.querySelector('.hint')) answerBox.innerHTML = ''
  const cursor = answerBox.querySelector('.cursor')
  if (cursor) cursor.remove()
  answerBox.innerHTML += chunk.replace(/\n/g, '<br>')
  const cur = document.createElement('span')
  cur.className = 'cursor'
  answerBox.appendChild(cur)
  answerBox.scrollTop = answerBox.scrollHeight
}

function handleDone() {
  const cursor = answerBox.querySelector('.cursor')
  if (cursor) cursor.remove()
  isProcessing = false
  // Save to history
  const answer = answerBox.innerText.trim()
  if (currentQuestion && answer) {
    addToHistory(currentQuestion, answer)
  }
  setStatus(isListening ? 'listening' : 'ready',
            isListening ? 'Listening...' : 'Ready — click Start to listen')
}

function handleError(err) {
  isProcessing = false
  answerBox.innerHTML = `<span style="color:#f04444">⚠ ${err}</span>`
  setStatus('error', 'Error — check Settings')
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
  await window.electronAPI.saveSettings({
    apiKey:   key,
    jobRole:  jobRoleInput.value.trim(),
    jobDesc:  jobDescInput.value.trim(),
    language: langSelect.value,
    opacity,
    theme:    isDark ? 'dark' : 'light',
  })
  settingsOpen = false
  settingsPanel.classList.remove('open')
  setStatus('ready', 'Settings saved ✓')
})

opacitySlider.addEventListener('input', () => {
  const pct = parseInt(opacitySlider.value)
  opacityValue.textContent = pct + '%'
  window.electronAPI.setOpacity(pct / 100)
  if (!isStealthy) preStealthOpacity = pct / 100
})

/* ── Listen toggle ── */
btnListen.addEventListener('click', () => {
  isListening ? stopListening() : startListening()
})

/* ── Clear ── */
btnClear.addEventListener('click', () => {
  finalText = ''
  currentQuestion = ''
  transcriptBox.innerHTML = '<span class="hint">Start listening — questions will appear here automatically...</span>'
  answerBox.innerHTML     = '<span class="hint">Answer will stream here in real-time...</span>'
  clearTimeout(silenceTimer)
})

/* ── Manual ask ── */
btnAsk.addEventListener('click', () => {
  const txt = transcriptBox.textContent.trim()
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
    historyList.innerHTML = '<span class="hint" style="padding:12px;display:block">No history yet — answers will appear here after each question.</span>'
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
      answerBox.innerHTML = item.answer.replace(/\n/g, '<br>')
      hideHistoryPanel()
    })
  })
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
  if (isStealthy) return  // don't cycle while stealthy
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
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600)
}

/* ── Speech Recognition ── */
function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    alert('Speech recognition is not supported. Please use a Chromium-based build.')
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
      }, 2500)
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
  isProcessing    = true
  answerBox.innerHTML = '<span class="cursor"></span>'
  setStatus('processing', 'Generating answer...')
  waves.style.display = 'none'

  await window.electronAPI.askClaude({
    question,
    jobRole:        jobRoleInput.value.trim(),
    jobDescription: jobDescInput.value.trim(),
  })
}

/* ── Status helper ── */
function setStatus(state, text) {
  statusDot.className    = `status-dot ${state === 'ready' ? '' : state}`
  statusText.textContent = text
  if (state === 'listening') waves.style.display = 'flex'
  else if (state !== 'processing') waves.style.display = 'none'
}
