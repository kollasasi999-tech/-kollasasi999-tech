// Launcher that strips ELECTRON_RUN_AS_NODE before spawning Electron.
// VS Code's integrated terminal sets this env var so it can use Electron as a Node runtime
// for extensions — but it also breaks every Electron app you try to run from VS Code.
// This launcher unsets it for the child process.

const { spawn } = require('child_process')
const electron = require('electron')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(electron, ['.', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  windowsHide: false,
})

child.on('close', (code) => process.exit(code ?? 0))
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
