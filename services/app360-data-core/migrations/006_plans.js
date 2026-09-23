'use strict';
exports.up=async function(knex){
  await knex.schema.createTable('plans',function(t){
    t.string('id',96).primary();t.string('owner_user_id',64).references('id').inTable('users').onDelete('SET NULL');t.string('account_id',64).references('id').inTable('accounts').onDelete('SET NULL');t.string('age_group',32);t.string('age_band',32);t.string('title',240).notNullable();t.text('purpose');t.string('status',24).notNullable().defaultTo('active');t.integer('is_template').notNullable().defaultTo(0);t.string('source_kind',32).notNullable().defaultTo('manual');t.text('metadata_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());t.index(['owner_user_id','status']);t.index(['account_id','is_template']);
  });
  await knex.schema.createTable('plan_steps',function(t){
    t.string('id',96).primary();t.string('plan_id',96).notNullable().references('id').inTable('plans').onDelete('CASCADE');t.integer('position').notNullable();t.string('app_id',64).references('id').inTable('applications').onDelete('SET NULL');t.string('route_level',32).notNullable().defaultTo('app');t.string('route_id',96);t.string('target_ref',200);t.string('label',240);t.text('href_relative');t.integer('duration_seconds');t.string('advance_mode',32).notNullable().defaultTo('manual');t.text('options_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.unique(['plan_id','position']);t.index(['plan_id','app_id']);
  });
  await knex.schema.createTable('plan_runs',function(t){
    t.string('id',96).primary();t.string('plan_id',96).notNullable().references('id').inTable('plans').onDelete('CASCADE');t.string('user_id',64).notNullable().references('id').inTable('users').onDelete('CASCADE');t.string('session_id',96).references('id').inTable('learning_sessions').onDelete('SET NULL');t.string('status',24).notNullable().defaultTo('running');t.integer('current_position').notNullable().defaultTo(0);t.timestamp('started_at').notNullable().defaultTo(knex.fn.now());t.timestamp('ended_at');t.text('context_json');t.index(['user_id','started_at']);t.index(['plan_id','status']);
  });
  await knex.schema.createTable('plan_step_results',function(t){
    t.string('id',96).primary();t.string('run_id',96).notNullable().references('id').inTable('plan_runs').onDelete('CASCADE');t.string('step_id',96).notNullable().references('id').inTable('plan_steps').onDelete('CASCADE');t.string('status',32).notNullable();t.string('launch_id',120);t.timestamp('opened_at');t.timestamp('completed_at');t.timestamp('returned_at');t.text('result_json');t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());t.unique(['run_id','step_id']);t.index(['run_id','status']);
  });
};
exports.down=async function(knex){await knex.schema.dropTableIfExists('plan_step_results');await knex.schema.dropTableIfExists('plan_runs');await knex.schema.dropTableIfExists('plan_steps');await knex.schema.dropTableIfExists('plans')};
