# 🐍 Python Tutor

Learn Python from a web page, and when you get stuck, **ask Claude using the
subscription you already pay for** — no per-message API bill.

There are two ways to use this, and the first one is almost certainly what you
want.

---

## ✅ Option 1 — Web page + your Claude subscription (recommended, no extra cost)

Open **`index.html`** in your browser. It's a self-contained Python learning
page with starter lessons and an **"Ask Claude"** box. When you type a question
and click the button, it opens [claude.ai](https://claude.ai) with your question
pre-filled and a tutor instruction attached — answered on **your Claude
Pro/Max subscription**. Nothing is billed per message.

```bash
# Just open the file — no install, no key, no server needed:
open python-tutor/index.html        # macOS
xdg-open python-tutor/index.html    # Linux
# or double-click index.html in your file explorer
```

**Why this is the right fit for you:** your Claude *subscription* and the Claude
*API* are billed separately. The subscription covers chatting on claude.ai; it
can't authenticate a custom script. So the way to "use my subscription" is to
send questions to claude.ai — which is exactly what this page does.

---

## 💳 Option 2 — Terminal chat via the Claude API (optional, pay-per-token)

`tutor.py` is a streaming command-line tutor that talks to the Claude **API**.
It's more automated (lives in your terminal, remembers context, shows live cost)
**but it bills your API account per token** — this is the kind of usage that
charged you before. Use it only if you specifically want API automation.

```bash
cd python-tutor
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...      # an API key, NOT your subscription
python tutor.py --model haiku            # haiku is the cheapest model
```

It shows the cost of every reply and a running total so there are no surprises,
and `/model haiku` keeps practice sessions cheap. Commands: `/help` `/cost`
`/reset` `/model` `/save` `/quit`.

---

### Quick comparison

| | Option 1 — web page | Option 2 — `tutor.py` |
|---|---|---|
| Pays with | **Your subscription** (claude.ai) | API account (per token) |
| Extra cost | **None** | Billed per message |
| Setup | Open a file | `pip install` + API key |
| Where answers appear | claude.ai tab | Your terminal |
| Best for | Learning on the plan you have | Hands-off terminal automation |

If you want to avoid bills: **use Option 1.**
