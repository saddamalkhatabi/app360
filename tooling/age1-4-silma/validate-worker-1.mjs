import fs from 'node:fs';
const base='tooling/age1-4-silma/';
const pilot=process.argv.includes('--pilot');
const filename=base+(pilot?'worker-1-pilot-audio.json':'worker-1-narration-draft.json');
const manifest=JSON.parse(fs.readFileSync(filename,'utf8'));
const keys=new Set(),paths=new Set(),groups={};
const errors=[];
const expected=pilot?25:653;
if(manifest.items.length!==expected)errors.push('Expected '+expected+' scripts');
for(const item of manifest.items){
 const key=item.app+'/'+item.item_id+'/'+item.cue;
 if(keys.has(key))errors.push('Duplicate '+key);
 keys.add(key);
 if(paths.has(item.path))errors.push('Duplicate path '+item.path);
 paths.add(item.path);
 if(!item.text||item.language!=='ar'||item.engine!=='silma')errors.push('Invalid '+key);
 const group=item.app+'/'+item.item_id;
 (groups[group]??=new Set()).add(item.cue);
 if(process.argv.includes('--require-audio')){
  if(!fs.existsSync(item.path)||fs.statSync(item.path).size<800)errors.push('Missing audio '+item.path);
 }
}
for(const [group,cues] of Object.entries(groups)){
 if(!cues.has('intro'))errors.push('Missing intro '+group);
 for(let i=1;i<=5;i++)if(!cues.has('step-'+i))errors.push('Missing step '+group+'/'+i);
}
console.log(JSON.stringify({manifest:filename,scripts:manifest.items.length,activities:Object.keys(groups).length,errors},null,2));
if(errors.length)process.exitCode=1;
