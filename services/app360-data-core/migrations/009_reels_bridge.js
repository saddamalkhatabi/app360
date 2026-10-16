'use strict';
exports.up=async function(k){
 await k.schema.createTable('reels_bridge_sessions',function(t){t.string('session_id',96).primary().references('id').inTable('identity_sessions').onDelete('CASCADE');t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.text('grant_cipher').notNullable();t.timestamp('expires_at').notNullable();t.timestamp('created_at').notNullable().defaultTo(k.fn.now());t.index(['user_id','expires_at']);});
 await k.schema.createTable('reels_bridge_outbox',function(t){t.string('id',64).primary();t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.text('batch_json').notNullable();t.integer('attempts').notNullable().defaultTo(0);t.timestamp('created_at').notNullable().defaultTo(k.fn.now());t.index(['user_id','created_at']);});
};
exports.down=async function(k){await k.schema.dropTable('reels_bridge_outbox');await k.schema.dropTable('reels_bridge_sessions');};
