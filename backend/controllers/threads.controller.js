const db = require('../db/connection');

// GET /api/projects/:projectId/threads
exports.getThreads = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM discussion_threads WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load threads' });
  }
};

// POST /api/projects/:projectId/threads
exports.createThread = async (req, res) => {
  const { projectId } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id; // assumes auth middleware

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    await db.query(
      'INSERT INTO discussion_threads (project_id, user_id, title, content) VALUES (?, ?, ?, ?)',
      [projectId, userId, title, content]
    );
    res.status(201).json({ message: 'Thread created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create thread' });
  }
};
