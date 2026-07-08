# Computes static/data/testimony-mentions.json: which gazetteer sites are
# named in the USHMM testimony transcripts, with per-site transcript / passage
# counts and RG numbers.
#
# Matching: case-sensitive word-boundary phrase match on diacritic-folded
# text (so Łódź matches "Lodz"). Variants per site: full name, slash- and
# paren-alternates, hyphen components (Bergen-Belsen -> Belsen), trailing
# roman numeral stripped (Auschwitz I -> Auschwitz). Fragments shared by
# several sites are dropped unless they equal one site's full name or the
# family's Encyclopedia chapter (Auschwitz credits all three main camps).
# Names that are everyday English words (bar, luck, most, papa...) are
# excluded — see the rule logic below for exactly what is dropped.
#
# Inputs:
#   sites.json        - unique features extracted from the gazetteer PMTiles
#                       (SiteName, SiteType, EncyStruc); regenerate by reading
#                       z12 tiles of gazetteer_processed.pmtiles
#   common-words.txt  - google-10000-english frequency list
#   /usr/share/dict/words (macOS/Linux)
#
# Deps: pip install pyahocorasick
# Output keys are the RAW SiteName values from the tiles (padding intact)
# so the map can filter by exact property equality.
import json
import os
import re
import sys
import unicodedata

import ahocorasick

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO, 'scripts', 'data')
TRANSCRIPT_DIR = os.path.join(REPO, 'content', 'transcripts')
OUT_COUNTS = os.path.join(REPO, 'static', 'data', 'testimony-mentions.json')

EXTRA = str.maketrans({
    'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ø': 'o', 'Ø': 'O',
    'ß': 'ss', 'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE',
    'ð': 'd', 'Ð': 'D', 'þ': 'th', 'Þ': 'Th',
    '’': "'", '‘': "'", 'ʼ': "'", '\xa0': ' ',
})


def fold(s):
    s = s.translate(EXTRA)
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if not unicodedata.combining(c))


def clean(name):
    return fold(name).strip()


def variants(name):
    out = set()
    base = clean(name)
    out.add(base)
    if '/' in base:
        for part in base.split('/'):
            part = part.strip()
            if len(part) >= 4:
                out.add(part)
    m = re.match(r"^(.*?)\s*\((.*?)\)\s*$", base)
    if m:
        for part in m.groups():
            part = part.strip()
            if len(part) >= 4:
                out.add(part)
    # hyphen components: "Auschwitz II-Birkenau" -> "Birkenau",
    # "Bergen-Belsen" -> "Bergen", "Belsen"
    for part in re.split(r'[-–]', base):
        part = part.strip()
        if len(part) >= 5 and not re.fullmatch(r'[IVX]+', part):
            out.add(part)
    # trailing roman numeral: "Auschwitz I" -> "Auschwitz"
    # (family rule decides whether the bare fragment may be credited)
    for v in list(out):
        stripped = re.sub(r'\s+[IVX]+$', '', v).strip()
        if len(stripped) >= 4 and stripped != v:
            out.add(stripped)
    return {v for v in out if v}


