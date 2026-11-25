from pathlib import Path
import re
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
app=(root/'src/app.js').read_text()
ids=set(re.findall(r'\bid="([\w-]+)"',html))
refs=set(re.findall(r"\$\('([\w-]+)'\)",app))
missing=sorted(refs-ids)
assert not missing,missing
assert '<script type="module" src="./src/app.js"></script>' in html
# Removed decorative text must not leave stale JavaScript DOM references.
for marker in ('class="brand"','id="sceneSubtitle"','id="scaleNote"'):
 assert marker not in html,marker
for identifier in ('sceneSubtitle','scaleNote'):
 assert identifier not in app,identifier
for filename in ['assets/styles.css','src/data/named-stars.js','src/data/catalog.js','src/data/hyg-worker.js','src/science/evolution.js','src/visual/scene.js','src/ui/hr.js','THIRD_PARTY_NOTICES.md']:
 assert (root/filename).is_file(),filename
print('PASS: DOM ID references and project assets present')
