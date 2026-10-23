'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),service=path.join(root,'services/app360-data-core');
require(path.join(service,'src/startup-diagnostics')).runtime();
// This service intentionally owns its native SQLite install outside the pnpm workspace.
// Never reuse a node_modules directory uploaded from Windows or a different Node ABI.
const args=['--prefix',service,fs.existsSync(path.join(service,'package-lock.json'))?'ci':'install','--omit=dev','--no-audit','--no-fund','--workspaces=false'];
const cli=process.env.npm_execpath;
const fromNpm=cli&&/npm-cli\.js$/i.test(cli);
const command=fromNpm?process.execPath:(process.platform==='win32'?'npm.cmd':'npm');
const result=cp.spawnSync(command,fromNpm?[cli,...args]:args,{cwd:root,stdio:'inherit',windowsHide:true,shell:!fromNpm&&process.platform==='win32'});
if(result.error||result.status!==0){console.error('[APP360_DATA_CORE] DEPENDENCY_INSTALL_FAILED');process.exitCode=result.status||1;}
else{const check=cp.spawnSync(process.execPath,['-e',"require('./src/startup-diagnostics').dependencies(); console.log('School SQLite dependency ready for this Node runtime');"],{cwd:service,stdio:'inherit',windowsHide:true});process.exitCode=check.status===0?0:(check.status||1);}
