from pathlib import Path
import re

root = Path(__file__).resolve().parent
template = (root / "src/template.html").read_text()
before, main = template.split('<main id="main">', 1)
content, after = main.split("</main>", 1)
dialog = re.search(r"<dialog\b.*?</dialog>", content, re.S).group()
content = content.replace(dialog, "")
sections = {}
starts = list(re.finditer(r"<section (?:class=\"hero|id=\"(?:chiqish|personajlar|yangiliklar|olam|media|qollanma)\")", content))
for index, start in enumerate(starts):
    end = starts[index + 1].start() if index + 1 < len(starts) else len(content)
    block = content[start.start():end].strip()
    name = re.match(r'<section id="([^"]+)"', block)
    sections[name[1] if name else "home"] = block

pages = {
    "index": ("O‘zbekcha fan-sayt", ("home", "chiqish", "personajlar", "yangiliklar", "media", "olam", "qollanma")),
    "personajlar": ("Qahramonlar", ("personajlar",)),
    "yangiliklar": ("Yangiliklar", ("yangiliklar",)),
    "media": ("Media galereyasi", ("media",)),
    "olam": ("Silvernianing shahar qo‘llanmasi", ("olam",)),
    "qollanma": ("Detektiv qo‘llanmasi", ("qollanma",)),
}
for page, (title, keys) in pages.items():
    header = re.sub(r"<title>.*?</title>", f"<title>{title} | Silver Palace UZ</title>", before)
    if page != "index":
        header = header.replace('<script src="timer.js" defer></script>\n', "")
    body = "\n".join(sections[key] for key in keys)
    if page in {"index", "media"}:
        body += "\n" + dialog
    html = header + '<main id="main" class="page-' + page + '">\n' + body + "\n</main>" + after
    if page != "index":
        for section in ("chiqish", *(pages.keys() - {"index", page})):
            html = html.replace(f'href="#{section}"', f'href="/#{section}"')
        html = html.replace('href="#main"><img', 'href="/"><img')
        html = html.replace('href="#main"><small>', 'href="/"><small>')
    html = re.sub(r'(href|src)="(?!https?:|/|#)([^"]+)"', r'\1="/\2"', html)
    output = root / "dist" / f"{page}.html"
    output.write_text(html)
    if page != "index":
        route = root / "dist" / page
        route.mkdir(exist_ok=True)
        (route / "index.html").write_text(html)
