# 🎯 Interview Copilot Web — Free AI Interview Assistant

> **The free, open-source alternative to Parakeet AI ($29.50–$88.50/credits), Cluely ($75/mo), Final Round AI ($81/mo), and Sensei AI ($89/mo).**
> No subscription. No signup. No credits. No server. Your data never leaves your browser.

**Why free?** Because people interviewing for jobs need money — they shouldn't have to spend it to get it. Paid interview tools charge $20–$149/month to people who are unemployed. This tool does the same job for the cost of the AI tokens you use (pennies), paid directly to the AI provider with your own key. Gemini's free tier can even make it **completely $0**.

---

## ✨ Features — head-to-head vs Parakeet AI

| Feature | This (free) | Parakeet AI ($29.50+ credits) | Cluely Pro+ ($75/mo) |
|---|---|---|---|
| Real-time AI answers | ✅ | ✅ | ✅ |
| Mic transcription of questions | ✅ (browser-native) | ✅ | ✅ |
| **Choice of AI model** | ✅ Claude / GPT / Gemini | ✅ GPT / Claude | ❌ |
| **Job posting URL auto-scrape** | ✅ | ✅ | ❌ |
| **Coding interview screen capture** | ✅ | ✅ | ✅ |
| **Multilingual** | ✅ 20+ languages | ✅ 59 languages | limited |
| Resume-grounded answers | ✅ | ✅ | Pro only |
| STAR Story Bank mining | ✅ | ❌ | ❌ |
| Mock interview with scoring | ✅ | ❌ (live-only) | ❌ |
| 15-question generator per JD | ✅ | ❌ | ❌ |
| Value after the interview ends | ✅ practice tools | ❌ real-time only | ❌ |
| Unlimited usage | ✅ (your API key) | ❌ credit system | ✅ |
| Open source | ✅ | ❌ | ❌ |
| Data stays on your machine | ✅ | ❌ | ❌ |
| **Price** | **$0 + ~$0.20/interview in tokens (or $0 with Gemini free tier)** | **$29.50 for 3 interviews** | **$75/mo** |

---

## 🚀 Use It (60 seconds)

1. **Open the app** — it's a static page; open `index.html` or the hosted URL
2. **Get an API key** from any provider:
   - [Google Gemini](https://aistudio.google.com/apikey) — **generous free tier, $0 to start** ⭐
   - [Anthropic Claude](https://console.anthropic.com/settings/keys) — new accounts include free credit
   - [OpenAI](https://platform.openai.com/api-keys)
3. Paste the key in **⚙️ Setup** (stored in your browser's localStorage only)
4. Paste the **job posting URL** (auto-extracts the description) + **your resume**
5. During the interview: hit 🎤 — the app transcribes the question, then streams a tailored answer after 2.5s of silence
6. Coding round? Hit **📸 Coding Mode** — share your screen, the AI reads the problem and solves it

## 💻 Run Locally

```bash
git clone https://github.com/kollasasi999-tech/-kollasasi999-tech.git
cd -kollasasi999-tech/interview-copilot-web
# any static server works:
npx serve .
```

No build step. No dependencies. Three files: `index.html`, `styles.css`, `app.js`.

---

## 🔒 Privacy Architecture

```
Your browser ──(your API key, HTTPS)──► api.anthropic.com
     │
     └── localStorage: API key, resume, job description
         (never transmitted anywhere except directly to Anthropic)
```

- **No backend.** This is a static page. There is no server to log your data.
- **BYOK** (Bring Your Own Key) — browser-direct CORS calls to all three providers
- Job-URL scraping uses the free public [Jina Reader](https://r.jina.ai) proxy (only the public job posting URL passes through it — never your key, resume, or answers)
- **Audit it yourself** — the entire app is ~500 lines of vanilla JS in this repo

## 🧠 Supported Models

| Provider | Live answers | Utility tasks (questions, stories) |
|---|---|---|
| **Anthropic** | Sonnet 4.6 / Opus 4.8 | Haiku 4.5 |
| **OpenAI** | GPT-5 / GPT-4.1 | GPT-4o mini |
| **Google** | Gemini 2.5 Pro / Flash | Gemini 2.5 Flash |

---

## 🖥️ Want the Desktop Version?

A more powerful **Electron desktop app** lives in [`../interview-copilot`](../interview-copilot) with extras the browser can't do:
- 👻 Stealth mode (invisible to screen share)
- 🪟 Transparent always-on-top overlay
- 📸 Screenshot analysis for live coding interviews
- ⌨️ Global hotkeys + system tray

## 👤 Built By

**Kolla Sasi Kumar** — AI Engineer focused on LLM integration and production AI applications.
📍 Hartford, CT · 🎓 M.S. Information Science · [GitHub](https://github.com/kollasasi999-tech) · kollasasi999@gmail.com

## 📜 License

MIT — use it, fork it, share it with someone who needs a job.
