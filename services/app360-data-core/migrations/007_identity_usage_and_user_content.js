'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('identity_sessions',function(t){
    t.string('id',96).primary();
    t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('account_id',64).references('id').inTable('accounts').onDelete('SET NULL');
    t.string('source',64).notNullable().defaultTo('safe-reels-360');
    t.string('token_hash',64).notNullable().unique();
    t.string('external_session_ref',200);
    t.string('status',24).notNullable().defaultTo('active');
    t.timestamp('expires_at').notNullable();
    t.timestamp('last_seen_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id','status']);t.index(['expires_at']);
  });
  await knex.schema.createTable('app_usage_daily',function(t){
    t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');
    t.string('day',10).notNullable();
    t.integer('active_seconds').notNullable().defaultTo(0);
    t.integer('opens').notNullable().defaultTo(0);
    t.timestamp('last_seen_at');
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.primary(['user_id','app_id','day']);t.index(['user_id','day']);
  });
  await knex.schema.createTable('usage_receipts',function(t){
    t.string('id',220).primary();
    t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');
    t.string('batch_id',120).notNullable();
    t.string('occurred_day',10).notNullable();
    t.integer('active_seconds').notNullable().defaultTo(0);
    t.integer('opens').notNullable().defaultTo(0);
    t.string('device_id',120);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id','created_at']);t.index(['batch_id']);
  });
  await knex.schema.alterTable('content_items',function(t){
    t.string('client_key',220);
    t.string('visibility',24).notNullable().defaultTo('private');
    t.string('moderation_status',32).notNullable().defaultTo('not_submitted');
    t.string('origin_device_id',120);
    t.index(['owner_user_id','app_id','client_key'],'content_owner_client_idx');
  });
};
exports.down=async function(knex){
  await knex.schema.alterTable('content_items',function(t){t.dropIndex(['owner_user_id','app_id','client_key'],'content_owner_client_idx');t.dropColumn('origin_device_id');t.dropColumn('moderation_status');t.dropColumn('visibility');t.dropColumn('client_key')});
  await knex.schema.dropTableIfExists('usage_receipts');
  await knex.schema.dropTableIfExists('app_usage_daily');
  await knex.schema.dropTableIfExists('identity_sessions');
};
