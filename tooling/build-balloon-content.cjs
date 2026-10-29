'use strict';
// Reuse context-specific source pictures, SILMA speech and measured sentence cues.
const fs=require('fs'),vm=require('vm'),path=require('path'),root=path.resolve(__dirname,'..');process.chdir(root);
const w={},ctx={window:w},source='apps/1-4/say-and-name/';
for(const f of ['word-images-map','word-images-context-map','silma-map','audio-map-en','meaning-sentences-v1','meaning-audio-v1'])vm.runInNewContext(fs.readFileSync(source+'data/'+f+'.js','utf8'),ctx);
const base='../say-and-name/',drawing='../drawing-writing-foundations/',meaning=w.APP360_MEANING_CONTENT;
const words=meaning.items.map(row=>{const image=w.APP360_WORD_IMAGE_CONTEXT_MAP[row.key]||w.APP360_WORD_IMAGE_MAP[row.ar],ar=w.APP360_SILMA.senses[row.key]||w.APP360_SILMA.words[row.ar];if(!image||!ar)throw Error('Missing media: '+row.key);return{id:row.id,key:row.key,ar:row.ar,en:row.en,category:row.category,image:base+'assets/word-images/'+image,audio:{ar:base+ar,en:w.APP360_AUDIO_MAP_EN[row.en]?base+w.APP360_AUDIO_MAP_EN[row.en]:null}};});
const letterIds='alif ba ta tha jeem haa kha dal dhal ra zay seen sheen sad dad tah zah ayn ghayn fa qaf kaf lam meem noon ha waw ya'.split(' '),letters=letterIds.map(id=>drawing+'audio/coach/label-'+id+'.mp3');
const numbers=['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'].map(en=>base+w.APP360_AUDIO_MAP_EN[en]);
const colors=['Red','Yellow','Green','Blue','Purple','Pink'].map((en,i)=>({ar:drawing+'audio/colors/color-'+['red','yellow','green','blue','purple','pink'][i]+'.mp3',en:base+w.APP360_AUDIO_MAP_EN[en]}));
const data={schema:2,source:'Shared vocabulary library, context-specific images and SILMA audio; numbers spoken in English.',categories:meaning.categories,words,letters,numbers,colors};
fs.writeFileSync('apps/1-4/balloon-garden/content.js','/* Generated from the shared vocabulary library; media stays at source. */\nwindow.BalloonGardenContent='+JSON.stringify(data)+';\n');
const items={},clips={};for(const row of meaning.items){items[row.id]=row.sentences;for(const line of row.sentences)for(const lang of ['ar','en']){const id=line[lang].clip,r=w.APP360_MEANING_AUDIO.clips[id];if(!r||r.engine!=='silma')throw Error('Missing SILMA sentence '+id);clips[id]={path:base+r.path,words:r.words,cues:r.cues,duration_ms:r.duration_ms,sha256:r.sha256,engine:r.engine};}}
fs.writeFileSync('apps/1-4/balloon-garden/learning.js','/* Shared sentence text and measured word timings. Loaded for ages 4-8 only. */\nwindow.BalloonGardenLearning='+JSON.stringify({schema:1,items,clips})+';\n');
const indexed=new Set(require('child_process').execFileSync('git',['ls-tree','-r','--name-only','HEAD'],{encoding:'utf8',maxBuffer:32*1024*1024}).trim().split('\n'));
for(const word of words)for(const ref of [word.image,word.audio.ar,word.audio.en])if(ref&&!indexed.has(path.posix.normalize('apps/1-4/balloon-garden/'+ref)))throw Error('Missing source '+ref);
console.log(JSON.stringify({words:words.length,categories:meaning.categories.length,sentenceClips:Object.keys(clips).length}));
