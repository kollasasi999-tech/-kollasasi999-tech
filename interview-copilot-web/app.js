/* Interview Copilot Web — free, open-source, BYOK.
   Multi-provider: Anthropic Claude, OpenAI GPT, Google Gemini.
   All AI calls go directly from the browser to the provider.
   No backend. No tracking. Settings live in localStorage only. */

// ---------- Provider catalog ----------
const PROVIDERS = {
  anthropic: {
    label: 'Anthropic Claude',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 — best balance (recommended)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — fastest + cheapest' },
      { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 — smartest (slower, pricier)' },
    ],
    utilityModel: 'claude-haiku-4-5-20251001',
  },
  openai: {
    label: 'OpenAI GPT',
    models: [
      { id: 'gpt-5', label: 'GPT-5 — flagship' },
      { id: 'gpt-4.1', label: 'GPT-4.1 — strong + fast' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini — cheapest' },
    ],
    utilityModel: 'gpt-4o-mini',
  },
  gemini: {
    label: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro — smartest' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash — fast (generous free tier)' },
    ],
    utilityModel: 'gemini-2.5-flash',
  },
}

// ---------- Settings ----------
const SETTINGS_KEY = 'icw-settings'
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {} } catch { return {} }
}
function persistSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }

let settings = Object.assign({
  provider: 'anthropic',
  keys: { anthropic: '', openai: '', gemini: '' },
  models: { anthropic: 'claude-sonnet-4-6', openai: 'gpt-5', gemini: 'gemini-2.5-flash' },
  lang: 'en-US',
  jobRole: '', jobDesc: '', resume: '',
}, loadSettings())

function activeKey() { return settings.keys[settings.provider] || '' }
function activeModel() { return settings.models[settings.provider] }
function utilityModel() { return PROVIDERS[settings.provider].utilityModel }
function langName() {
  const sel = document.querySelector(`#langSelect option[value="${settings.lang}"]`)
  return sel ? sel.textContent.replace(/\(.+\)/, '').trim() : 'English'
}

// ---------- DOM ----------
const $ = (id) => document.getElementById(id)
const els = {
  banner: $('setupBanner'),
  questionInput: $('questionInput'), btnAsk: $('btnAsk'), btnMic: $('btnMic'),
  btnCoding: $('btnCoding'), answerBox: $('answerBox'),
  btnGenQuestions: $('btnGenQuestions'), questionsBox: $('questionsBox'),
  btnMineStories: $('btnMineStories'), storiesBox: $('storiesBox'),
  mockChat: $('mockChat'), mockInput: $('mockInput'), btnMockSend: $('btnMockSend'), btnMockStart: $('btnMockStart'),
  providerSelect: $('providerSelect'), modelSelect: $('modelSelect'), langSelect: $('langSelect'),
  apiKeyAnthropic: $('apiKeyAnthropic'), apiKeyOpenai: $('apiKeyOpenai'), apiKeyGemini: $('apiKeyGemini'),
  jobRoleInput: $('jobRoleInput'), jobUrlInput: $('jobUrlInput'), btnFetchUrl: $('btnFetchUrl'), fetchStatus: $('fetchStatus'),
  jobDescInput: $('jobDescInput'), resumeInput: $('resumeInput'),
  btnSaveSettings: $('btnSaveSettings'), saveStatus: $('saveStatus'),
}

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'))
    tab.classList.add('active')
    $('panel-' + tab.dataset.tab).classList.add('active')
  })
})

// ---------- Settings UI ----------
function refreshModelOptions() {
  const p = PROVIDERS[settings.provider]
  els.modelSelect.innerHTML = p.models.map(m =>
    `<option value="${m.id}" ${m.id === settings.models[settings.provider] ? 'selected' : ''}>${m.label}</option>`).join('')
}

function refreshKeyFields() {
  $('keyFieldAnthropic').classList.toggle('hidden', settings.provider !== 'anthropic')
  $('keyFieldOpenai').classList.toggle('hidden', settings.provider !== 'openai')
  $('keyFieldGemini').classList.toggle('hidden', settings.provider !== 'gemini')
}

