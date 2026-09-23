'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('accounts',function(t){
    t.string('id',64).primary();t.string('type',32).notNullable();t.string('name',160).notNullable();t.string('status',24).notNullable().defaultTo('active');t.text('metadata_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('users',function(t){
    t.string('id',64).primary();t.string('display_name',160).notNullable();t.string('role',32).notNullable();t.string('age_band',24);t.string('status',24).notNullable().defaultTo('active');t.text('preferences_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('account_members',function(t){
    t.string('account_id',64).notNullable().references('id').inTable('accounts').onDelete('CASCADE');t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.string('relationship',32).notNullable();t.string('permissions_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.primary(['account_id','user_id']);
  });
  await knex.schema.createTable('external_identities',function(t){
    t.increments('id').primary();t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.string('source',64).notNullable();t.string('external_user_id',160).notNullable();t.string('sync_status',24).notNullable().defaultTo('seed-local');t.timestamp('last_synced_at');t.text('metadata_json');t.unique(['source','external_user_id']);t.index(['user_id','source']);
  });
};
exports.down=async function(knex){await knex.schema.dropTableIfExists('external_identities');await knex.schema.dropTableIfExists('account_members');await knex.schema.dropTableIfExists('users');await knex.schema.dropTableIfExists('accounts')};
