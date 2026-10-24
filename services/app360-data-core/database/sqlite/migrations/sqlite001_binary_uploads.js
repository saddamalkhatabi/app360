'use strict';
// Also available for explicit APP360_FILE_STORAGE=database on SQLite.
exports.up=async db=>{await db.schema.createTable('file_contents',t=>{t.string('file_id',96).primary().references('id').inTable('files').onDelete('CASCADE');t.binary('data').notNullable()});};
exports.down=async db=>{await db.schema.dropTableIfExists('file_contents')};