function hydrateSettings() {
  els.providerSelect.value = settings.provider
  els.apiKeyAnthropic.value = settings.keys.anthropic
  els.apiKeyOpenai.value = settings.keys.openai
  els.apiKeyGemini.value = settings.keys.gemini
  els.langSelect.value = settings.lang
  els.jobRoleInput.value = settings.jobRole
  els.jobDescInput.value = settings.jobDesc
  els.resumeInput.value = settings.resume
  refreshModelOptions()
  refreshKeyFields()
  els.banner.classList.toggle('hidden', !!activeKey())
}
hydrateSettings()

els.providerSelect.addEventListener('change', () => {
  settings.provider = els.providerSelect.value
  refreshModelOptions()
  refreshKeyFields()
})

els.btnSaveSettings.addEventListener('click', () => {
  settings.provider = els.providerSelect.value
  settings.keys = {
    anthropic: els.apiKeyAnthropic.value.trim(),
    openai: els.apiKeyOpenai.value.trim(),
    gemini: els.apiKeyGemini.value.trim(),
  }
  settings.models[settings.provider] = els.modelSelect.value
  settings.lang = els.langSelect.value
  settings.jobRole = els.jobRoleInput.value.trim()
  settings.jobDesc = els.jobDescInput.value.trim()
  settings.resume = els.resumeInput.value.trim()
  persistSettings()
  if (recognition) recognition.lang = settings.lang
  els.banner.classList.toggle('hidden', !!activeKey())
  els.saveStatus.textContent = '✓ Saved'
  setTimeout(() => els.saveStatus.textContent = '', 2500)
})

// ---------- Job URL fetch (via free Jina Reader proxy) ----------
els.btnFetchUrl.addEventListener('click', async () => {
  const url = els.jobUrlInput.value.trim()
  if (!url) return
  els.fetchStatus.textContent = 'Fetching...'
  try {
    const res = await fetch('https://r.jina.ai/' + url)
    if (!res.ok) throw new Error(`fetch failed (${res.status})`)
    let text = await res.text()
    text = text.replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000)
    els.jobDescInput.value = text
    els.fetchStatus.textContent = '✓ Extracted — review & trim below, then Save'
  } catch (e) {
    els.fetchStatus.textContent = `⚠️ Couldn't fetch (${e.message}). Copy-paste the description manually.`
  }
})

// ---------- Unified streaming across providers ----------
async function streamLLM({ system, messages, model, maxTokens = 1024, image, onText, onDone, onError }) {
  const key = activeKey()
  if (!key) { onError('No API key set. Go to ⚙️ Setup and add your key.'); return }
  const m = model || activeModel()
  try {
    if (settings.provider === 'anthropic') await streamAnthropic({ key, m, system, messages, maxTokens, image, onText })
    else if (settings.provider === 'openai') await streamOpenAI({ key, m, system, messages, maxTokens, image, onText })
    else await streamGemini({ key, m, system, messages, maxTokens, image, onText })
    onDone?.()
  } catch (e) { onError(e.message) }
}

async function readSSE(res, extract) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try { extract(JSON.parse(data)) } catch {}
    }
  }
}

async function throwApiError(res) {
  const err = await res.json().catch(() => ({}))
  throw new Error(err?.error?.message || err?.message || `API error ${res.status}`)
}

async function streamAnthropic({ key, m, system, messages, maxTokens, image, onText }) {
  let msgs = messages
  if (image) {
    msgs = [...messages]
    const last = msgs.pop()
    msgs.push({ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
      { type: 'text', text: typeof last.content === 'string' ? last.content : 'Analyze this.' },
    ]})
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key, 'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json',
    },
    body: JSON.stringify({ model: m, max_tokens: maxTokens, ...(system ? { system } : {}), messages: msgs, stream: true }),
  })
  if (!res.ok) await throwApiError(res)
  await readSSE(res, (evt) => {
    if (evt.type === 'content_block_delta' && evt.delta?.text) onText(evt.delta.text)
  })
}

async function streamOpenAI({ key, m, system, messages, maxTokens, image, onText }) {
  let msgs = messages.map(x => ({ role: x.role, content: x.content }))
  if (image) {
    const last = msgs.pop()
    msgs.push({ role: 'user', content: [
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
      { type: 'text', text: typeof last.content === 'string' ? last.content : 'Analyze this.' },
    ]})
  }
  if (system) msgs.unshift({ role: 'system', content: system })
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: m, max_completion_tokens: maxTokens, messages: msgs, stream: true }),
  })
  if (!res.ok) await throwApiError(res)
  await readSSE(res, (evt) => {
    const t = evt.choices?.[0]?.delta?.content
    if (t) onText(t)
  })
}

