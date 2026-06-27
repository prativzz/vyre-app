import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./vyre.db');

db.run("ALTER TABLE messages ADD COLUMN reply_to TEXT REFERENCES messages(id) ON DELETE SET NULL", function(err) {
  if (err) {
    console.error('❌ Error adding column:', err.message);
  } else {
    console.log('✅ reply_to column added successfully');
  }
  db.close();
});