'use strict';
exports.up=async db=>{
 await db.schema.alterTable('identity_sessions',t=>t.index(['user_id','status','expires_at'],'school_session_valid_idx'));
 await db.schema.alterTable('account_members',t=>t.index(['user_id','account_id'],'school_user_accounts_idx'));
 await db.schema.alterTable('reels_bridge_outbox',t=>t.index(['created_at'],'school_bridge_retry_idx'));
 await db.schema.alterTable('content_items',t=>t.index(['owner_user_id','app_id','updated_at'],'school_content_updated_idx'));
};
exports.down=async db=>{for(const [table,name] of [['identity_sessions','school_session_valid_idx'],['account_members','school_user_accounts_idx'],['reels_bridge_outbox','school_bridge_retry_idx'],['content_items','school_content_updated_idx']])await db.schema.alterTable(table,t=>t.dropIndex([],name));};
