'use strict';
// The browser and installed Android PWA share this HttpOnly, host-only cookie.
// Bearer tokens remain sessionStorage-only in each window.
const NAME='__Host-app360_session';
function read(req){const rows=String(req.headers.cookie||'').split(';');for(const row of rows){const i=row.indexOf('=');if(row.slice(0,i).trim()===NAME){const value=row.slice(i+1);return /^[a-zA-Z0-9_-]{16,512}$/.test(value)?value:''}}return ''}
function write(res,token,expires){if(!/^[a-zA-Z0-9_-]{16,512}$/.test(token||''))return;const seconds=Math.max(0,Math.min(43200,Math.floor((Date.parse(expires)-Date.now())/1000)));if(!Number.isFinite(seconds)||seconds<=0)return;res.setHeader('Set-Cookie',NAME+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+seconds)}
function clear(res){res.setHeader('Set-Cookie',NAME+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')}
function sameOrigin(req){const site=String(req.headers['sec-fetch-site']||'');if(site&&site!=='same-origin'&&site!=='none')return false;const origin=req.headers.origin;if(!origin)return true;try{var publicOrigin=process.env.APP360_PUBLIC_ORIGIN;if(publicOrigin){var canonical=new URL(publicOrigin);return canonical.origin===publicOrigin&&canonical.protocol==='https:'&&new URL(origin).origin===publicOrigin}return new URL(origin).host===req.headers.host&&new URL(origin).protocol==='https:'}catch(_){return false}}
module.exports={read,write,clear,sameOrigin};
