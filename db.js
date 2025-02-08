const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determine the absolute path for the database file (game.db at the root directory)
const dbPath = path.resolve(__dirname, 'game.db');

// Open the database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Function to add a guild to the database
function addGuild(guildId) {
  const sql = `INSERT OR IGNORE INTO guilds (guild_id) VALUES (?)`;
  db.run(sql, [guildId], function(err) {
    if (err) {
      console.error('Error adding guild:', err.message);
    } else {
      console.log(`Guild ${guildId} added or already exists.`);
    }
  });
}

// Function to add a contest to the database
function addContest(contestId, guildId, contestChannelId, title, description, entryFee, deadline) {
  const sql = `INSERT OR IGNORE INTO contests (contest_id, guild_id, contest_channel_id, title, description, entry_fee, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [contestId, guildId, contestChannelId, title, description, entryFee, deadline], function(err) {
    if (err) {
      console.error('Error adding contest:', err.message);
    } else {
      console.log(`Contest ${contestId} for guild ${guildId} added or already exists.`);
    }
  });
}

// Function to add a thread to the database
function addThread(threadId, userId) {
  const sql = `INSERT OR IGNORE INTO threads (thread_id, user_id) VALUES (?, ?)`;
  db.run(sql, [threadId, userId], function(err) {
    if (err) {
      console.error('Error adding thread:', err.message);
    } else {
      console.log(`Thread ${threadId} for user ${userId} added or already exists.`);
    }
  });
}

// Function to add a submission record to the database
function addSubmission(threadId, userId, content) {
  const sql = `INSERT INTO submissions (thread_id, user_id, content) VALUES (?, ?, ?)`;
  db.run(sql, [threadId, userId, content], function(err) {
    if (err) {
      console.error('Error adding submission:', err.message);
    } else {
      console.log(`Submission added in thread ${threadId} by user ${userId}.`);
    }
  });
}

// Function to get a contest by channel
function getContestByChannel(contestChannelId, callback) {
  const sql = 'SELECT * FROM contests WHERE contest_channel_id = ?';
  db.get(sql, [contestChannelId], (err, row) => {
    if (err) {
      console.error('Error getting contest:', err.message);
      return callback(err);
    } else {
      return callback(null, row);
    }
  });
}

// Function to update a contest's button message
function updateContestButtonMessage(contestId, messageId) {
  const sql = 'UPDATE contests SET button_message_id = ? WHERE contest_id = ?';
  db.run(sql, [messageId, contestId], function(err) {
    if (err) {
      console.error('Error updating contest button message:', err.message);
    } else {
      console.log(`Contest ${contestId} updated with button message id ${messageId}`);
    }
  });
}

// Function to get the latest submission for a thread
function getLatestSubmission(threadId, callback) {
  const sql = `SELECT content FROM submissions WHERE thread_id = ? ORDER BY ROWID DESC LIMIT 1`;
  db.get(sql, [threadId], (err, row) => {
    if (err) {
      console.error('Error retrieving latest submission:', err.message);
      return callback(err);
    }
    if (row) {
      return callback(null, row.content);
    } else {
      return callback(null, '');
    }
  });
}

// Function to get a thread record by user id
function getThreadByUser(userId, callback) {
  const sql = `SELECT thread_id FROM threads WHERE user_id = ? LIMIT 1`;
  db.get(sql, [userId], (err, row) => {
    if (err) {
      console.error('Error retrieving thread by user:', err.message);
      return callback(err);
    }
    return callback(null, row);
  });
}

module.exports = {
  addGuild,
  addContest,
  addThread,
  addSubmission,
  getContestByChannel,
  updateContestButtonMessage,
  getLatestSubmission,
  getThreadByUser
};