async function streamGemini({ key, m, system, messages, maxTokens, image, onText }) {
  const contents = messages.map(x => ({
    role: x.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof x.content === 'string' ? x.content : '' }],
  }))
  if (image) {
    const last = contents[contents.length - 1]
    last.parts.unshift({ inline_data: { mime_type: 'image/jpeg', data: image } })
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse&key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
      contents,
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  })
  if (!res.ok) await throwApiError(res)
  await readSSE(res, (evt) => {
    const t = evt.candidates?.[0]?.content?.parts?.[0]?.text
    if (t) onText(t)
  })
}

// Non-streaming convenience using the cheap/fast utility model
async function askUtility(prompt, maxTokens = 1200) {
  let out = '', error = null
  await streamLLM({
    model: utilityModel(), maxTokens,
    messages: [{ role: 'user', content: prompt }],
    onText: (t) => out += t,
    onError: (e) => error = e,
  })
  if (error) throw new Error(error)
  return out
}

// ---------- Context builder ----------
function buildSystemPrompt(answerMode) {
  let lengthRule
  if (answerMode === 'detailed') lengthRule = 'Provide thorough answers (300-400 words) with specific examples and context'
  else if (answerMode === 'bullets') lengthRule = 'Structure your answer as 4-6 concise bullet points; start each with a strong action word'
  else lengthRule = 'Keep answers concise (under 200 words) unless it is a coding problem'

  const lang = langName()
  return `You are an expert interview coach helping a candidate during a live job interview.
${settings.jobRole ? `Role being interviewed for: ${settings.jobRole}` : ''}
${settings.jobDesc ? `Job description / company context:\n${settings.jobDesc}` : ''}
${settings.resume ? `\nCandidate resume / background:\n${settings.resume}` : ''}

Rules:
- Answer in first person as if the candidate is speaking
${lang !== 'English' ? `- Write the entire answer in ${lang}` : ''}
- Use specific experiences from the resume when relevant — make answers personal, not generic
- For behavioral questions use STAR method (Situation, Task, Action, Result) drawing from the resume
- For technical questions give a precise expert-level answer
- For coding problems provide clean code with a brief explanation; wrap code in triple backticks with the language name
- ${lengthRule}
- Be confident and professional
- Do not mention you are an AI`
}

// ---------- Live tab ----------
let liveBusy = false

async function answerQuestion() {
  const q = els.questionInput.value.trim()
  if (!q || liveBusy) return
  liveBusy = true
  els.btnAsk.textContent = '...'
  els.answerBox.innerHTML = ''
  const mode = document.querySelector('input[name="answerMode"]:checked').value

  let raw = ''
  await streamLLM({
    system: buildSystemPrompt(mode),
    messages: [{ role: 'user', content: q }],
    onText: (t) => { raw += t; els.answerBox.textContent = raw },
    onDone: () => { els.answerBox.innerHTML = renderMarkdownLite(raw) },
    onError: (e) => { els.answerBox.innerHTML = `<p class="error-msg">⚠️ ${escapeHtml(e)}</p>` },
  })
  liveBusy = false
  els.btnAsk.textContent = 'Answer'
}

els.btnAsk.addEventListener('click', answerQuestion)
els.questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); answerQuestion() }
})

