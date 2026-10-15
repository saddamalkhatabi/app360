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
