"""Site health check. Run from repo root: python tools/verify.py"""
import pathlib, re
base = pathlib.Path(__file__).resolve().parent.parent
issues = []
files = sorted(base.glob('*.html')) + sorted((base/'restrictions').glob('*.html'))
# 1. removed chrome stays gone
for pat in ['class="breadcrumb"', 'font-toggle', '<div class="meta-row">', 'header-links',
            'print-btn', 'help-card', 'recent-group', 'fx-banner', 'right-card', 'cta-row']:
    hits = [f.name for f in files if pat in f.read_text(encoding='utf-8')]
    if hits:
        issues.append(f'{pat} remains in {len(hits)} files')
# 2. tag balance
for f in files:
    t = f.read_text(encoding='utf-8')
    for tag in ['main', 'aside', 'section', 'article']:
        o = len(re.findall(r'<%s[\s>]' % tag, t)); c = len(re.findall(r'</%s>' % tag, t))
        if o != c:
            issues.append(f'{f.name} <{tag}> {o}/{c}')
# 3. internal links resolve
for f in files:
    t = f.read_text(encoding='utf-8')
    for m in re.finditer(r'href="((?![a-z]+:|#|mailto:)[^"]+?)(#[^"]*)?"', t):
        h = m.group(1)
        if h.endswith('.html'):
            tgt = (f.parent / h.split('#')[0].split('?')[0])
            if not tgt.exists():
                issues.append(f'{f.name} -> {h}')
# 4. images exist
for f in files:
    t = f.read_text(encoding='utf-8')
    for m in re.finditer(r'src="(assets/[^"]+)"', t):
        if not (base/m.group(1)).exists():
            issues.append(f'{f.name} missing img {m.group(1)}')
# 5. new theme tokens present site-wide
missing_font = [f.name for f in files if 'Manrope' not in f.read_text(encoding='utf-8') and f.name not in []]
stubs = [f.name for f in files if '<link href="https://fonts.googleapis.com' not in f.read_text(encoding='utf-8')]
print('pages:', len(files))
print('missing Manrope link:', missing_font)
print('no fonts link (stubs?):', stubs)
print('ISSUES:', len(issues))
for i in issues[:30]:
    print(' -', i)
