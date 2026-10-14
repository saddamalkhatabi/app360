"""Reuse the established icon atlas in small, self-contained reading assets."""
import json,pathlib,subprocess
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1]
js="const fs=require('fs'),vm=require('vm'),w={};vm.runInNewContext(fs.readFileSync('compat-icons-v27.js','utf8'),{window:w});console.log(JSON.stringify(w.CreativeCompatIcons));"
icons=json.loads(subprocess.check_output(['node','-e',js],cwd=root));data=json.loads((root/'words-data-v31.js').read_text().split('=',1)[1].rstrip(';\n'))
atlas=Image.open(root/'assets/compat-icons-atlas.png');out=root/'assets/word-pictures';out.mkdir(exist_ok=True);covers=root/'assets/word-covers';covers.mkdir(exist_ok=True)
for r in data['words']:
 x,y=icons['🌟' if r['icon']=='⭐' else r['icon']];atlas.crop((x,y,x+64,y+64)).save(out/(r['id']+'.webp'),'WEBP',quality=88,method=6);r['picturePath']='assets/word-pictures/'+r['id']+'.webp'
 (covers/(r['id']+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 320 180"><rect width="320" height="180" rx="24" fill="#edf9f3"/><image x="24" y="44" width="92" height="92" href="../word-pictures/'+r['id']+'.webp" xlink:href="../word-pictures/'+r['id']+'.webp"/><text x="213" y="108" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial" font-size="44" fill="#166a65">'+r['text']+'</text></svg>')
(root/'words-data-v31.js').write_text('window.CreativeWordsData='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print('Built 48 pictures and covers;',sum(f.stat().st_size for f in out.iterdir()),'picture bytes')
