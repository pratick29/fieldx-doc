"""Draft NEW api/kb.json records from page content. Run from repo root: python tools/build_kb.py
IMPORTANT: api/kb.json is hand-curated (keys, user_intents, platforms,
sources). This script only DRAFTS records for newly added articles: it
prints them — review, hand-finish keys/intents like the existing records,
then append. NEVER blind-overwrite api/kb.json with generator output."""
import pathlib, re, json, html as ihtml

base = pathlib.Path(__file__).resolve().parent.parent
SYN = {'wipe': ['factory reset', 'erase'], 'block': ['disallow', 'disable', 'blacklist'],
       'allow': ['permit', 'enable', 'whitelist'], 'install': ['push', 'deploy', 'sideload'],
       'update': ['upgrade', 'ota', 'firmware', 'rollout'], 'password': ['passcode', 'pin'],
       'enroll': ['provisioning', 'onboard'], 'report': ['export', 'audit', 'compliance'],
       'app': ['application', 'package', 'apk'], 'certificate': ['scep', 'credential'],
       'lock': ['lockdown'], 'kiosk': ['lockdown', 'single app'], 'vpn': ['tunnel', 'private network'],
       'wifi': ['wi-fi', 'ssid', 'wireless'], 'sms': ['text message']}
GEN_KEYS = {'id', 'title', 'module', 'section', 'path', 'keys', 'user_intents',
            'platforms', 'text', 'page'}

# ---- stage 1: extract ----
raw = []
for f in list(sorted(base.glob('*.html'))) + sorted((base / 'restrictions').glob('*.html')):
    t = f.read_text(encoding='utf-8')
    page = f.name if f.parent == base else f'restrictions/{f.name}'
    h2s = [(m.start(), ihtml.unescape(re.sub(r'<[^>]+>', '', m.group(1)).strip()))
           for m in re.finditer(r'<h2>(.*?)</h2>', t, flags=re.DOTALL)]
    h1m = re.search(r'<h1>(.*?)</h1>', t, flags=re.DOTALL)
    h1 = ihtml.unescape(re.sub(r'<[^>]+>', '', h1m.group(1)).strip()) if h1m else ''
    for m in re.finditer(r'<article[^>]*id="([^"]+)"([^>]*)>(.*?)</article>', t, flags=re.DOTALL):
        aid, attrs, body = m.group(1), m.group(2), m.group(3)
        tm = re.search(r'<span>(.*?)</span>', body, flags=re.DOTALL)
        title = ihtml.unescape(re.sub(r'<[^>]+>', '', tm.group(1)).strip()) if tm else aid
        km = re.search(r'data-search="([^"]*)"', attrs)
        ds = ihtml.unescape(km.group(1).strip()) if km else ''
        sec = ''
        for pos, txt in h2s:
            if pos < m.start():
                sec = txt
            else:
                break
        text = re.sub(r'<script.*?</script>', ' ', body, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = ihtml.unescape(re.sub(r'\s+', ' ', text)).strip().replace('\u2304', '').strip()
        low, tl = text.lower(), title.lower()
        if low.startswith(tl):
            text = text[len(title):].lstrip(' :\u2013\u2014-')
        text = re.sub(r'\s+', ' ', text).strip()
        pm = re.search(r'Available for</b>\s*<span>(.*?)</span>', body, flags=re.DOTALL)
        plats = []
        if pm:
            pts = ihtml.unescape(re.sub(r'<[^>]+>', '', pm.group(1)).strip())
            if 'Not specified' not in pts and pts.strip() not in ('-', ''):
                plats = [p.strip() for p in pts.split(',') if p.strip()]
        raw.append({'page': page, 'aid': aid, 'title': title[:120], 'module': h1[:40],
                    'section': sec[:80], 'ds': ds[:400], 'plats': plats, 'text': text})

# ---- dedup: same aid on policies.html + restrictions/* -> keep restrictions version ----
seen, staged = {}, []
for r in sorted(raw, key=lambda x: (x['aid'], 0 if x['page'].startswith('restrictions/') else 1)):
    if r['aid'] in seen:
        continue
    seen[r['aid']] = 1
    staged.append(r)

# ---- stage 2: enrich ----
out = []
for r in staged:
    title, sec, mod = r['title'], r.get('section', ''), r.get('module', '')
    path = ' → '.join([x for x in [mod, sec, title] if x])
    words = re.findall(r'[a-z0-9]+', (title + ' ' + sec + ' ' + r.get('ds', '')).lower())
    keys = []
    for w in words:
        if w not in keys:
            keys.append(w)
    for w in list(keys):
        for s in SYN.get(w, []):
            if s not in keys:
                keys.append(s)
    tl = title.strip()
    intents = [f'How do I configure {tl}?', f'Where is the {tl} setting?', f'What does {tl} do?']
    text = r['text']
    if len(text) > 1600:
        cut = max(text.rfind('. ', 0, 1600), text.rfind('? ', 0, 1600))
        text = text[:cut + 1] if cut > 900 else text[:1600]
    out.append({'id': r['aid'], 'title': tl, 'module': mod, 'section': sec, 'path': path,
                'keys': keys[:40], 'user_intents': intents,
                'platforms': r.get('plats', []),
                'text': f'{tl} ({path}). {text}'[:1900], 'page': r['page']})

# ---- only draft records for articles missing from kb.json ----
kb_path = base / 'api' / 'kb.json'
have = set()
if kb_path.exists():
    try:
        old = json.loads(kb_path.read_text(encoding='utf-8'))
        have = {e.get('id') for e in (old if isinstance(old, list) else [])}
    except Exception as ex:
        print('warning: could not read existing kb.json:', ex)
new_recs = [e for e in out if e['id'] not in have]
print('existing records:', len(have), '| new drafts:', len(new_recs))
if new_recs:
    print(json.dumps(new_recs, ensure_ascii=False, indent=1))
