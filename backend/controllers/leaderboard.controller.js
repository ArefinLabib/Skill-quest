const db = require('../db/connection');

// GET /api/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, 
             COUNT(cs.id) AS correct_answers,
             AVG(cs.response_time) AS avg_time
      FROM users u
      JOIN challenge_submissions cs ON cs.user_id = u.id
      WHERE cs.is_correct = TRUE
      GROUP BY u.id
      ORDER BY correct_answers DESC, avg_time ASC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
