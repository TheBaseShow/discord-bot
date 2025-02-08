const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determine the absolute path for the database file
const dbPath = path.resolve(__dirname, 'game.db');

// Open the database. It will be created if it doesn't exist.
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at', dbPath);
});

// Initialize the database schema
db.serialize(() => {
  // Table for storing known guilds
  db.run(`CREATE TABLE IF NOT EXISTS guilds (
    guild_id TEXT PRIMARY KEY
  )`);

  // Table for active contests with additional column for button message ID
  db.run(`CREATE TABLE IF NOT EXISTS contests (
    contest_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    contest_channel_id TEXT NOT NULL,
    button_message_id TEXT,
    title TEXT,
    description TEXT,
    entry_fee INTEGER,
    deadline DATETIME
  )`);

  // Table for submission threads
  db.run(`CREATE TABLE IF NOT EXISTS threads (
    thread_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL
  )`);

  // Table for submissions with an additional nullable column for score
  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating submissions table:', err.message);
    } else {
      console.log('Database initialized successfully with updated schema.');
    }
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  }
});
