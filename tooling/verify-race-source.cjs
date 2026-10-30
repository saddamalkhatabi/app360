'use strict';
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),path=require('path'),root=path.resolve(__dirname,'..');
const tree=new Map(cp.execFileSync('git',['ls-tree','-r','HEAD'],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024}).trim().split('\n').map(line=>{const [meta,p]=line.split('\t');return[p,meta.split(' ')[2]];}));
const dir='apps/1-4/little-car-race',media=JSON.parse(fs.readFileSync(path.join(root,dir+'/knowledge-media.json'))).files,source=['word-images-map','word-images-context-map','silma-map','audio-map-en','meaning-sentences-v1','meaning-audio-v1'].map(n=>'apps/1-4/say-and-name/data/'+n+'.js');
const mismatch=[];for(const p of media.concat(source)){const b=fs.readFileSync(path.join(root,p)),sha=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');if(tree.get(p)!==sha)mismatch.push(p);}
if(mismatch.length)throw Error('Original media differs from base main: '+mismatch.join(', '));console.log(JSON.stringify({main:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),unchangedOriginalMedia:media.length,canonicalIndexes:source.length}));
