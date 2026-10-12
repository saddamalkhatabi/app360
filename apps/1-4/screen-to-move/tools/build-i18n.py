"""Build the offline English dictionary from reviewed recordings and authored UI text.
No network requests. Game IDs, answers, stored content, and recordings stay unchanged.
"""
import html,json,pathlib,re,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
repo=root.parents[2]
def norm(t):
 return re.sub('[.!؟،,:;]+$','',re.sub(r'\s+',' ',re.sub('[\u064b-\u065f\u0670ـ]','',t))).strip()
manifest=json.loads((root/'audio/manifest.json').read_text());dictionary={}
for text,key in manifest['lookup'].items():
 if re.search('[\u0600-\u06ff]',text) and manifest['clips'][key].get('en'):
  dictionary[norm(text)]=manifest['clips'][key]['en']['text']
words=json.loads((root.parent/'say-and-name/data/translations-en.json').read_text())
for section in ['categories','base_words','context_words']:
 for key,value in words[section].items():
  if isinstance(value,str):dictionary.setdefault(norm(key.split('\u0001')[-1]),value)
for line in (root/'tools/i18n-authored.tsv').read_text().splitlines():
 if '\t' in line:
  source,target=line.split('\t',1);dictionary[norm(source)]=target
keys=sorted(dictionary,key=len,reverse=True)
pattern=re.compile(r'(?<![\u0600-\u06ff])(?:'+'|'.join(re.escape(k) for k in keys)+r')(?![\u0600-\u06ff])')
def translate(text):
 normalized=norm(text)
 if normalized in dictionary:return dictionary[normalized]
 return pattern.sub(lambda m:dictionary[m.group()],normalized).replace('؟','?').replace('،',',').replace('؛',';')
sources=set()
files=list(root.glob('*.js'))+[root/'index.html']+[repo/'assets/js'/x for x in ['app360-family-sync-v1.js','app360-ai-shell.js','offline-client-v1.js','app360-access-v1.js']]
jsfiles=[file for file in files if file.suffix=='.js' and file.name not in ['voice-map.js','i18n-data-v21.js','i18n-v21.js'] and not file.name.endswith('.test.js')]
strings=json.loads(subprocess.check_output(['node',str(root/'tools/extract-i18n.cjs'),*[str(f) for f in jsfiles]]))
strings.append((root/'index.html').read_text())
for string in strings:
 for attribute in re.findall(r'''(?:placeholder|aria-label|title|alt|content)=["']([^"']+)["']''',string):
  if re.search('[\u0600-\u06ff]',attribute):sources.add(html.unescape(attribute))
 for part in re.split(r'<[^>]*>',string):
  sources.update(x.strip() for x in re.findall(r'[\u0600-\u06ff][\u0600-\u06ff\s0-9–—·٪%…،؛؟:«»()/+\-.!]*',html.unescape(part)) if x.strip())
# Extract complete game strings, including emoji-bearing labels and all material/hint text.
js="const a=[...require('./games-data.js'),...require('./games-data-v12.js')];const strings=[];function scan(x){if(typeof x==='string'&&/[\\u0600-\\u06ff]/.test(x))strings.push(x);else if(Array.isArray(x))x.forEach(scan);else if(x&&typeof x==='object')Object.values(x).forEach(scan)}scan(a);console.log(JSON.stringify(strings));"
sources.update(json.loads(subprocess.check_output(['node','-e',js],cwd=root)))
missing=[]
for source in sorted(sources):
 if source in ['نور','؟','،']:continue # A child's default name and stand-alone punctuation.
 target=translate(source)
 if re.search('[\u0600-\u06ff]',target):missing.append(source)
 else:dictionary[norm(source)]=target
assert not missing,'Untranslated authored content: '+json.dumps(missing,ensure_ascii=False)
(root/'i18n-data-v21.js').write_text('window.CreativeEnglish='+json.dumps(dictionary,ensure_ascii=False,separators=(',',':'))+';\n')
print('Built',len(dictionary),'offline translations; checked',len(sources),'source phrases.')
