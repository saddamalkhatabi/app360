"""A bounded shared index points to canonical Say and Name bytes; no asset copying."""
import pathlib,json,hashlib,subprocess
REPO=pathlib.Path(__file__).resolve().parents[4];SOURCE=REPO/'apps/1-4/say-and-name';TARGET=REPO/'resources/early-child-market-objects'
def data(file):
 s=(SOURCE/'data'/file).read_text();return json.loads(s[s.index('{'):].rstrip(';\n '))
images=data('word-images-map.js');ar=data('audio-map.js');en=data('audio-map-en.js');translations=json.loads((SOURCE/'data/translations-en.json').read_text())['base_words']
markets=[('fruits','الفواكه','Fruit','apple', [('apple','تفاح'),('banana','موز'),('orange','برتقال'),('grapes','عنب'),('strawberry','فراولة'),('watermelon','بطيخ')]),('vegetables','الخضروات','Vegetables','carrot',[('carrot','جزر'),('tomato','طماطم'),('cucumber','خيار'),('potato','بطاطس'),('onion','بصل'),('pepper','فلفل')]),('toys','الألعاب','Toys','ball',[('ball','كرة'),('cube','مكعب'),('doll','دمية'),('balloon','بالون'),('puzzle','أحجية'),('bear','دب')]),('school','أدوات المدرسة','School things','book',[('book','كتاب'),('pencil','قلم'),('paper','ورقة'),('bag','حقيبة'),('ruler','مسطرة'),('eraser','ممحاة')]),('home','أدوات البيت','Home things','cup',[('cup','كوب'),('plate','طبق'),('spoon','ملعقة'),('bottle','زجاجة'),('chair','كرسي'),('box','صندوق'),('milk','حليب')]),('animals','عالم الحيوانات','Animals','rabbit',[('cat','قطة'),('rabbit','أرنب'),('bird','طائر'),('horse','حصان'),('cow','بقرة'),('fish','سمكة')]),('vehicles','وسائل النقل','Vehicles','car',[('car','سيارة'),('bus','حافلة'),('truck','شاحنة'),('bicycle','دراجة'),('train','قطار'),('boat','قارب')])]
root='apps/1-4/say-and-name/'
def ref(path):
 full=SOURCE/path;assert full.is_file(),path
 return root+path,hashlib.sha256(full.read_bytes()).hexdigest()
items=[];groups=[]
for key,label,english,cover,words in markets:
 groups.append({'id':key,'ar':label,'en':english,'cover':cover,'products':[p for p,_ in words]})
 for id,word in words:
  translated=translations[word];assert translated in en,(word,translated)
  item={'id':id,'market':key,'ar':word,'en':translated,'sha256':{}}
  for field,path in [('image','assets/word-images/'+images[word]),('audio_ar',ar[word]),('audio_en',en[translated])]:item[field],item['sha256'][field]=ref(path)
  items.append(item)
names=['صفر','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة'];numbers={'ar':{},'en':{}}
for n,word in enumerate(names):
 for lang,mp in [('ar',ar),('en',en)]:
  key=word if lang=='ar' else translations[word];path,sha=ref(mp[key]);numbers[lang][str(n)]={'path':path,'sha256':sha,'source_word':key}
pack={'schema_version':2,'id':'early-child-market-objects-v2','license':'existing-project-assets; original provenance retained','asset_policy':'canonical-source-references; no new copies or source edits','source_root':root,'markets':groups,'items':items,'numbers':numbers}
TARGET.mkdir(exist_ok=True)
(TARGET/'manifest.json').write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n')
(TARGET/'manifest.js').write_text('window.APP360_MARKET_OBJECTS='+json.dumps(pack,ensure_ascii=False,separators=(',',':'))+';\n')
print('Canonical resources:',len(items),'objects,',len(groups),'markets,',22,'existing numeral clips')
