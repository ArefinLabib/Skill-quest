const db = require('../db/connection');

// GET /api/challenges/daily
exports.getDailyChallenge = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM daily_challenges WHERE date = CURDATE()'
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No challenge found for today' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load challenge' });
  }
};

// POST /api/challenges/submit
exports.submitChallenge = async (req, res) => {
  const { challenge_id, answer, response_time } = req.body;
  const userId = req.user.id;

  try {
    const [[challenge]] = await db.query(
      'SELECT correct_answer FROM daily_challenges WHERE id = ?',
      [challenge_id]
    );

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const isCorrect = challenge.correct_answer === answer;

    await db.query(
      'INSERT INTO challenge_submissions (user_id, challenge_id, answer, is_correct, response_time) VALUES (?, ?, ?, ?, ?)',
      [userId, challenge_id, answer, isCorrect, response_time]
    );

    res.json({ correct: isCorrect });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};
