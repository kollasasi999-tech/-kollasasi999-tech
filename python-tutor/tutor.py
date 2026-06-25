#!/usr/bin/env python3
"""
Python Tutor — an interactive, streaming Python-learning chat powered by Claude.

A friendlier, cheaper-to-run rewrite of a basic "ask Claude" script:
  - Streams answers token-by-token so it feels live.
  - Remembers the whole conversation, so it's a real tutor, not one-shot Q&A.
  - Shows you the cost of every turn and a running session total (no surprises
    on your bill).
  - Caches the growing conversation so repeated turns cost far less.
  - Slash commands let you check cost, reset, switch models, and save transcripts.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    pip install -r requirements.txt
    python tutor.py                 # uses Claude Opus 4.8 (default)
    python tutor.py --model haiku   # cheaper sessions: haiku | sonnet | opus

Type your Python question and press Enter. Type /help for commands.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime

try:
    import anthropic
except ImportError:
    sys.exit(
        "The 'anthropic' package is not installed.\n"
        "Run:  pip install -r requirements.txt"
    )


# --- Model choices ---------------------------------------------------------
# Friendly name -> (model id, input $/1M, output $/1M). Pricing is used only to
# estimate your spend locally; cache reads are billed at ~0.1x input and cache
# writes at ~1.25x input, which we account for below.
MODELS = {
    "opus": ("claude-opus-4-8", 5.00, 25.00),
    "sonnet": ("claude-sonnet-4-6", 3.00, 15.00),
    "haiku": ("claude-haiku-4-5", 1.00, 5.00),
}

SYSTEM_PROMPT = """\
You are "Py", a patient, encouraging Python tutor for someone actively learning \
the language. Your goal is to build real understanding, not just hand over answers.

