const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'game.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at', dbPath);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS guilds (
    guild_id TEXT PRIMARY KEY
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    wallet_address TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS contests (
    contest_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    button_message_id TEXT,
    title TEXT,
    description TEXT,
    entry_fee INTEGER,
    deadline INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS threads (
    thread_id TEXT PRIMARY KEY,
    contest_id TEXT NOT NULL,
    user_id TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT,
    score INTEGER,
    created_at INTEGER
  )`, (err) => {
    if (err) {
      console.error('Error creating submissions table:', err.message);
    } else {
      console.log('Database initialized successfully with updated schema.');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  }
});
