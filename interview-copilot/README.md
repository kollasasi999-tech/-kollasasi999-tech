# 🎯 Interview Copilot

> A real-time AI interview assistant powered by Anthropic Claude — desktop overlay that listens, understands, and helps you answer interview questions with personalized, resume-grounded responses.

![Electron](https://img.shields.io/badge/Electron-35-47848F?logo=electron&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Sonnet_4.6-D97757?logoColor=white)
![Node](https://img.shields.io/badge/Node-22+-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/Windows_%7C_macOS_%7C_Linux-lightgrey)

---

## What it does

Interview Copilot runs as a **transparent overlay** on top of your screen during interviews (video calls, phone screens, take-homes). It:

1. **Listens to interviewer questions** via audio capture
2. **Generates personalized answers** using Claude, grounded in your resume + the job description
3. **Surfaces a "Story Bank"** mined from your resume — relevant past projects/wins for any question
4. **Adapts to the role** by fetching the job posting URL and tailoring tone, depth, and keywords
5. **Stays hidden** — stealth mode hides from screen-share and Zoom recording

Built because every interview prep tool I tried was either (a) generic ChatGPT-tier answers, or (b) clunky web apps that don't work during a live call.

---

## ✨ Features

### Core
- 🤖 **Real-time AI answers** powered by Anthropic Claude (`claude-sonnet-4-6`)
- 📄 **Resume-aware** — upload your resume (PDF or TXT), answers reference your actual experience
- 🎯 **Job-context aware** — paste a job URL, the app fetches the posting and personalizes every response
- 🧠 **Story Bank mining** — extracts STAR-format stories from your resume, surfaces relevant ones per question
- ❓ **15-question generator** — produces a likely-asked-questions list for the specific role

### UX
- 👻 **Stealth mode** — hides from screen share/recording
- 🪟 **Slim overlay mode** — collapsible mini-window stays out of the way
- 🌓 **Light/dark themes**
- 🎚️ **Window opacity slider** (20–100%) — discreet positioning
- ⏱️ **Auto-send delay** — adjustable silence trigger (1–5s)
- 🖱️ **System tray** — quick show/hide
- ⌨️ **Global shortcut** — `Shift+M` for slim mode

### Production polish
- 🔄 **Auto-updater** via `electron-updater` + GitHub Releases
- 💾 **Local-only settings** — API keys never leave your machine
- 📦 **Cross-platform builds** — Windows NSIS, macOS DMG (x64 + arm64), Linux AppImage
- 🔐 **macOS signed + notarized** via `@electron/notarize`
- 🛡️ **CSP-locked renderer** — no remote scripts, no eval

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| **AI** | Anthropic Claude SDK (`@anthropic-ai/sdk`) |
| **Runtime** | Electron 35 + Node 22 |
| **PDF parsing** | `pdf-parse` |
| **Updates** | `electron-updater` |
| **Build** | `electron-builder` |
| **UI** | Vanilla JS + CSS (no framework — fast cold-start) |

---

## 🚀 Run It Locally

```bash
git clone https://github.com/kollasasi999-tech/-kollasasi999-tech.git
cd -kollasasi999-tech
git checkout claude/welcome-back-b1n7qk
cd interview-copilot
npm install
npm start
```

> **Windows + VS Code note:** VS Code sets `ELECTRON_RUN_AS_NODE=1` in its terminals which breaks every Electron app launch. The included [`scripts/start.js`](scripts/start.js) launcher strips this env var automatically. If you launch outside VS Code, this isn't needed.

You'll need:
- Node.js 18+
- An Anthropic API key (settings panel inside the app, stored locally only)

---

## 🧱 Architecture Highlights

```
┌─────────────────────────────────────────────────────────────┐
│  Main Process (main.js)                                     │
│  • Settings persistence (encrypted local file)              │
│  • Anthropic SDK client + streaming                         │
│  • Job URL fetching + HTML stripping                        │
│  • PDF resume parsing (pdf-parse)                           │
│  • Global shortcut + tray + stealth-mode window flags       │
│  • Auto-updater integration (electron-updater)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ IPC (preload.js — context isolation)
┌──────────────────────┴──────────────────────────────────────┐
│  Renderer Process (renderer/)                               │
│  • Overlay UI (CSP-locked HTML/CSS/JS)                      │
│  • Real-time streaming answer rendering                     │
│  • Story Bank UI + question generator                       │
└─────────────────────────────────────────────────────────────┘
```

**Design choices worth calling out:**

- **No bundler/framework in renderer** — vanilla JS keeps cold-start under 1s, critical for interview moments where you need answers NOW
- **Context-isolated preload** — strict separation between main and renderer for security
- **Streaming-first** — answers stream token-by-token via Anthropic's SSE API; user sees output as it generates rather than waiting for the full response
- **Local-only state** — no telemetry, no backend, API keys live only on disk in user-data folder
- **Stealth via Electron flags** — `setContentProtection(true)` makes the window invisible to screen capture on Windows/macOS

---

## 🗺️ Roadmap

- [ ] MCP server integration — let Claude pull context from arbitrary tools (Notion, Calendar) during interviews
- [ ] Multi-LLM fallback — auto-switch to GPT-4 / Gemini if Claude rate-limits
- [ ] Local Whisper for offline transcription (privacy-first mode)
- [ ] Question history export — review past interviews
- [ ] Salary-negotiation co-pilot module

---

## 👤 Built By

**Kolla Sasi Kumar** — AI Engineer focused on LLM integration and production AI applications.
📍 Hartford, CT, USA · 🎓 M.S. Information Science, New England College
🌐 [GitHub](https://github.com/kollasasi999-tech) · 📧 kollasasi999@gmail.com

> Currently open to remote AI Engineer / Prompt Engineer / AI Integration roles.

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.
