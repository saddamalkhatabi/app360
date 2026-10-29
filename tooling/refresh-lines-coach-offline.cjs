'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');process.chdir(path.resolve(__dirname,'..'));
const dir='apps/1-4/lines-and-houses',file='data/offline/fun-lines-and-houses.json',bundle=JSON.parse(fs.readFileSync(file)),map=new Map(bundle.files.map(x=>[x.path,x]));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function record(p){const b=fs.readFileSync(p);map.set(p,{path:p,bytes:b.length,sha256:hash(b)});}
function walk(p){for(const x of fs.readdirSync(p,{withFileTypes:true})){const f=p+'/'+x.name;if(x.isDirectory()){if(x.name!=='tests')walk(f);}else if(/\.(html|js|css|svg|mp3|webmanifest|json)$/.test(f)&&!/(?:package|app|offline-files)\.json$/.test(f))record(f);}}
walk(dir);for(const icon of ['family-teacher','prev','next','refresh','finish','path','play','pause'])if(fs.existsSync('assets/ui-icons/'+icon+'.svg'))record('assets/ui-icons/'+icon+'.svg');
fs.writeFileSync(dir+'/offline-files.json',JSON.stringify({schema:1,files:[...map.keys()].filter(p=>p!==dir+'/offline-files.json').sort().map(p=>path.posix.relative(dir,p))})+'\n');record(dir+'/offline-files.json');
bundle.files=[...map.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);bundle.version=hash(JSON.stringify(bundle.files)).slice(0,16);fs.writeFileSync(file,JSON.stringify(bundle)+'\n');
const catalog=JSON.parse(fs.readFileSync('data/offline-catalog.json')),entry=catalog.apps.find(x=>x.id==='fun-lines-and-houses');Object.assign(entry,{version:bundle.version,count:bundle.files.length,bytes:bundle.files.reduce((n,x)=>n+x.bytes,0),release:'1.2.0',updateNote:'مدربة خطوط وبيوت بصوت SILMA، شرح باليد ومساعدة متدرجة ومسارات مستقلة للفئتين.'});fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log(JSON.stringify(entry));