// ---------- Coding Mode (screen capture → vision) ----------
els.btnCoding.addEventListener('click', async () => {
  if (liveBusy) return
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1 } })
    const track = stream.getVideoTracks()[0]
    const video = document.createElement('video')
    video.srcObject = stream
    await video.play()
    await new Promise(r => setTimeout(r, 400)) // let the frame settle

    const canvas = document.createElement('canvas')
    canvas.width = Math.min(video.videoWidth, 1600)
    canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    track.stop()

    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]

    liveBusy = true
    els.answerBox.innerHTML = '<p class="placeholder">Reading the problem from your screen...</p>'
    let raw = ''
    await streamLLM({
      maxTokens: 2048,
      system: `You are an expert software engineer helping solve a live coding interview problem.
Analyze the coding problem shown in the screenshot and provide:
1. Brief problem summary
2. Optimal approach with time and space complexity
3. Clean, working solution in the most appropriate language
4. Key steps explained
Always wrap code in triple backticks with the language name.`,
      messages: [{ role: 'user', content: 'Analyze this coding problem and provide a complete solution.' }],
      image: base64,
      onText: (t) => { raw += t; els.answerBox.textContent = raw },
      onDone: () => { els.answerBox.innerHTML = renderMarkdownLite(raw) },
      onError: (e) => { els.answerBox.innerHTML = `<p class="error-msg">⚠️ ${escapeHtml(e)}</p>` },
    })
    liveBusy = false
  } catch (e) {
    if (e.name !== 'NotAllowedError') {
      els.answerBox.innerHTML = `<p class="error-msg">⚠️ Screen capture failed: ${escapeHtml(e.message)}</p>`
    }
  }
})

// ---------- Mic (Web Speech API) ----------
let recognition = null
let listening = false

function setupMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { els.btnMic.style.display = 'none'; return }
  recognition = new SR()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = settings.lang || 'en-US'

  let finalText = ''
  let silenceTimer = null

  recognition.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += t + ' '
      else interim += t
    }
    els.questionInput.value = (finalText + interim).trim()
    clearTimeout(silenceTimer)
    silenceTimer = setTimeout(() => {
      if (listening && els.questionInput.value.trim()) { stopMic(); answerQuestion() }
    }, 2500)
  }
  recognition.onstart = () => { finalText = '' }
  recognition.onend = () => { if (listening) recognition.start() }
  recognition.onerror = (e) => {
    if (e.error === 'not-allowed') {
      stopMic()
      els.answerBox.innerHTML = '<p class="error-msg">⚠️ Microphone permission denied. Allow mic access and try again.</p>'
    }
  }
}
setupMic()

function startMic() {
  listening = true
  els.btnMic.classList.add('listening')
  els.questionInput.value = ''
  recognition.start()
}
function stopMic() {
  listening = false
  els.btnMic.classList.remove('listening')
  try { recognition.stop() } catch {}
}
els.btnMic.addEventListener('click', () => listening ? stopMic() : startMic())

// ---------- Questions tab ----------
els.btnGenQuestions.addEventListener('click', async () => {
  if (!settings.jobDesc) {
    els.questionsBox.innerHTML = '<p class="error-msg">⚠️ Paste a job description in ⚙️ Setup first.</p>'
    return
  }
  els.btnGenQuestions.textContent = 'Generating...'
  els.questionsBox.innerHTML = '<p class="placeholder">Thinking...</p>'
  try {
    const text = await askUtility(
`Generate exactly 15 likely interview questions for this position. Include 5 behavioral (Tell me about a time...), 6 technical/role-specific, and 4 situational (What would you do if...) questions. Make them specific to the job description — not generic templates.
${langName() !== 'English' ? `Write the questions in ${langName()}.` : ''}
Job Role: ${settings.jobRole || 'Not specified'}
Job Description:
${settings.jobDesc}

Output ONLY the 15 questions, one per line. No numbering, no category labels, no extra text.`, 900)

    const items = text.split('\n').map(s => s.trim()).filter(Boolean)
    els.questionsBox.innerHTML = items.map(q => `<div class="q-item">${escapeHtml(q)}</div>`).join('')
    els.questionsBox.querySelectorAll('.q-item').forEach(item => {
      item.addEventListener('click', () => {
        els.questionInput.value = item.textContent
        document.querySelector('[data-tab="live"]').click()
        answerQuestion()
      })
    })
  } catch (e) {
    els.questionsBox.innerHTML = `<p class="error-msg">⚠️ ${escapeHtml(e.message)}</p>`
  }
  els.btnGenQuestions.textContent = '🎯 Generate 15 Questions'
})

