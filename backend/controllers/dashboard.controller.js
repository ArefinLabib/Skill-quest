import pool from "../config/db.js";

/**
 * XP rules: simple mapping of points per action and level thresholds.
 * Adjust as you like.
 */
const XP_FOR_ACTION = {
  completed_module: 25,
  completed_project: 100,
  started_module: 5,
  viewed_resource: 1,
  completed_resource: 3,
};

// level thresholds (total XP required to reach that level)
const LEVEL_THRESHOLDS = [
  0, 
  200,  
  500,  
  1000, 
  2000  
];

// compute level from xp_total
function computeLevelFromXp(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1; 
      break;
    }
  }
  return level;
}

/**
 * body: { action: 'enrolled_project'|'completed_project'|..., projectId?, moduleId?, metadata? }
 * Logs an activity, updates streak and awards xp.
 */
/**
 * GET /api/user/profile
 * Returns basic user information including role
 */
export const getUserProfile = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [userRows] = await pool.execute(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRows[0];
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Server error fetching user profile" });
  }
};

/**
 * body: { action: 'enrolled_project'|'completed_project'|..., projectId?, moduleId?, metadata? }
 * Logs an activity, updates streak and awards xp.
 */
export const logActivity = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { action, projectId = null, moduleId = null, metadata = null } = req.body;
  if (!action) return res.status(400).json({ message: "Action is required" });

  try {
    // 1) Insert activity log
    await pool.execute(
      `INSERT INTO user_activity (user_id, action, project_id, module_id, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, projectId, moduleId, metadata ? JSON.stringify(metadata) : null]
    );

    // 2) Award XP based on action
    const xpGain = XP_FOR_ACTION[action] || 0;
    if (xpGain > 0) {
      const [xpRows] = await pool.execute(
        `SELECT xp_total, level FROM user_xp WHERE user_id = ?`,
        [userId]
      );

      if (xpRows.length === 0) {
        const newTotal = xpGain;
        const newLevel = computeLevelFromXp(newTotal);
        await pool.execute(
          `INSERT INTO user_xp (user_id, xp_total, level, last_level_up_at)
           VALUES (?, ?, ?, ?)`,
          [userId, newTotal, newLevel, newLevel > 1 ? new Date() : null]
        );
      } else {
        const cur = xpRows[0];
        const newTotal = Number(cur.xp_total) + xpGain;
        const newLevel = computeLevelFromXp(newTotal);

        if (newLevel !== Number(cur.level)) {
          await pool.execute(
            `UPDATE user_xp SET xp_total = ?, level = ?, last_level_up_at = ? WHERE user_id = ?`,
            [newTotal, newLevel, new Date(), userId]
          );
        } else {
          await pool.execute(
            `UPDATE user_xp SET xp_total = ? WHERE user_id = ?`,
            [newTotal, userId]
          );
        }
      }
    }

    return res.json({ message: "Activity logged", xpAwarded: xpGain });
  } catch (err) {
    console.error("logActivity error:", err);
    return res.status(500).json({ message: "Server error logging activity" });
  }
};

/**
 * GET /api/user/dashboard
 * Returns aggregated analytics for the current user:
 * - counts (enrolled, completed, in_progress)
 * - completion rate
 * - avg time per completed project (days)
 * - activity series last 30 days
 * - xp and level
 * - streaks
 */
export const getDashboard = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const conn = pool;

    // 1) total enrolled
    const [[{ total_enrolled }]] = await conn.execute(
      `SELECT COUNT(*) AS total_enrolled FROM user_projects WHERE user_id = ?`,
      [userId]
    );

    // 2) status breakdown
    const [statusRows] = await conn.execute(
      `SELECT status, COUNT(*) AS count FROM user_projects WHERE user_id = ? GROUP BY status`,
      [userId]
    );
    const statusCounts = { in_progress: 0, completed: 0 };
    statusRows.forEach(r => { statusCounts[r.status] = Number(r.count); });

    // 3) completion rate
    const completed = statusCounts.completed || 0;
    const completionRate = total_enrolled > 0 ? Math.round((completed / total_enrolled) * 100) : 0;

    // 4) average time per completed project (in days)
    const [[{ avg_days }]] = await conn.execute(
      `SELECT AVG(DATEDIFF(completion_date, start_date)) AS avg_days
       FROM user_projects
       WHERE user_id = ? AND status = 'completed' AND completion_date IS NOT NULL AND start_date IS NOT NULL`,
      [userId]
    );

    // 5) activity series for last 30 days (group by day)
    const [activitySeriesRows] = await conn.execute(
      `SELECT DATE(created_at) AS day, COUNT(*) AS actions
       FROM user_activity
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY day
       ORDER BY day ASC`,
      [userId]
    );
    // normalize series into array of { day: 'YYYY-MM-DD', actions: n } (frontend can fill gaps)
    const activitySeries = activitySeriesRows.map(r => ({ day: r.day, actions: Number(r.actions) }));

    // 6) xp and level
    const [xpRows] = await conn.execute(`SELECT xp_total, level FROM user_xp WHERE user_id = ?`, [userId]);
    const xpData = xpRows.length ? { xp_total: Number(xpRows[0].xp_total), level: Number(xpRows[0].level) } : { xp_total: 0, level: 1 };
    // Add XP to next level
    const currentLevelIndex = xpData.level - 1;
    const xpToNextLevel = currentLevelIndex < LEVEL_THRESHOLDS.length - 1 
      ? LEVEL_THRESHOLDS[currentLevelIndex + 1] - xpData.xp_total 
      : 0; // 0 if max level

    // 7) streaks
    const [stRows] = await conn.execute(`SELECT current_streak, best_streak, last_active_date FROM user_streaks WHERE user_id = ?`, [userId]);
    const streakData = stRows.length ? {
      current_streak: Number(stRows[0].current_streak),
      best_streak: Number(stRows[0].best_streak),
      last_active_date: stRows[0].last_active_date ? stRows[0].last_active_date.toISOString().slice(0,10) : null
    } : { current_streak: 0, best_streak: 0, last_active_date: null };

    // 8) quick counts for UI
    const dashboard = {
      total_enrolled: Number(total_enrolled) || 0,
      statusCounts,
      completionRate,
      avg_days: avg_days === null ? null : Number(avg_days),
      activitySeries,
      xp: { ...xpData, xp_to_next_level: xpToNextLevel }, // Include XP to next level
      streaks: streakData
    };

    return res.json(dashboard);

  } catch (err) {
    console.error("getDashboard error:", err);
    return res.status(500).json({ message: "Server error fetching dashboard" });
  }
};

