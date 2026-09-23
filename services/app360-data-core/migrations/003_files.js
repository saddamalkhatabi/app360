'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('files',function(t){
    t.string('id',96).primary();t.string('owner_user_id',64).references('id').inTable('users').onDelete('SET NULL');t.string('storage_kind',32).notNullable().defaultTo('filesystem');t.string('storage_path',500);t.string('original_name',255);t.string('mime_type',120);t.integer('byte_size');t.string('sha256',64);t.integer('width');t.integer('height');t.text('metadata_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.unique(['sha256','storage_path']);t.index(['owner_user_id']);
  });
  await knex.schema.createTable('content_file_links',function(t){
    t.increments('id').primary();t.string('content_item_id',96).notNullable().references('id').inTable('content_items').onDelete('CASCADE');t.string('file_id',96).notNullable().references('id').inTable('files').onDelete('CASCADE');t.string('purpose',64).notNullable().defaultTo('illustration');t.string('item_ref',120);t.integer('sort_order').notNullable().defaultTo(0);t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.unique(['content_item_id','file_id','purpose','item_ref']);t.index(['content_item_id']);
  });
};
exports.down=async function(knex){await knex.schema.dropTableIfExists('content_file_links');await knex.schema.dropTableIfExists('files')};
