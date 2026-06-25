# 🐍 Python Quest

A self-contained, **free, offline** Python course that runs a tiny Python
interpreter right in your browser — gamified lessons, a free-play sandbox, and a
built-in **Doubt Helper** that can ask **Claude on your subscription** whenever
you're stuck. No server, no install, no per-message bill.

> This is the improved version of the original Python Quest artifact, with two
> upgrades: it now asks **Claude (your subscription)** for help, and it **saves
> your progress offline** when you download or share the file.

## Open it

Just open **`index.html`** in any browser — that's it.

```bash
open python-tutor/index.html        # macOS
xdg-open python-tutor/index.html    # Linux
# or double-click index.html in your file explorer
```

Works with no internet for the lessons themselves. Share the file with anyone —
they can learn too, no account needed.

## What's inside

- **24 lessons** across 6 chapters (print → variables → lists/dicts → loops →
  functions → real programs), each with a runnable challenge that lights up a
  star when you pass.
- **A real Python interpreter in pure JavaScript** — `print`, variables,
  f-strings, math, lists, dicts, `range`, `for`/`while`, `if`/`elif`/`else`,
  functions with defaults, string methods, and friendly error messages. All
  offline.
- **Free Play sandbox** to experiment with your own code.
- **Doubt Helper** (the 💬 Ask button) — see below.

## The Doubt Helper — three ways to get unstuck

| Level | What it is | Needs |
|---|---|---|
| **✦ Ask Claude** | Opens **claude.ai** with your question **and your current code** pre-filled, answered on the **Claude subscription you already pay for**. | A Claude Pro/Max plan. **No API key. Nothing billed per message.** |
| Built-in helper | Instant offline answers to common doubts + an error-spotter that reads your pasted code. | Nothing — works offline. |
| Inline Gemini (optional) | Answers inside the panel without leaving the page. Tap ⚙ to add a free Google AI key. | A free Gemini key + internet. |

**Why "Ask Claude" works this way:** your Claude *subscription* (claude.ai) and
the Claude *API* are billed separately — the subscription can't authenticate a
script or a web page directly. So the Doubt Helper sends your question **to
claude.ai**, where your subscription covers it. It also copies the question to
your clipboard as a fallback, in case the pre-fill doesn't carry over.

## Notes

- **Progress saves automatically** (via `localStorage`) and survives closing the
  tab — even when you open the file straight from disk. "Start over" resets it.
- Everything stays on your device. No keys are ever written into the shared
  file.

---

### Also here: `tutor.py` (optional, pay-per-token)

`tutor.py` is a separate terminal chat that uses the Claude **API** (billed per
token, with live cost tracking). It's only for if you specifically want terminal
automation — for learning on your subscription, use `index.html` above.
