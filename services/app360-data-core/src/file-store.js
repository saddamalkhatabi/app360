'use strict';
var fs=require('fs');
var path=require('path');
var crypto=require('crypto');
function safeName(name){return String(name||'file').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^_+|_+$/g,'')||'file'}
function id(){return 'file-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function sha256(buf){return crypto.createHash('sha256').update(buf).digest('hex')}
function ensure(dir){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true})}
function createFileStore(opts){
  opts=opts||{};var root=opts.root||path.resolve(__dirname,'../var/uploads');ensure(root);
  async function putBuffer(db,ownerUserId,originalName,mimeType,buffer,meta){
    if(!Buffer.isBuffer(buffer))throw new Error('buffer required');
    var hash=sha256(buffer),existing=await db('files').where({sha256:hash}).first();
    if(existing&&existing.storage_path&&fs.existsSync(existing.storage_path))return existing;
    var ext=path.extname(originalName||'')||'';var fileId=id(),diskName=fileId+(ext?ext.toLowerCase():'');var target=path.join(root,safeName(diskName));
    fs.writeFileSync(target,buffer);
    var row={id:fileId,owner_user_id:ownerUserId||null,storage_kind:'filesystem',storage_path:target,original_name:safeName(originalName||diskName),mime_type:mimeType||'application/octet-stream',byte_size:buffer.length,sha256:hash,width:meta&&meta.width||null,height:meta&&meta.height||null,metadata_json:JSON.stringify(meta||{})};
    await db('files').insert(row);return await db('files').where({id:fileId}).first();
  }
  async function linkToContent(db,contentItemId,fileId,purpose,itemRef,sortOrder){
    var row={content_item_id:contentItemId,file_id:fileId,purpose:purpose||'illustration',item_ref:itemRef||null,sort_order:sortOrder||0};
    await db('content_file_links').insert(row).onConflict(['content_item_id','file_id','purpose','item_ref']).ignore();return row;
  }
  return {root:root,putBuffer:putBuffer,linkToContent:linkToContent};
}
module.exports={createFileStore:createFileStore,safeName:safeName};
