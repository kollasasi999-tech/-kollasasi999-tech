/* ── DOM refs ── */
const statusDot    = document.getElementById('statusDot')
const statusText   = document.getElementById('statusText')
const waves        = document.getElementById('waves')
const btnListen    = document.getElementById('btnListen')
const btnListenTxt = document.getElementById('btnListenText')
const micIcon      = document.getElementById('micIcon')
const btnClear     = document.getElementById('btnClear')
const btnSettings  = document.getElementById('btnSettings')
const btnSave      = document.getElementById('btnSaveSettings')
const btnAsk       = document.getElementById('btnAsk')
const btnCopy      = document.getElementById('btnCopy')
const btnMinimize  = document.getElementById('btnMinimize')
const btnClose     = document.getElementById('btnClose')
const settingsPanel= document.getElementById('settingsPanel')
const transcriptBox= document.getElementById('transcriptBox')
const answerBox    = document.getElementById('answerBox')
const apiKeyInput  = document.getElementById('apiKeyInput')
const jobRoleInput = document.getElementById('jobRoleInput')
const jobDescInput = document.getElementById('jobDescInput')
const langSelect   = document.getElementById('langSelect')

/* ── State ── */
let isListening   = false
let isProcessing  = false
let recognition   = null
let silenceTimer  = null
let settingsOpen  = false
let finalText     = ''

/* ── Init ── */
window.addEventListener('DOMContentLoaded', async () => {
  const saved = await window.electronAPI.getSettings()
  if (saved.apiKey)      apiKeyInput.value  = saved.apiKey
  if (saved.jobRole)     jobRoleInput.value = saved.jobRole
  if (saved.jobDesc)     jobDescInput.value = saved.jobDesc
  if (saved.language)    langSelect.value   = saved.language

  window.electronAPI.onClaudeChunk(handleChunk)
  window.electronAPI.onClaudeDone(handleDone)
  window.electronAPI.onClaudeError(handleError)

  // Global hotkeys from main process
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
          })
        }
        break
      }
      case 'clear':
        btnClear.click()
        break
    }
  })

  // Escape closes settings
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsOpen) {
      settingsOpen = false
      settingsPanel.classList.remove('open')
    }
  })
})

/* ── Claude response handlers ── */
function handleChunk(chunk) {
  if (answerBox.querySelector('.hint')) answerBox.innerHTML = ''
  const cursor = answerBox.querySelector('.cursor')
  if (cursor) cursor.remove()

  // Render newlines as line breaks
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
  setStatus(isListening ? 'listening' : 'ready',
            isListening ? 'Listening...' : 'Ready — click Start to listen')
}

function handleError(err) {
  isProcessing = false
  answerBox.innerHTML = `<span style="color:#f04444">⚠ ${err}</span>`
  setStatus('error', 'Error — check Settings')
}

/* ── Titlebar buttons ── */
btnMinimize.addEventListener('click', () => window.electronAPI.minimize())
btnClose.addEventListener('click',    () => window.electronAPI.close())

/* ── Settings ── */
btnSettings.addEventListener('click', () => {
  settingsOpen = !settingsOpen
  settingsPanel.classList.toggle('open', settingsOpen)
})

btnSave.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim()
  if (!key) { alert('Please enter your Anthropic API key.'); return }
  await window.electronAPI.saveSettings({
    apiKey:    key,
    jobRole:   jobRoleInput.value.trim(),
    jobDesc:   jobDescInput.value.trim(),
    language:  langSelect.value,
  })
  settingsOpen = false
  settingsPanel.classList.remove('open')
  setStatus('ready', 'Settings saved ✓')
})

/* ── Listen toggle ── */
btnListen.addEventListener('click', () => {
  isListening ? stopListening() : startListening()
})

/* ── Clear ── */
btnClear.addEventListener('click', () => {
  finalText = ''
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
      if (event.results[i].isFinal) {
        finalText += t + ' '
      } else {
        interim = t
      }
    }

    const display = finalText + interim
    if (display.trim()) {
      transcriptBox.textContent = display
      transcriptBox.scrollTop   = transcriptBox.scrollHeight
    }

    // Auto-send after 2.5s of silence (once we have enough text)
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
    // 'no-speech' and 'aborted' are handled by onend auto-restart
  }

  recognition.onend = () => {
    if (isListening) {
      setTimeout(() => { try { recognition.start() } catch (e) {} }, 150)
    }
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
  isProcessing = true

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
  statusDot.className  = `status-dot ${state === 'ready' ? '' : state}`
  statusText.textContent = text
  if (state === 'listening') waves.style.display = 'flex'
  else if (state !== 'processing') waves.style.display = 'none'
}
