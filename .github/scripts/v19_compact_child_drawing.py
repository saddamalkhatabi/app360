from pathlib import Path
import json

root = Path('1-4')
ui = root / 'ui-v11.js'
s = ui.read_text(encoding='utf-8')
marker = 'childUiV19CompactDrawing'
if marker not in s:
    patch = r'''

;(function(){
'use strict';
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,false);else fn()}
ready(function(){
 if(document.getElementById('childUiV19CompactDrawing'))return;
 var d=document,$=function(id){return d.getElementById(id)};
 var st=d.createElement('style');st.id='childUiV19CompactDrawing';st.type='text/css';st.innerHTML='\
#statusZone{display:none!important;height:0!important;min-height:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}\
#boardShell{height:74vh!important;min-height:410px!important}\
#glyph{top:6%!important;margin-top:0!important;transform:none!important}\
#childSideNotice{display:none;position:fixed;top:8px;right:10px;z-index:520;max-width:46vw;min-width:150px;padding:9px 13px;border-radius:12px;background:rgba(20,49,55,.94);color:#fff;text-align:right;direction:rtl;font:700 13px/1.55 Tahoma,Arial,sans-serif;box-shadow:0 5px 18px rgba(0,0,0,.24);pointer-events:none;box-sizing:border-box}\
#childSideNotice.show{display:block}\
.drawFocus #glyph{top:5%!important;margin-top:0!important}\
@media(max-width:700px){#boardShell{height:70vh!important;min-height:350px!important}#glyph{top:5%!important;margin-top:0!important}#childSideNotice{top:6px;right:6px;max-width:72vw;min-width:120px;padding:8px 10px;font-size:12px}}';
 d.getElementsByTagName('head')[0].appendChild(st);
 var notice=d.createElement('div');notice.id='childSideNotice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');d.body.appendChild(notice);
 var timer=null,last='';
 function clean(v){return(''+(v||'')).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'')}
 function show(v){v=clean(v);if(!v||v===last)return;last=v;notice.innerHTML=v;if(timer)clearTimeout(timer);notice.className='show';timer=setTimeout(function(){notice.className=''},2600)}
 var status=$('statusText');
 if(status){
   var old=clean(status.innerHTML||status.textContent||'');if(old)show(old);
   try{var mo=new MutationObserver(function(){show(status.innerHTML||status.textContent||'')});mo.observe(status,{childList:true,characterData:true,subtree:true})}
   catch(e){var prev=old;setInterval(function(){var n=clean(status.innerHTML||status.textContent||'');if(n&&n!==prev){prev=n;show(n)}},350)}
 }
 var board=$('boardShell');if(board){setTimeout(function(){try{var ev=d.createEvent('UIEvents');ev.initUIEvent('resize',true,false,window,0);window.dispatchEvent(ev)}catch(e){}},120)}
});
})();
'''
    s += patch
    ui.write_text(s, encoding='utf-8')

idx = root / 'index.html'
h = idx.read_text(encoding='utf-8')
h = h.replace('لوحة الطفل - امسك القلم وارسم v18', 'لوحة الطفل - امسك القلم وارسم v19')
h = h.replace('var LOCAL=18', 'var LOCAL=19')
h = h.replace('ui-v11.js?v=12', 'ui-v11.js?v=19')
idx.write_text(h, encoding='utf-8')

vp = root / 'version.json'
v = json.loads(vp.read_text(encoding='utf-8'))
v['build'] = 19
v['updated'] = '2026-09-11'
v['ui'] = 'compact-child-drawing-v19'
v['layout'] = 'status toast + top glyph + larger drawing board'
vp.write_text(json.dumps(v, ensure_ascii=False, indent=2), encoding='utf-8')

sw = root / 'sw.js'
t = sw.read_text(encoding='utf-8')
t = t.replace("var CACHE='app360-1-4-v18'", "var CACHE='app360-1-4-v19'")
t = t.replace("'./ui-v11.js?v=12'", "'./ui-v11.js?v=19'")
sw.write_text(t, encoding='utf-8')
