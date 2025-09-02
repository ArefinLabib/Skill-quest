import pool from "../config/db.js"

export const getRecommendations = async (req, res) => {
    const userId = req.user.id;
    try {
        const [userGoals] = await pool.execute("SELECT goal_id FROM user_goals WHERE user_id = ?", [userId]);
        const goals = userGoals.map(goal => goal.goal_id);

        // Step 2: Fetch user skills and levels
        const [userSkills] = await pool.query(
            'SELECT skill_id, level FROM user_skills WHERE user_id = ?',
            [userId]
        );

        const userSkillMap = {};
        for (let i = 0; i < userSkills.length; i++) {
            userSkillMap[userSkills[i].skill_id] = userSkills[i].level;
        }

        let recommendations = [];

        // If user has goals and skills, try the complex algorithm
        if (goals.length > 0 && userSkills.length > 0) {
            // Step 3: Find projects related to user goals via skills
            const [projectCandidates] = await pool.query(
                `
                SELECT p.id, p.name, p.description, p.difficulty, ps.skill_id, ps.required_level
                FROM projects p
                JOIN project_skills ps ON p.id = ps.project_id
                JOIN goal_skills gs ON ps.skill_id = gs.skill_id
                JOIN user_goals ug ON gs.goal_id = ug.goal_id
                WHERE ug.user_id = ?
                GROUP BY p.id, p.name, p.description, p.difficulty, ps.skill_id, ps.required_level
                `,
                [userId]
            );

            console.log("Project Candidates:", projectCandidates);

            // Step 4: Filter and score projects
            const processedProjects = new Set();

            for (const candidate of projectCandidates) {
                const projectId = candidate.id;
                if (processedProjects.has(projectId)) continue;

                const projectSkills = projectCandidates.filter(p => p.id === projectId);
                let isSuitable = true;
                let score = 0;

                for (const skill of projectSkills) {
                    const userLevel = userSkillMap[skill.skill_id] || 0;
                    if (userLevel < skill.required_level) {
                        isSuitable = false;
                        break;
                    }
                    score += userLevel - skill.required_level + 1;
                }

                if (isSuitable) {
                    recommendations.push({
                        id: projectId,
                        name: candidate.name,
                        description: candidate.description,
                        difficulty: candidate.difficulty,   
                        score: score,
                    });
                    processedProjects.add(projectId);
                }
            }
        }

        // If no recommendations found or user has no goals/skills, provide fallback recommendations
        if (recommendations.length === 0) {
            console.log("No personalized recommendations found, providing fallback recommendations");
            
            // Get all available projects as fallback
            const [fallbackProjects] = await pool.query(
                `SELECT p.id, p.name, p.description, p.difficulty
                 FROM projects p
                 ORDER BY p.difficulty ASC, p.name ASC
                 LIMIT 5`
            );

            recommendations = fallbackProjects.map(project => ({
                id: project.id,
                name: project.name,
                description: project.description,
                difficulty: project.difficulty,
                score: 1, // Default score for fallback
            }));
        }

        console.log("Final Recommendations:", recommendations);

        // Step 5: Sort and limit recommendations
        recommendations.sort((a, b) => b.score - a.score);
        const topRecommendations = recommendations.slice(0, 5);
        console.log("Top Recommendations:", topRecommendations);
        res.json({ recommendations: topRecommendations });

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Error fetching recommendations' });
    }
};

export const enrollInProject = async (req, res) => {
    const userId = req.user.id;
    const { projectId } = req.params;

    try {
        // Check if already enrolled
        const [existing] = await pool.execute(   
            "SELECT * FROM user_projects WHERE user_id = ? AND project_id = ?",
            [userId, projectId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Already enrolled in this project" });
        }

        // Insert new enrollment
        await pool.execute( 
            "INSERT INTO user_projects (user_id, project_id, status, start_date) VALUES (?, ?, 'in_progress', CURDATE())",
            [userId, projectId]
        );

        res.json({ message: "Enrolled successfully!" });
    } catch (err) {
        console.error("Error enrolling in project:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET USER PROJECTS
export const getUserProjects = async (req, res) => {
    const userId = req.user.id;

    try {
        const [projects] = await pool.execute(  
            `SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.difficulty, 
                up.status, 
                up.start_date, 
                up.completion_date
             FROM user_projects up
             JOIN projects p ON up.project_id = p.id
             WHERE up.user_id = ?
             ORDER BY up.start_date DESC`,
            [userId]
        );

        res.json({ myProjects: projects });
    } catch (err) {
        console.error("Error fetching user projects:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const markProjectComplete = async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.params;

  try {
    // Ensure the user is enrolled in the project
    const [rows] = await pool.execute(
      "SELECT * FROM user_projects WHERE user_id = ? AND project_id = ?",
      [userId, projectId]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not enrolled in this project" });
    }

    // Update status to completed
    await pool.execute(
      `UPDATE user_projects
       SET status = 'completed', completion_date = CURDATE()
       WHERE user_id = ? AND project_id = ?`,
      [userId, projectId]
    );

    res.json({ message: "Project marked as complete", projectId });
  } catch (err) {
    console.error("Error marking project complete:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllProjects = async (req, res) => {
    try {
        const [projects] = await pool.execute(
            `SELECT p.id AS project_id, p.name AS project_name, p.description, p.difficulty, g.id AS goal_id, g.name AS goal_name
                FROM 
                projects p
                LEFT JOIN 
                project_goals pg ON p.id = pg.project_id
                LEFT JOIN 
                goals g ON pg.goal_id = g.id`)
            console.log(projects);
            
        res.json({projects});
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
}