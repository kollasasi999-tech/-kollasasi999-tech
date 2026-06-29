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

## Start here: the Guided Learn Path (`learn.html`)

The best place for a beginner. **8 short lessons** (Printing → Variables →
Numbers → f-strings → Lists → Loops → If/Else → Functions). Each lesson follows
the proven *teach → try* loop:

1. **Learn** — a one-screen explanation with a **runnable example** you can edit.
2. **Predict** — read a snippet, type its output (with a "why").
3. **Write** — write the code yourself; it's **run and checked** (output- or
   test-based), with retries and a clean sample solution.

Progress saves and resumes; finishing a lesson adds ⭐/XP to the practice game.
Every example, predicted output, and sample solution was **verified against real
`python3`** (0 issues).

## Watch It Run — step-by-step visualizer (`visualize.html`)

The best tool for *understanding* (not memorizing) how code works. Paste or pick
code, press **Visualize**, and **step through it line by line** — the current
line is highlighted while the **Variables** panel and **Output** update live
(like pythontutor.com, but offline and built in). Step / Back / Play / slider,
plus presets (loop, list-building, if/else, function, while, enumerate).

Reachable from the **🔎 Watch it run** buttons in the Learn lessons and after
each Practice question (they pass the exact code over). The tracer's output was
verified against real `python3`.

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
- **Code Trace game** (`quiz.html`, linked from the toolbar) — an **endless**
  "predict what this prints" game built on real, **multi-line** Python programs.
  - **Generated on the fly** across Easy / Medium / Hard / **Expert** (Hard =
    nested loops, functions, FizzBuzz-style logic; Expert = **slicing &
    `enumerate`**) and filterable by **topic** (Loops, If/Else, Functions,
    Strings, Lists, Dicts).
  - **Every answer is computed by the app's real Python interpreter** (which
    supports slicing and `enumerate`) and was **cross-checked against actual
    `python3`** (490 programs, 0 mismatches).
  - **Stars + XP + a rank ladder** (Hatchling → Legend), **daily streaks**, and
    **achievement badges** — design borrowed from Edabit/Codewars/Mimo.
  - **Spend ⭐ on tiered hints** (Concept → Shape → Reveal).
  - **Step-by-step explanations** on every answer — when you're right, when you
    reveal, and when you're wrong (the idea right away, the full walkthrough
    after a second try). Wrong answers let you **retry** instead of failing.
  - **Two ways to play** (toggle 🔍 Predict / ✍️ Write code / 🔁 Alternate):
    - **Predict** — read code, type its output.
    - **Write code** — you write the Python yourself; the app **runs it and
      checks it** (output-based, or hidden test cases for `def` tasks, like
      Codewars), shows your output vs expected, lets you **Run** and **retry**,
      and reveals a clean sample solution. Validated: all sample solutions pass
      the checker and match real `python3`.
  - Progress (stars, XP, streak, badges) saves automatically.

## The Doubt Helper — a free AI tutor, right in the app

Tap **💬 Ask** (bottom-right), type a Python doubt, and a **free Llama AI**
answers **inline** — no paid API key. It automatically sees the lesson you're on,
the challenge, your code, and your latest run result, so its answers fit exactly
what you're doing.

| Level | What it is | Needs |
|---|---|---|
| **Free Llama AI (default)** | A real AI tutor answering **inside the chat box**, free. Powered by Puter — runs Llama in the cloud for you with **no API key**. It may ask you to sign in once with a free account. | Internet. **No paid key.** |
| Optional Groq key | Faster answers with no sign-in. Tap ⚙ → paste a **free Groq key** (console.groq.com, no credit card). | A free Groq key + internet. |
| Built-in helper | Instant offline answers to common doubts + an error-spotter that reads your code. | Nothing — works offline. |
| ✦ Ask Claude | Opens **claude.ai** with your question + code pre-filled, on the **Claude subscription you already pay for**. | A Claude plan. No key, no per-message bill. |

**Note on Claude vs. a free key:** a Claude *subscription* can't power an
in-page chatbot (subscriptions only work on claude.ai). For real AI answers
*inside* the app for free, the Doubt Helper uses **Llama** instead — that's what
the default mode does. ✦ Ask Claude remains for when you want Claude itself on
your plan.

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
