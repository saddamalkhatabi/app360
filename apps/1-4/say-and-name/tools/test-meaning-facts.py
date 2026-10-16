"""Guard editorial coverage and independent speech checks, not just file decoding."""
import json,pathlib,re,sys,runpy
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from meaning_speech_qa import compare
content=json.loads((ROOT/'data/meaning-sentences-v1.js').read_text().split('=',1)[1].strip().rstrip(';'))
assert content['revision']=='facts-v2'
assert len({x['ar'] for x in content['items']})==985
for item in content['items']:
 for row in item['sentences']:
  for lang in ('ar','en'):
   assert not re.search(r'المسمى|المسماة|الشَّيْءِ|the (?:item|animal|thing|person) called|I learn about',row[lang]['text']),item['key']
goat=next(x for x in content['items'] if x['ar']=='ماعز')
assert 'حليبه' in goat['sentences'][0]['ar']['text']
melon=next(x for x in content['items'] if x['ar']=='بطيخ')
assert 'الماء' in melon['sentences'][0]['ar']['text'] and 'flesh' in melon['sentences'][0]['en']['text']
contexts={x['key']:x for x in content['items']}
for a,b in [('الوقت\x01ظهر','الجسم\x01ظهر'),('الحديقة\x01ورقة','أشياء يومية\x01ورقة'),('أجزاء الطائرة\x01جناح','أجزاء الحيوان\x01جناح'),('غرفة النوم\x01درج','المنزل\x01درج')]:
 assert contexts[a]['sentences']!=contexts[b]['sentences']
assert compare('يَأْكُلُ الماعز الأعشاب.','ياكل الماعز الاعشاب')['passed']
assert not compare('يأكل الماعز الأعشاب وأوراق الشجر.','أنا أشاهد الشيء الذي يسمى ماعز')['passed']
assert not compare('I use a spoon to eat food.','I use use use a spoon spoon spoon.')['passed']
assert not compare('نطهو البطاطس قبل أكلها.','نأكلها. أكلها. أكلها.')['passed']
print('All words have reviewed useful lessons, homonyms remain distinct, and incorrect/repeated speech is rejected')

assert compare('للمثلث ثلاثة أضلاع.','للمثلث ٣ أضلاع')['passed']
assert not compare('لا نلمس السكين أو نلعب بها.','نلمس السكين أو نلعب بها.')['passed']

assert not compare('نغسل الفاكهة قبل تجهيزها ونحافظ على نظافة المائدة.','لا نغسل الفاكهة قبل تجهيزها ونحافظ على نظافة المائدة.')['passed']

assert not compare('يأكل الماعز الأعشاب وأوراق الشجر ونستفيد من حليبه ولحمه','يأكلوا الماعز الأعشاب وأوراق الشجر ونستفيد من حليبه ولحمه')['passed']

# Retry only exact current recordings; corruption and a stale transcript must not skip work.
import tempfile,hashlib,copy
from meaning_speech_qa import verified_recording
with tempfile.TemporaryDirectory() as folder:
 root=pathlib.Path(folder); (root/'clip.mp3').write_bytes(b'verified media fixture')
 wanted=dict(text='I use a spoon to eat food.', words=['I','use','a','spoon','to','eat','food.'],path='clip.mp3',language='en',engine='silma')
 clip=dict(wanted,quality_revision='facts-v2-asr',sha256=hashlib.sha256((root/'clip.mp3').read_bytes()).hexdigest(),speech_qa=dict(heard=wanted['text']))
 assert verified_recording(wanted,clip,root)
 for key,value in [('text','Old sentence.'),('words',['Old']),('quality_revision','old'),('sha256','incorrect'),('engine','other')]:
  changed=copy.deepcopy(clip);changed[key]=value
  assert not verified_recording(wanted,changed,root),key
 (root/'clip.mp3').unlink()
 assert not verified_recording(wanted,clip,root)
print('Resume checks reject stale text, metadata, corrupt bytes and missing files')

# Orthographic equivalence must not forgive changed meaning or missing words.
assert compare('A touchscreen has colorful icons.', 'A touch screen has colourful icons.')['passed']
assert compare("A roundabout's island.", 'A roundabouts island.')['passed']
assert compare('Food has fiber and flavor.', 'Food has fibre and flavour.')['passed']
assert not compare('A touchscreen has colorful icons.', 'A touch screen has icons.')['passed']
assert not compare('A stork walks in shallow water.', 'A stalk walks in shallow water.')['passed']
from meaning_recovery import spoken_text,speech_chunks
manifest=json.loads((ROOT/'data/meaning-scripts-v1.json').read_text());wanted={r['id']:r for r in manifest['items']}
authored=json.loads((ROOT/'data/meaning-pronunciation-v3.json').read_text())['spoken']
for cid in authored:
 text=spoken_text(wanted[cid],authored)
 assert compare(wanted[cid]['text'],' '.join(speech_chunks(text,True)))['passed']
assert speech_chunks('A dolphin is a mammal that lives in water and surfaces to breathe air.',True)
try:spoken_text(dict(id='bad',text='لا ألمس السكين'),{'bad':'ألمس السكين'})
except ValueError:pass
else:raise AssertionError('Hints must never remove negation')
print('Authored recovery, phrase boundaries, exact words and conservative English spelling checks passed')
