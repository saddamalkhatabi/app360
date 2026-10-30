'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),source='apps/1-4/say-and-name/',target='apps/1-4/little-car-race/',w={},check=process.argv.includes('--check');
for(const name of ['word-images-map','word-images-context-map','silma-map','audio-map-en','meaning-sentences-v1','meaning-audio-v1'])vm.runInNewContext(fs.readFileSync(path.join(root,source+'data/'+name+'.js'),'utf8'),{window:w});
const meaning=w.APP360_MEANING_CONTENT,audio=w.APP360_MEANING_AUDIO,scripts=JSON.parse(fs.readFileSync(path.join(root,source+'data/meaning-scripts-v1.json'))),labels={...audio.word_paths};
for(const row of scripts.items)if(row.kind==='word'&&!labels[row.text])labels[row.text]=row.path;
const base='../say-and-name/',words=[],buckets={},media=new Set();
for(const row of meaning.items){
 const image=w.APP360_WORD_IMAGE_CONTEXT_MAP[row.key]||w.APP360_WORD_IMAGE_MAP[row.ar],ar=labels[row.ar]||w.APP360_SILMA.senses[row.key]||w.APP360_SILMA.words[row.ar],en=labels[row.en]||w.APP360_AUDIO_MAP_EN[row.en];
 if(!image||!ar||!en)throw Error('Missing canonical word media '+row.id);
 const word={id:row.id,ar:row.ar,en:row.en,category:row.category,min_age:row.min_age||1,image:base+'assets/word-images/'+image,audio:{ar:base+ar,en:base+en}};words.push(word);
 for(const p of [word.image,word.audio.ar,word.audio.en])media.add(path.posix.normalize(target+p));
 const bucket=buckets[row.id[0]]||(buckets[row.id[0]]={items:{},clips:{}});bucket.items[row.id]=row.sentences;
 for(const sentence of row.sentences)for(const language of ['ar','en']){const line=sentence[language],clip=audio.clips[line.clip];if(!clip||!clip.cues||clip.cues.length!==line.words.length)throw Error('Missing measured sentence '+line.clip);bucket.clips[line.clip]={audio:base+clip.path,words:line.words,cues:clip.cues,duration_ms:clip.duration_ms,sha256:clip.sha256};media.add(source+clip.path);}
}
function write(file,value){const p=path.join(root,target+file);if(check){if(fs.readFileSync(p,'utf8')!==value)throw Error('Stale knowledge index '+file);}else{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,value);}}
const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,source+'data/meaning-sentences-v1.js'))).update(fs.readFileSync(path.join(root,source+'data/meaning-audio-v1.js'))).digest('hex');
write('knowledge-content.js','/* Canonical Ashyaee metadata only. Images and recordings remain at their original paths. */\nwindow.LittleRaceWords='+JSON.stringify({schema:1,source:source+'data/meaning-sentences-v1.js',source_sha256:sourceHash,categories:meaning.categories,words})+';\n');
for(const [id,data] of Object.entries(buckets))write('learning/'+id+'.js','(function(w){var d='+JSON.stringify(data)+',t=w.LittleRaceLearning||(w.LittleRaceLearning={items:{},clips:{}}),k;for(k in d.items)t.items[k]=d.items[k];for(k in d.clips)t.clips[k]=d.clips[k];})(window);\n');
for(const p of media)if(!fs.existsSync(path.join(root,p)))throw Error('Missing original media '+p);
write('knowledge-media.json',JSON.stringify({schema:1,source:'say-and-name',files:[...media].sort()},null,2)+'\n');
console.log(JSON.stringify({words:words.length,categories:meaning.categories.length,sentenceBuckets:Object.keys(buckets).length,originalMediaFiles:media.size,mode:check?'checked':'built'}));
