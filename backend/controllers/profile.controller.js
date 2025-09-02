import pool from "../config/db.js";

export const getStudentProfile = async (req, res) => {
  const userId = req.user.id; // from authenticateToken middleware

  try {
    // Step 1: Get user info
    const [userRows] = await pool.execute(
      "SELECT id, name, email FROM users WHERE id = ? AND role = 'student'",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    const user = userRows[0];

    // Step 2: Get user goals
    const [goals] = await pool.execute(
      `SELECT g.id, g.name 
       FROM goals g
       JOIN user_goals ug ON g.id = ug.goal_id
       WHERE ug.user_id = ?`,
      [userId]
    );

    // Step 3: Get user skills
    const [skills] = await pool.execute(
      `SELECT s.id, s.name, us.level 
       FROM skills s
       JOIN user_skills us ON s.id = us.skill_id
       WHERE us.user_id = ?`,
      [userId]
    );

    // Step 4: Get project progress
    const [projects] = await pool.execute(
      `SELECT p.id, p.name, up.status, up.start_date, up.completion_date
       FROM projects p
       JOIN user_projects up ON p.id = up.project_id
       WHERE up.user_id = ?`,
      [userId]
    );

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      goals,
      skills,
      projects
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};
