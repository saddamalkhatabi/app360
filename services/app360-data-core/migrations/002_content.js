'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('applications',function(t){
    t.string('id',64).primary();t.string('slug',96).notNullable().unique();t.string('title_ar',200).notNullable();t.string('age_group',32).notNullable();t.string('status',24).notNullable().defaultTo('live');t.string('entry_path',300);t.text('capabilities_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('content_types',function(t){
    t.string('key',180).primary();t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');t.string('type_id',96).notNullable();t.string('label_ar',200).notNullable();t.integer('supports_images').notNullable().defaultTo(0);t.integer('supports_audio_script').notNullable().defaultTo(0);t.text('schema_json').notNullable();t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.unique(['app_id','type_id']);t.index(['app_id']);
  });
  await knex.schema.createTable('content_items',function(t){
    t.string('id',96).primary();t.string('app_id',64).notNullable().references('id').inTable('applications').onDelete('CASCADE');t.string('content_type',96).notNullable();t.string('owner_user_id',64).references('id').inTable('users').onDelete('SET NULL');t.string('title',240).notNullable();t.string('status',24).notNullable().defaultTo('draft');t.string('source_kind',32).notNullable().defaultTo('manual');t.integer('current_revision').notNullable().defaultTo(1);t.text('content_json').notNullable();t.text('tags_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());t.index(['app_id','content_type','status']);t.index(['owner_user_id']);
  });
  await knex.schema.createTable('content_revisions',function(t){
    t.increments('id').primary();t.string('content_item_id',96).notNullable().references('id').inTable('content_items').onDelete('CASCADE');t.integer('revision').notNullable();t.string('changed_by_user_id',64).references('id').inTable('users').onDelete('SET NULL');t.string('change_kind',32).notNullable().defaultTo('edit');t.text('content_json').notNullable();t.text('change_note');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.unique(['content_item_id','revision']);
  });
};
exports.down=async function(knex){await knex.schema.dropTableIfExists('content_revisions');await knex.schema.dropTableIfExists('content_items');await knex.schema.dropTableIfExists('content_types');await knex.schema.dropTableIfExists('applications')};
