const fs=require('fs'),acorn=require('acorn');
const result=[];
for(const file of process.argv.slice(2)){const ast=acorn.parse(fs.readFileSync(file,'utf8'),{ecmaVersion:'latest',sourceType:'script'});function walk(node){if(!node||typeof node!=='object')return;if(node.type==='Literal'&&typeof node.value==='string')result.push(node.value);for(const k of Object.keys(node)){const v=node[k];if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}}walk(ast)}
console.log(JSON.stringify(result));
