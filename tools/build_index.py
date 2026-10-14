"""Rebuild assets/full-index.js + full-index.json from page content. Run from repo root: python tools/build_index.py"""
import pathlib, re, json, html as ihtml

base = pathlib.Path(__file__).resolve().parent.parent


def clean(s):
    s = re.sub(r'<script.*?</script>', ' ', s, flags=re.DOTALL)
    s = re.sub(r'<[^>]+>', ' ', s)
    return ihtml.unescape(re.sub(r'\s+', ' ', s)).strip()


entries = []
files = sorted(base.glob('*.html')) + sorted((base / 'restrictions').glob('*.html'))
REDIRECT_ENTRY = {'page': 'restrictions.html', 'url': 'policies.html#overview', 'group': 'Reference',
                  'title': 'Restrictions — full reference',
                  'crumb': 'FieldX Documentation › Restrictions',
                  'text': 'Moved to the canonical Restrictions reference (policies.html): the full lockdown catalog across 29 categories.'}
for f in files:
    t = f.read_text(encoding='utf-8')
    if 'http-equiv="refresh"' in t:
        if f.name == 'restrictions.html':
            entries.append(REDIRECT_ENTRY)
        continue
    if f.name == 'search.html':
        continue  # results page is never indexed
    page = f.name if f.parent == base else f'restrictions/{f.name}'
    group = 'Home' if f.name == 'index.html' else 'Reference'
    CRUMB_ROOT = 'FieldX Documentation'
    h2s = [(m.start(), ihtml.unescape(re.sub(r'<[^>]+>', '', m.group(1)).strip())) for m in re.finditer(r'<h2>(.*?)</h2>', t, flags=re.DOTALL)]
    h1m = re.search(r'<h1>(.*?)</h1>', t, flags=re.DOTALL)
    h1 = ihtml.unescape(re.sub(r'<[^>]+>', '', h1m.group(1)).strip()) if h1m else f.name

    def section_at(pos):
        sec = ''
        for p, txt in h2s:
            if p < pos:
                sec = txt
            else:
                break
        return sec

    def detitle(text, title):
        if text.lower().startswith(title.lower()):
            return text[len(title):].lstrip(' :–—-')
        return text
    # intro block
    im = re.search(r'<section class="intro" id="([^"]+)">(.*?)</section>', t, flags=re.DOTALL)
    if im:
        iid, ibody = im.group(1), im.group(2)
        hm = re.search(r'<h1>(.*?)</h1>', ibody, flags=re.DOTALL)
        title = ihtml.unescape(re.sub(r'<[^>]+>', '', hm.group(1)).strip()) if hm else f.name
        pm = re.search(r'<p>(.*?)</p>', ibody, flags=re.DOTALL)
        text = clean(pm.group(1))[:300] if pm else ''
        entries.append({'page': page,
                        'url': f'{page}#{iid}', 'group': group, 'title': title,
                        'crumb': f'{CRUMB_ROOT} › {title}', 'text': text})
    def trunc(s, cap=300):
        if len(s) <= cap:
            return s
        out = []
        for w in s.split(' '):
            if len(' '.join(out + [w])) + 1 > cap:
                break
            out.append(w)
        return ' '.join(out) + '…'

    for m in re.finditer(r'<article[^>]*id="([^"]+)"([^>]*)>(.*?)</article>', t, flags=re.DOTALL):
        aid, attrs, body = m.group(1), m.group(2), m.group(3)
        tm = re.search(r'<span>(.*?)</span>', body, flags=re.DOTALL)
        title = ihtml.unescape(re.sub(r'<[^>]+>', '', tm.group(1)).strip()) if tm else aid
        km = re.search(r'data-search="([^"]*)"', attrs)
        ds = ihtml.unescape(km.group(1).strip()) if km else ''
        text = detitle(clean(body), title)
        if ds:
            text = (text + ' ' + ds).strip()
        text = trunc(text)
        if len(text) < 20:
            continue
        sec = section_at(m.start())
        crumb = f'{CRUMB_ROOT} › {h1} › {sec}' if sec and sec != title else f'{CRUMB_ROOT} › {h1}'
        entries.append({'page': page,
                        'url': f'{page}#{aid}', 'group': group, 'title': title,
                        'crumb': crumb, 'text': text})

js = 'window.FX_FULL_INDEX=' + json.dumps(entries, ensure_ascii=False) + ';'
print('entries:', len(entries), 'js bytes:', len(js.encode('utf-8')))
(base / 'assets' / 'full-index.js').write_text(js, encoding='utf-8')
(base / 'assets' / 'full-index.json').write_text(json.dumps(entries, ensure_ascii=False), encoding='utf-8')
print('wrote assets/full-index.js + full-index.json')