// ---------- Stories tab ----------
els.btnMineStories.addEventListener('click', async () => {
  if (!settings.resume) {
    els.storiesBox.innerHTML = '<p class="error-msg">⚠️ Paste your resume in ⚙️ Setup first.</p>'
    return
  }
  els.btnMineStories.textContent = 'Mining...'
  els.storiesBox.innerHTML = '<p class="placeholder">Analyzing your resume...</p>'
  try {
    const text = await askUtility(
`Analyze this resume and extract 5-8 of the strongest career stories that would make compelling STAR-format behavioral interview answers.

For each story use EXACTLY this format (separate stories with ---):
TITLE: [5-8 word title for this story]
S: [One sentence: the situation or challenge]
A: [One to two sentences: the specific actions taken]
R: [One sentence: the measurable result or impact]
---

Resume:
${settings.resume}

Output ONLY the stories in that format. No intro text, no conclusion, no numbering.`, 1400)

    const cards = text.split('---').map(s => s.trim()).filter(Boolean).map(block => {
      const title = (block.match(/TITLE:\s*(.+)/) || [])[1] || 'Story'
      const s = (block.match(/S:\s*(.+)/) || [])[1] || ''
      const a = (block.match(/A:\s*([\s\S]+?)(?=\nR:|$)/) || [])[1]?.trim() || ''
      const r = (block.match(/R:\s*(.+)/) || [])[1] || ''
      return `<div class="story-card"><div class="story-title">⭐ ${escapeHtml(title)}</div>
        <p><b>Situation:</b> ${escapeHtml(s)}</p>
        <p><b>Action:</b> ${escapeHtml(a)}</p>
        <p><b>Result:</b> ${escapeHtml(r)}</p></div>`
    })
    els.storiesBox.innerHTML = cards.join('') || '<p class="placeholder">No stories extracted — try adding more detail to your resume.</p>'
  } catch (e) {
    els.storiesBox.innerHTML = `<p class="error-msg">⚠️ ${escapeHtml(e.message)}</p>`
  }
  els.btnMineStories.textContent = '⚡ Mine Story Bank'
})

// ---------- Mock interview tab ----------
let mockMessages = []
let mockBusy = false

const MOCK_SYSTEM = () => `You are a professional job interviewer conducting a mock interview.
${settings.jobRole ? `Role: ${settings.jobRole}` : ''}
${settings.jobDesc ? `Job description:\n${settings.jobDesc}` : ''}
${settings.resume ? `Candidate resume:\n${settings.resume}` : ''}
${langName() !== 'English' ? `Conduct the entire interview in ${langName()}.` : ''}

Conduct a realistic interview:
- Ask ONE question at a time
- After each candidate answer, give brief FEEDBACK (2-3 sentences), then STAR: S:[1-10] T:[1-10] A:[1-10] R:[1-10] on its own line, then SCORE: [1-10], then ask the next question
- Mix behavioral, technical, and situational questions relevant to the role
- Be professional but appropriately challenging`

function addMockMsg(role, text) {
  const div = document.createElement('div')
  div.className = `mock-msg ${role}`
  div.textContent = text
  els.mockChat.appendChild(div)
  els.mockChat.scrollTop = els.mockChat.scrollHeight
  return div
}

async function runMockTurn() {
  mockBusy = true
  const div = addMockMsg('ai', '...')
  let raw = ''
  await streamLLM({
    system: MOCK_SYSTEM(),
    messages: mockMessages,
    onText: (t) => { raw += t; div.textContent = raw; els.mockChat.scrollTop = els.mockChat.scrollHeight },
    onDone: () => mockMessages.push({ role: 'assistant', content: raw }),
    onError: (e) => div.textContent = `⚠️ ${e}`,
  })
  mockBusy = false
}

els.btnMockStart.addEventListener('click', () => {
  if (mockBusy) return
  mockMessages = [{ role: 'user', content: 'Start the interview with your first question.' }]
  els.mockChat.innerHTML = ''
  runMockTurn()
})

els.btnMockSend.addEventListener('click', sendMockAnswer)
els.mockInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMockAnswer() }
})

function sendMockAnswer() {
  const text = els.mockInput.value.trim()
  if (!text || mockBusy || !mockMessages.length) return
  els.mockInput.value = ''
  addMockMsg('user', text)
  mockMessages.push({ role: 'user', content: text })
  runMockTurn()
}

// ---------- Utils ----------
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderMarkdownLite(text) {
  let html = escapeHtml(text)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code>${code}</code></pre>`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  return html
}
