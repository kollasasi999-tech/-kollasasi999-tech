const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),

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
  removeListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