How you teach:
- Explain the *why*, not only the *how*. Connect new ideas to ones the learner \
already knows.
- Keep examples short, runnable, and idiomatic (modern Python 3). Prefer the \
standard library; only mention third-party packages when they're genuinely the \
right tool.
- When the learner shares code with a bug, point them toward the fix with a hint \
first; show the corrected code only if they're stuck or ask for it.
- Use small, concrete examples over long abstract lectures. One good example \
beats three paragraphs.
- After explaining something non-trivial, ask one quick check-in question or \
suggest a tiny exercise so the learner can practice.
- Be concise. If a one-paragraph answer is enough, don't write five.
- Format code in fenced ```python blocks. Format inline identifiers, file names, \
and values with backticks.

Tone: warm, direct, and confidence-building. Celebrate progress. Never condescend.
"""

WELCOME = """\
\033[1;36mPython Tutor\033[0m — your interactive Python learning chat.
Ask me anything about Python. I remember the conversation, so we can go deep.

Commands:  \033[1m/help\033[0m  \033[1m/cost\033[0m  \033[1m/reset\033[0m  \
\033[1m/model\033[0m  \033[1m/save\033[0m  \033[1m/quit\033[0m
"""

HELP = """\
Commands:
  /help            Show this help.
  /cost            Show tokens used and estimated cost so far this session.
  /reset           Forget the conversation and start fresh (keeps the session).
  /model [name]    Show or switch model (opus | sonnet | haiku). Switching
                   keeps your conversation but starts a new cost tally context.
  /save [file]     Save the transcript to a Markdown file.
  /quit  /exit     Leave (Ctrl-D or Ctrl-C also works).
"""


class Session:
    """Holds conversation state and rolling usage/cost for one chat session."""

    def __init__(self, client: anthropic.Anthropic, model_key: str):
        self.client = client
        self.set_model(model_key)
        self.messages: list[dict] = []
        # Rolling token counters across the whole session.
        self.in_tokens = 0          # uncached input tokens
        self.cache_write = 0        # tokens written to cache (~1.25x input price)
        self.cache_read = 0         # tokens served from cache (~0.1x input price)
        self.out_tokens = 0
        self.cost = 0.0

    def set_model(self, model_key: str) -> None:
        self.model_key = model_key
        self.model_id, self.in_price, self.out_price = MODELS[model_key]

    # --- cost accounting ---------------------------------------------------
    def account(self, usage) -> float:
        """Add one turn's usage to the running totals; return that turn's cost."""
        u_in = usage.input_tokens
        c_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
        c_read = getattr(usage, "cache_read_input_tokens", 0) or 0
        u_out = usage.output_tokens

        turn_cost = (
            u_in * self.in_price
            + c_write * self.in_price * 1.25
            + c_read * self.in_price * 0.10
            + u_out * self.out_price
        ) / 1_000_000

        self.in_tokens += u_in
        self.cache_write += c_write
        self.cache_read += c_read
        self.out_tokens += u_out
        self.cost += turn_cost
        return turn_cost

    def cost_summary(self) -> str:
        return (
            f"\033[2m"
            f"model: {self.model_id}\n"
            f"  input (new):   {self.in_tokens:>8,} tok\n"
            f"  cache write:   {self.cache_write:>8,} tok\n"
            f"  cache read:    {self.cache_read:>8,} tok\n"
            f"  output:        {self.out_tokens:>8,} tok\n"
            f"  session total: ${self.cost:0.4f}"
            f"\033[0m"
        )

    # --- the actual call ---------------------------------------------------
    def ask(self, user_text: str) -> None:
        self.messages.append({"role": "user", "content": user_text})

        print("\033[1;32mPy:\033[0m ", end="", flush=True)
        reply_parts: list[str] = []
        try:
            with self.client.messages.stream(
                model=self.model_id,
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                # Auto-cache the last cacheable block: as the conversation grows,
                # the shared prefix is served from cache at ~0.1x input price.
                cache_control={"type": "ephemeral"},
                messages=self.messages,
            ) as stream:
                for text in stream.text_stream:
                    reply_parts.append(text)
                    print(text, end="", flush=True)
                final = stream.get_final_message()
        except anthropic.RateLimitError:
            print("\n\033[31mRate limited — wait a moment and try again.\033[0m")
            self.messages.pop()  # drop the unanswered user turn
            return
        except anthropic.APIStatusError as e:
            print(f"\n\033[31mAPI error {e.status_code}: {e.message}\033[0m")
            self.messages.pop()
            return
        except anthropic.APIConnectionError:
            print("\n\033[31mNetwork error — check your connection.\033[0m")
            self.messages.pop()
            return

        reply = "".join(reply_parts)
        self.messages.append({"role": "assistant", "content": reply})

        turn_cost = self.account(final.usage)
        print(
            f"\n\033[2m[turn: {final.usage.output_tokens} out tok"
            f"  ~${turn_cost:0.4f}  |  session ~${self.cost:0.4f}]\033[0m\n"
        )

    # --- transcript --------------------------------------------------------
    def save(self, path: str | None) -> str:
        if not path:
            path = f"python-tutor-{datetime.now():%Y%m%d-%H%M%S}.md"
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"# Python Tutor session — {datetime.now():%Y-%m-%d %H:%M}\n\n")
            for m in self.messages:
                who = "You" if m["role"] == "user" else "Py"
                f.write(f"**{who}:**\n\n{m['content']}\n\n---\n\n")
        return path


def run(model_key: str) -> int:
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        print(
            "\033[31mNo API key found.\033[0m Set one first:\n"
            "    export ANTHROPIC_API_KEY=sk-ant-...",
            file=sys.stderr,
        )
        return 1

    client = anthropic.Anthropic()
    session = Session(client, model_key)
    print(WELCOME)

    while True:
        try:
            line = input("\033[1;34mYou:\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\033[2mHappy coding! 👋\033[0m")
            print(session.cost_summary())
            return 0

        if not line:
            continue

        # --- slash commands ---
        if line.startswith("/"):
            cmd, _, arg = line[1:].partition(" ")
            cmd, arg = cmd.lower(), arg.strip()

            if cmd in ("quit", "exit", "q"):
                print("\033[2mHappy coding! 👋\033[0m")
                print(session.cost_summary())
                return 0
            if cmd == "help":
                print(HELP)
            elif cmd == "cost":
                print(session.cost_summary())
            elif cmd == "reset":
                session.messages.clear()
                print("\033[2mConversation cleared. Fresh start!\033[0m")
            elif cmd == "model":
                if not arg:
                    opts = ", ".join(MODELS)
                    print(f"Current model: \033[1m{session.model_id}\033[0m")
                    print(f"Switch with: /model <{opts}>")
                elif arg in MODELS:
                    session.set_model(arg)
                    print(f"Switched to \033[1m{session.model_id}\033[0m.")
                else:
                    print(f"Unknown model '{arg}'. Choose: {', '.join(MODELS)}")
            elif cmd == "save":
                path = session.save(arg or None)
                print(f"\033[2mSaved transcript to {path}\033[0m")
            else:
                print(f"Unknown command '/{cmd}'. Try /help.")
            continue

        session.ask(line)


def main() -> int:
    parser = argparse.ArgumentParser(description="Interactive Python tutor powered by Claude.")
    parser.add_argument(
        "--model",
        choices=list(MODELS),
        default=os.environ.get("TUTOR_MODEL", "opus"),
        help="Which Claude model to use (default: opus). haiku is cheapest.",
    )
    args = parser.parse_args()
    return run(args.model)


if __name__ == "__main__":
    raise SystemExit(main())
