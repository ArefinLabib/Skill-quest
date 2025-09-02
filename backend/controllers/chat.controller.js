const db = require('../db/connection');

// GET /api/projects/:projectId/chat
exports.getChatHistory = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM project_chat WHERE project_id = ? ORDER BY created_at ASC',
      [projectId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load chat history' });
  }
};

// POST /api/projects/:projectId/chat
exports.sendMessage = async (req, res) => {
  const { projectId } = req.params;
  const { message, is_mentor } = req.body;
  const userId = req.user.id; // Assumes authentication middleware

  try {
    await db.query(
      'INSERT INTO project_chat (project_id, user_id, message, is_mentor) VALUES (?, ?, ?, ?)',
      [projectId, userId, message, is_mentor || false]
    );
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};
