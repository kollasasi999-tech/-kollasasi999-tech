#!/usr/bin/env python3
"""Build the single-file app.html by embedding the four standalone pages as
same-origin iframe srcdoc documents (so they share localStorage). Also copies
all pages into docs/ for GitHub Pages. Run from the python-tutor/ folder:

    python3 build_app.py
"""
import re, pathlib, shutil

HERE = pathlib.Path(__file__).resolve().parent
DOCS = HERE.parent / "docs"

# Cross-page navigation is meaningless inside the combined app (the tab bar
# replaces it, and srcdoc iframes can't resolve sibling .html files), so strip:
STRIPPERS = [
    # static <a> pills linking to a sibling page
    re.compile(r'<a\b[^>]*\bhref="(?:index|learn|quiz|visualize)\.html"[^>]*>.*?</a>', re.DOTALL),
    # quiz.html's dynamic "Watch this run line by line" link (a + `...` chunk)
    re.compile(r'\n\s*\+`<div class="why"[^`]*?visualize\.html[^`]*?`'),
    # learn.html's "Watch it run" example button
    re.compile(r'<button class="btn-ghost" id="exViz">[^<]*</button>'),
    # learn.html's handler that opens visualize.html in a new tab
    re.compile(r'[ \t]*document\.getElementById\("exViz"\)[^\n]*;'),
]

def embed(name):
    html = (HERE / name).read_text(encoding="utf-8")
    for pat in STRIPPERS:
        html = pat.sub("", html)
    # srcdoc escaping: & first, then the attribute's quote char.
    return html.replace("&", "&amp;").replace('"', "&quot;")

FRAMES = [
    ("learn",  "learn.html",     "frame show", "📚 Learn"),
    ("quiz",   "quiz.html",      "frame",      "🎯 Practice"),
    ("viz",    "visualize.html", "frame",      "🔎 Watch It Run"),
    ("quest",  "index.html",     "frame",      "🐍 Quest & AI"),
]

tabs = "".join(
    f'<button class="t{" active" if i==0 else ""}" data-v="{key}">{label}</button>'
    for i, (key, _f, _c, label) in enumerate(FRAMES)
)

iframes = "".join(
    f'<iframe class="{cls}" id="f-{key}" srcdoc="{embed(fname)}"></iframe>'
    for (key, fname, cls, _label) in FRAMES
)

app = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Python Playground — learn, practice, visualize</title>
<style>
  html,body{{margin:0;padding:0;height:100%;background:#0c0d2b;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}}
  .tabs{{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:10px 8px;background:linear-gradient(160deg,#15123f,#1d1850);border-bottom:1px solid rgba(244,237,221,.12);position:sticky;top:0;z-index:5;}}
  .t{{font-size:13px;font-weight:700;border:1px solid rgba(244,237,221,.14);background:#221c57;color:#bdb6d8;border-radius:999px;padding:8px 14px;cursor:pointer;}}
  .t.active{{background:#f2a93b;color:#0c0d2b;border-color:#f2a93b;}}
  .frame{{display:none;width:100%;border:0;height:calc(100vh - 56px);}}
  .frame.show{{display:block;}}
</style>
</head>
<body>
<div class="tabs">{tabs}</div>
{iframes}
<script>
  const tabs=document.querySelectorAll(".t"), frames=document.querySelectorAll(".frame");
  tabs.forEach(t=>t.addEventListener("click",()=>{{
    tabs.forEach(x=>x.classList.remove("active")); t.classList.add("active");
    frames.forEach(f=>f.classList.remove("show"));
    document.getElementById("f-"+t.dataset.v).classList.add("show");
  }}));
</script>
</body>
</html>
'''

(HERE / "app.html").write_text(app, encoding="utf-8")
print(f"Wrote app.html ({len(app):,} bytes)")

# Mirror everything into docs/ for GitHub Pages.
DOCS.mkdir(exist_ok=True)
for f in ("index.html", "learn.html", "quiz.html", "visualize.html", "app.html"):
    shutil.copyfile(HERE / f, DOCS / f)
print(f"Copied 5 files into {DOCS}")
