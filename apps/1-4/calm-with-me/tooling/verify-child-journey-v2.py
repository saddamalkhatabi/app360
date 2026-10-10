from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1]
html=(P/'index.html').read_text()
code=(P/'simple-mode-v12-original.js').read_text()
css=(P/'calm-child-experience-v2.css').read_text()
visual=(P/'child-illustrations-v1.js').read_text()
for expected in ('calm-child-experience-v2.css','simple-mode-v12.js?v=110','calmCoachBtn','calmChildBtn','calmPlayWelcomeBtn'):
    assert expected in html, expected
for expected in ("sourceClick(kind,id)","chooseCoach(on)","step=1","calm-kid-grid","calm-kid-buttons","APP360CalmNarration"):
    assert expected in code, expected
assert "data-calm-action=\"next\"" in code
assert 'calm-kid-card' in css
for lang in ('ar','en'):
    for kind in ('coach','intro'):
        f=P/'audio'/'intro'/f'{kind}-{lang}.mp3'
        assert f.is_file() and f.stat().st_size>2000, str(f)
    assert (P/'audio'/'bilingual'/lang).exists()
groups=['signals','feelings','helps','transitions']
counts={'signals':19,'feelings':14,'helps':28,'transitions':13}
for group in groups:
    m=re.search(r'\\b'+group+r':\\{([^}]+)\\}',visual)
    assert m,group
    keys=re.findall(r"(?:'([^']+)'|\\b([a-z][a-z-]*))\\s*:",m.group(1))
    assert len(keys)==counts[group],(group,len(keys))
# No false pass: these checks cannot certify semantic picture clarity.
print('PASS: source syntax, MP3 presence, controls, mappings; VISUAL REVIEW STILL REQUIRED')
