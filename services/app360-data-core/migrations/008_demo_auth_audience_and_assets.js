'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('local_credentials',function(t){
    t.increments('id').primary();
    t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('username',120).notNullable().unique();
    t.string('pin_algo',24).notNullable().defaultTo('scrypt');
    t.string('pin_salt',160).notNullable();
    t.string('pin_hash',128).notNullable();
    t.string('status',24).notNullable().defaultTo('active');
    t.integer('is_demo').notNullable().defaultTo(0);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id','status']);
  });
  await knex.schema.createTable('content_audiences',function(t){
    t.string('content_item_id',96).notNullable().references('id').inTable('content_items').onDelete('CASCADE');
    t.string('target_user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('granted_by_user_id',64).references('id').inTable('users').onDelete('SET NULL');
    t.integer('can_edit').notNullable().defaultTo(0);
    t.string('status',24).notNullable().defaultTo('active');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.primary(['content_item_id','target_user_id']);
    t.index(['target_user_id','status']);
    t.index(['granted_by_user_id']);
  });
  await knex.schema.alterTable('content_items',function(t){
    t.string('audience_mode',24).notNullable().defaultTo('private');
  });
};
exports.down=async function(knex){
  await knex.schema.alterTable('content_items',function(t){t.dropColumn('audience_mode')});
  await knex.schema.dropTableIfExists('content_audiences');
  await knex.schema.dropTableIfExists('local_credentials');
};
