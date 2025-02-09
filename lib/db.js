const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'game.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

function addGuild(guildId) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO guilds (guild_id) VALUES (?)`;
    db.run(sql, [guildId], function(err) {
      if (err) {
        console.error('Error adding guild:', err.message);
        reject(err);
      } else {
        console.log(`Guild ${guildId} added or already exists.`);
        resolve();
      }
    });
  });
}

function addContest(contestId, guildId, title, description, entryFee, deadline) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO contests (contest_id, guild_id, title, description, entry_fee, deadline) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [contestId, guildId, title, description, entryFee, deadline], function(err) {
      if (err) {
        console.error('Error adding contest:', err.message);
        reject(err);
      } else {
        console.log(`Contest ${contestId} for guild ${guildId} added or already exists.`);
        resolve();
      }
    });
  });
}

function addThread(threadId, channelId, userId) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO threads (thread_id, contest_id, user_id) VALUES (?, ?, ?)`;
    db.run(sql, [threadId, channelId, userId], function(err) {
      if (err) {
        console.error('Error adding thread:', err.message);
        reject(err);
      } else {
        console.log(`Thread ${threadId} for user ${userId} added or already exists.`);
        resolve();
      }
    });
  });
}

function addSubmission(threadId, userId, content) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO submissions (thread_id, user_id, content) VALUES (?, ?, ?)`;
    db.run(sql, [threadId, userId, content], function(err) {
      if (err) {
        console.error('Error adding submission:', err.message);
        reject(err);
      } else {
        console.log(`Submission added in thread ${threadId} by user ${userId}.`);
        resolve();
      }
    });
  });
}

function getContestByChannel(contestChannelId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM contests WHERE contest_channel_id = ?';
    db.get(sql, [contestChannelId], (err, row) => {
      if (err) {
        console.error('Error getting contest:', err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function updateContestButtonMessage(contestId, messageId) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE contests SET button_message_id = ? WHERE contest_id = ?';
    db.run(sql, [messageId, contestId], function(err) {
      if (err) {
        console.error('Error updating contest button message:', err.message);
        reject(err);
      } else {
        console.log(`Contest ${contestId} updated with button message id ${messageId}`);
        resolve();
      }
    });
  });
}

function getLatestSubmission(threadId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT content FROM submissions WHERE thread_id = ? ORDER BY ROWID DESC LIMIT 1`;
    db.get(sql, [threadId], (err, row) => {
      if (err) {
        console.error('Error retrieving latest submission:', err.message);
        reject(err);
      } else {
        resolve(row ? row.content : '');
      }
    });
  });
}

function getThreadByUser(userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT thread_id FROM threads WHERE user_id = ? LIMIT 1`;
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error retrieving thread by user:', err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function addUser(userId) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO users (user_id) VALUES (?)`;
    db.run(sql, [userId], function(err) {
      if (err) {
        console.error('Error adding user:', err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function updateUserWallet(userId, walletAddress) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE users SET wallet_address = ? WHERE user_id = ?`;
    db.run(sql, [walletAddress, userId], function(err) {
      if (err) {
        console.error('Error updating wallet address:', err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getUserWallet(userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT wallet_address FROM users WHERE user_id = ?`;
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error getting wallet address:', err.message);
        reject(err);
      } else {
        resolve(row ? row.wallet_address : null);
      }
    });
  });
}

function getThreadByUserAndChannel(userId, channelId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT thread_id
      FROM threads
      WHERE user_id = ?
      AND contest_id = ?
    `;
    db.get(sql, [userId, channelId], (err, row) => {
      if (err) {
        console.error('Error checking user contest registration:', err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
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
  getThreadByUser,
  getThreadByUserAndChannel,
  addUser,
  updateUserWallet,
  getUserWallet
};
