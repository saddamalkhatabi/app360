'use strict';
const fs=require('node:fs'),path=require('node:path');
function load(file){file=file||path.resolve(__dirname,'../../..','.env');if(!fs.existsSync(file))return;
 if(typeof process.loadEnvFile==='function'){process.loadEnvFile(file);return}
 // Compatibility for early Node 20: ordinary single-line hosting variables.
 const text=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
 for(const line of text.split(/\r?\n/)){const m=/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);if(!m)continue;let value=m[2];if(/^["']/.test(value)){const q=value[0],end=value.lastIndexOf(q);if(end===0)throw Error('Unsupported multiline environment value: '+m[1]);value=value.slice(1,end);if(q==='"')value=value.replace(/\\n/g,'\n').replace(/\\r/g,'\r')}else value=value.replace(/\s*#.*$/,'').trim();if(process.env[m[1]]===undefined)process.env[m[1]]=value}
}
module.exports={load};