def main():
    common = {w.strip().lower() for w in open(os.path.join(DATA, 'common-words.txt'))}
    dict_lower = {w.strip() for w in open('/usr/share/dict/words')
                  if w.strip() and w.strip()[0].islower()}
    sites = json.load(open(os.path.join(DATA, 'sites.json')))

    # words that dominate testimony conversation and also fold from real
    # site names ("Pápa" -> Papa); no lexicon catches these reliably
    manual_stop = {'papa', 'mama'}

    full_of = {}   # raw name -> cleaned full name
    ency_of = {}   # raw name -> cleaned EncyStruc
    var_to_sites = {}
    exact_names = set()
    for s in sites:
        raw = s['SiteName']
        full_of[raw] = clean(raw)
        exact_names.add(clean(raw))
        ency_of[raw] = clean(s.get('EncyStruc') or '')
        for v in variants(raw):
            var_to_sites.setdefault(v, set()).add(raw)

    final = {}
    stats = {'common': [], 'short': [], 'ambiguous': [], 'family': []}
    for v, names in var_to_sites.items():
        if len(v) < 4:
            stats['short'].append(v)
            continue
        lower = v.lower()
        if v in exact_names:
            # real site name: drop only if it's an everyday English word
            # (in BOTH the frequency list and the dictionary: luck, most)
            # or on the manual stoplist (papa)
            if (lower in common and lower in dict_lower) or lower in manual_stop:
                stats['common'].append(v)
                continue
        elif lower in common or lower in dict_lower or lower in manual_stop:
            # fragment from splitting: be aggressive
            stats['common'].append(v)
            continue
        if len(names) == 1:
            final[v] = names
            continue
        exact = {n for n in names if full_of[n] == v}
        if exact:
            final[v] = exact
            continue
        # camp-family fragment: "Auschwitz" credits all sites whose
        # Encyclopedia chapter is literally "Auschwitz"
        fam = {n for n in names if ency_of[n] == v}
        if fam == names:
            final[v] = names
            stats['family'].append(v)
            continue
        stats['ambiguous'].append(v)

    print('variants kept:', len(final))
    print('family-credited:', sorted(stats['family']))
    print('dropped common:', sorted(stats['common']))
    print('dropped short:', sorted(stats['short']))
    print('dropped ambiguous:', len(stats['ambiguous']), sorted(stats['ambiguous'])[:15])

    A = ahocorasick.Automaton()
    for v in final:
        A.add_word(v, v)
    A.make_automaton()

    tag_re = re.compile(r'<[^>]+>')
    ws_re = re.compile(r'\s+')
    hits = {}
    files = sorted(f for f in os.listdir(TRANSCRIPT_DIR) if f.endswith('.html'))
    for i, fn in enumerate(files):
        rg = fn.split('_')[0].lower()
        raw = open(os.path.join(TRANSCRIPT_DIR, fn), encoding='utf-8', errors='replace').read()
        text = fold(ws_re.sub(' ', tag_re.sub(' ', raw)))
        for end, v in A.iter(text):
            start = end - len(v) + 1
            if (start > 0 and text[start - 1].isalnum()) or \
               (end + 1 < len(text) and text[end + 1].isalnum()):
                continue
            for site in final[v]:
                hits.setdefault(site, {}).setdefault(rg, 0)
                hits[site][rg] += 1
        if (i + 1) % 300 == 0:
            print(f'{i + 1}/{len(files)}', file=sys.stderr)

    site_meta = {s['SiteName']: s for s in sites}

    def entry(site, rgs):
        m = site_meta.get(site, {})
        e = {
            'transcripts': len(rgs),
            'occurrences': sum(rgs.values()),
            'rg_numbers': sorted(rgs),
        }
        if m.get('SiteType'):
            e['site_type'] = m['SiteType']
        if m.get('lat') is not None and m.get('lng') is not None:
            e['lat'] = m['lat']
            e['lng'] = m['lng']
        return e

    out = {
        'generated_from': '979 USHMM oral testimony transcripts',
        'method': ('case-sensitive word-boundary phrase match on '
                   'diacritic-folded text; ambiguous shared fragments and '
                   'common-English-word names excluded'),
        'sites': {site: entry(site, rgs) for site, rgs in hits.items()},
    }
    json.dump(out, open(OUT_COUNTS, 'w'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)

    print('sites matched:', len(hits), '/', len(sites))
    for name, rgs in sorted(hits.items(), key=lambda kv: -len(kv[1]))[:20]:
        print(f"  {name.strip()}: {len(rgs)} tr, {sum(rgs.values())} occ")
    size = os.path.getsize(OUT_COUNTS)
    print('output size:', round(size / 1024), 'KB ->', OUT_COUNTS)


if __name__ == '__main__':
    main()
