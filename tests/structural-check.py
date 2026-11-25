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
assert re.search(r'<script type="module" src="\./src/app\.js\?rev=[^"]+"></script>',html)
# Decorative overlays stay invisible, but their IDs remain for earlier cached JS builds.
assert 'class="brand"' not in html
assert 'class="headline" hidden style="display:none"' in html
assert 'id="sceneSubtitle"' in html
assert 'id="scaleNote" hidden style="display:none"' in html
assert 'id="toggleDock"' in html
for filename in ['assets/styles.css','src/data/named-stars.js','src/data/catalog.js','src/data/hyg-worker.js','src/science/evolution.js','src/visual/scene.js','src/ui/hr.js','THIRD_PARTY_NOTICES.md']:
 assert (root/filename).is_file(),filename
print('PASS: DOM ID references and project assets present')
