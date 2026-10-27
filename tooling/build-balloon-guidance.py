"""Generate public bilingual game guidance with the proven repository SILMA engine.
Uses the same public bundled reference and inference path as existing English/Arabic
recorders. No personal voice or child data. Partitioning and cache keys are inherited.
"""
from pathlib import Path
source=Path(__file__).with_name('build-silma-audio.py').read_text()
needle="if i['language']=='ar' and i.get('engine','silma')=='silma'"
assert source.count(needle)==1
source=source.replace(needle,"if i['language'] in ('ar','en') and i.get('engine','silma')=='silma'")
exec(compile(source,str(Path(__file__).with_name('build-silma-audio.py')),'exec'),{'__name__':'__main__'})
