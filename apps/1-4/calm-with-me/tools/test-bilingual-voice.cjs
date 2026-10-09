/* Node VM contract test: real MP3 paths, AR/EN switching, NO browser TTS.
   This does NOT replace a human browser/voice listening QA. */
'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'calm-bilingual-voice-v1.js'),'utf8');
const spoken=[],logs=[],head={appendChild(x){this.button=x;}};
const n={};
function elt(tag){return {tagName:tag,style:{},setAttribute(k,v){this[k]=v},appendChild(x){this.child=x},hidden:false};}
const d={readyState:'complete',documentElement:{setAttribute(){}},createElement:elt,
  getElementById:id=>n[id]||null,querySelector:x=>x==='.head-actions'?head:null,
  addEventListener(){}};
const rootParent={insertBefore(x){n[x.id]=x}};
n.mainContent={parentNode:rootParent};
const local={};
function Audio(src){spoken.push(src);this.play=()=>({then(a,b){}});this.pause=()=>{};}
const index={choices:{},phrases:{'أنا معك':{ar:{path:'audio/bilingual/ar/phrases/abc.mp3'},en:{path:'audio/bilingual/en/phrases/abc.mp3'},text_ar:'أنا معك',text_en:'I am with you'}}};
const w={Audio,APP360_CALM_BILINGUAL_AUDIO:index,localStorage:{getItem:k=>local[k],setItem:(k,v)=>local[k]=v}};
vm.runInNewContext(script,{window:w,document:d},{filename:'calm-bilingual-voice-v1.js'});
assert(head.button,'language button must be visible');
assert.strictEqual(w.APP360CalmVoice.getLanguage(),'ar');
assert(w.APP360CalmVoice.playPhrase('أنا معك',s=>logs.push(s)));
assert.equal(spoken[0],'audio/bilingual/ar/phrases/abc.mp3');
w.APP360CalmVoice.setLanguage('en');
assert.equal(local['app360:a1-calm:recording-language'],'en');
assert.equal(w.APP360CalmVoice.getLanguage(),'en');
assert(w.APP360CalmVoice.playPhrase('أنا معك',s=>logs.push(s)));
assert.equal(spoken[1],'audio/bilingual/en/phrases/abc.mp3');
assert.equal(n.calmAudioLanguageCaption.textContent,'I am with you');
assert.equal(w.APP360CalmVoice.playPhrase('custom unrecorded phrase'),false);
assert.equal(spoken.length,2,'unrecorded custom phrase must never use browser TTS');
assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(script));
console.log('Bilingual prerecorded MP3 lookup, language toggle, caption and no-browser-TTS checks passed.');
