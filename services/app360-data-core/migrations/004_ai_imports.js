'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('ai_generation_requests',function(t){
    t.string('id',96).primary();t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');t.string('requested_by_user_id',64).references('id').inTable('users').onDelete('SET NULL');t.string('content_type',96).notNullable();t.text('prompt_text').notNullable();t.text('options_json');t.string('provider_hint',80);t.string('status',24).notNullable().defaultTo('prompt-created');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('completed_at');t.index(['app_id','content_type','created_at']);
  });
  await knex.schema.createTable('ai_import_batches',function(t){
    t.string('id',96).primary();t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');t.string('imported_by_user_id',64).references('id').inTable('users').onDelete('SET NULL');t.string('generation_request_id',96).references('id').inTable('ai_generation_requests').onDelete('SET NULL');t.string('content_type',96).notNullable();t.string('title',240);t.integer('item_count').notNullable().defaultTo(0);t.integer('asset_count').notNullable().defaultTo(0);t.string('status',24).notNullable().defaultTo('draft');t.text('raw_bundle_json').notNullable();t.text('validation_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('reviewed_at');t.index(['app_id','content_type','status']);
  });
  await knex.schema.createTable('ai_import_errors',function(t){
    t.increments('id').primary();t.string('batch_id',96).references('id').inTable('ai_import_batches').onDelete('CASCADE');t.string('code',80).notNullable();t.string('item_ref',120);t.text('message').notNullable();t.text('details_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.index(['batch_id']);
  });
};
exports.down=async function(knex){await knex.schema.dropTableIfExists('ai_import_errors');await knex.schema.dropTableIfExists('ai_import_batches');await knex.schema.dropTableIfExists('ai_generation_requests')};
