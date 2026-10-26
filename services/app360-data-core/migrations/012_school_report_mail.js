'use strict';
exports.up=async k=>{
 await k.schema.createTable('school_report_preferences',t=>{t.string('owner_user_id',64).notNullable().references('id').inTable('users');t.string('child_user_id',64).notNullable().references('id').inTable('users');t.string('cadence',10).notNullable().defaultTo('off');t.string('next_at',32);t.primary(['owner_user_id','child_user_id']);t.index(['cadence','next_at']);});
 await k.schema.createTable('school_report_outbox',t=>{t.string('id',64).primary();t.string('dedupe_key',180).notNullable().unique();t.string('owner_user_id',64).notNullable();t.string('child_user_id',64).notNullable();t.string('subject',200).notNullable();t.text('html').notNullable();t.string('status',16).notNullable().defaultTo('pending');t.integer('attempts').notNullable().defaultTo(0);t.string('next_at',32).notNullable();t.string('lease_until',32);t.string('created_at',32).notNullable();t.string('sent_at',32);t.index(['status','next_at']);});
};
exports.down=async()=>{throw Error('Preserve School report preferences and mail delivery history using a verified backup.');};
