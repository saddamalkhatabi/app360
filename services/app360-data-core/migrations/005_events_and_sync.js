'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('learning_sessions',function(t){
    t.string('id',96).primary();t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.string('account_id',64).references('id').inTable('accounts').onDelete('SET NULL');t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');t.string('plan_id',96);t.string('status',24).notNullable().defaultTo('started');t.timestamp('started_at').notNullable().defaultTo(knex.fn.now());t.timestamp('ended_at');t.text('context_json');t.index(['user_id','app_id','started_at']);
  });
  await knex.schema.createTable('learning_events',function(t){
    t.string('id',96).primary();t.string('session_id',96).references('id').inTable('learning_sessions').onDelete('CASCADE');t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');t.string('event_type',80).notNullable();t.string('content_item_id',96).references('id').inTable('content_items').onDelete('SET NULL');t.string('target_ref',160);t.text('payload_json');t.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());t.string('source_device_id',96);t.index(['user_id','occurred_at']);t.index(['app_id','event_type','occurred_at']);t.index(['session_id']);
  });
  await knex.schema.createTable('sync_outbox',function(t){
    t.string('id',96).primary();t.string('entity_type',64).notNullable();t.string('entity_id',160).notNullable();t.string('operation',24).notNullable();t.text('payload_json').notNullable();t.string('destination',80).notNullable().defaultTo('safe-reels-360');t.string('status',24).notNullable().defaultTo('pending');t.integer('attempts').notNullable().defaultTo(0);t.text('last_error');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());t.index(['status','destination','created_at']);
  });
};
exports.down=async function(knex){await knex.schema.dropTableIfExists('sync_outbox');await knex.schema.dropTableIfExists('learning_events');await knex.schema.dropTableIfExists('learning_sessions')};
