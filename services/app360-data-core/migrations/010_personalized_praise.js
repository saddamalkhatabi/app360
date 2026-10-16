'use strict';
exports.up=async function(db){
 await db.schema.createTable('feature_entitlements',function(t){t.string('id',96).primary();t.string('user_id',64).references('id').inTable('users').onDelete('CASCADE');t.string('account_id',64).references('id').inTable('accounts').onDelete('CASCADE');t.string('feature',64).notNullable();t.string('status',24).notNullable().defaultTo('inactive');t.timestamp('starts_at').notNullable();t.timestamp('expires_at').notNullable();t.string('source_ref',200).notNullable();t.timestamp('created_at').notNullable().defaultTo(db.fn.now());t.index(['user_id','feature','status']);t.index(['account_id','feature','status'])});
 await db.schema.createTable('celebration_tts_daily',function(t){t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.string('day',10).notNullable();t.integer('requests').notNullable().defaultTo(0);t.primary(['user_id','day'])});
};
exports.down=async function(db){await db.schema.dropTableIfExists('celebration_tts_daily');await db.schema.dropTableIfExists('feature_entitlements')};
