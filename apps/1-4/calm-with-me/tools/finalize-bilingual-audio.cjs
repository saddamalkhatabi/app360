#!/usr/bin/env node
/* Bilingual audio index is built from ACTUAL decodable MP3 files and their hashes.
   No client runtime synthesis and no production approval implied. */
'use strict';
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'audio/bilingual/manifest.json');
const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const normalize=(s)=>String(s||'').normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/\s+/g,' ').trim().replace(/[.،؟!?؛:«»"']/g,'').trim();
const issues=[],index={choices:{},phrases:{},complete:false,translation_review:manifest.translation_review||'English_scripts_pending_listening_review'};
let counts={ar_choices:0,en_choices:0,ar_phrases:0,en_phrases:0,expected_choices:manifest.choices.length,expected_phrases:manifest.phrases.length};
function check(rel){
 if(!rel||rel.startsWith('/')||rel.includes('..'))return null;
 const abs=path.join(root,rel);
 if(!fs.existsSync(abs)||fs.statSync(abs).size<800)return null;
 try{
  const info=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name,channels,sample_rate:format=duration','-of','json',abs],{timeout:20000,encoding:'utf8'}));
  if(info.streams[0].codec_name!=='mp3'||Number(info.streams[0].channels)!==1)return null;
  const duration=Number(info.format.duration);
  if(!(duration>0.45&&duration<45))return null;
  return {path:rel,sha256:crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex'),duration_s:Math.round(duration*100)/100};
 }catch(e){return null}
}
for(const c of manifest.choices){
 const ar=check(c.ar_path),en=check(c.en_path);
 if(ar)counts.ar_choices++;else issues.push('choice ar:'+c.id);
 if(en)counts.en_choices++;else issues.push('choice en:'+c.id);
 if(ar||en)index.choices[c.id]={ar,en,text_ar:c.text_ar,text_en:c.text_en};
}
for(const p of manifest.phrases){
 const ar=check(p.path),en=check(p.english_path),key=normalize(p.text);
 if(ar)counts.ar_phrases++;else issues.push('phrase ar:'+p.key);
 if(en)counts.en_phrases++;else issues.push('phrase en:'+p.key);
 if(ar||en)index.phrases[key]={ar,en,text_ar:p.text,text_en:p.text_en};
}
index.complete=issues.length===0;
const out=path.join(root,'audio/bilingual/voice-map.js');
fs.writeFileSync(out,'/* Pre-recorded MP3 only. Authored English voice scripts await listening review. */\nwindow.APP360_CALM_BILINGUAL_AUDIO='+JSON.stringify(index,null,2)+';\n');
const report={...counts,missing:issues,complete:index.complete,engine_ar:'SILMA 1.0.5',engine_en:'English Neural prerecording',human_review:false,production_approved:false};
fs.writeFileSync(path.join(root,'audio/bilingual/build-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(process.argv.includes('--require-complete')&&!index.complete)process.exit(1);
