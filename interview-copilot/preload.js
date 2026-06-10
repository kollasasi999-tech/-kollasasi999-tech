const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  setOpacity: (value) => ipcRenderer.invoke('set-opacity', value),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  mockInterviewTurn: (data) => ipcRenderer.invoke('mock-interview-turn', data),
  onMockChunk: (cb) => ipcRenderer.on('mock-chunk', (_, t) => cb(t)),
  onMockDone:  (cb) => ipcRenderer.on('mock-done', cb),
  onMockError: (cb) => ipcRenderer.on('mock-error', (_, e) => cb(e)),
  askClaudeCoding: (data) => ipcRenderer.invoke('ask-claude-coding', data),
  selectResumeFile: () => ipcRenderer.invoke('select-resume-file'),
  fetchJobUrl: (url) => ipcRenderer.invoke('fetch-job-url', url),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  askClaude: (data) => ipcRenderer.invoke('ask-claude', data),

  onClaudeChunk: (callback) => {
    ipcRenderer.on('claude-chunk', (_, chunk) => callback(chunk))
  },
  onClaudeDone: (callback) => {
    ipcRenderer.on('claude-done', callback)
  },
  onClaudeError: (callback) => {
    ipcRenderer.on('claude-error', (_, error) => callback(error))
  },
  onHotkey: (callback) => {
    ipcRenderer.on('hotkey', (_, action) => callback(action))
  },
  exportNotes: (data) => ipcRenderer.invoke('export-notes', data),
  getFollowups: (data) => ipcRenderer.invoke('get-followups', data),
  generateQuestions: (data) => ipcRenderer.invoke('generate-questions', data),

  removeListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
