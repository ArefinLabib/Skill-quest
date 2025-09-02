import pool from "../config/db.js";

export const getResourcesForProject = async (req, res) => {
    const projectId = req.params.projectId;
    
    try {
        // Get all skills required for the project
        const [projectSkills] = await pool.execute(
            `SELECT skill_id FROM project_skills WHERE project_id = ?`,
            [projectId]
        );

        if (projectSkills.length === 0) {
            return res.json({ resources: [] });
        }

        const skillIds = projectSkills.map(skill => skill.skill_id);

        // Get resources for these skills
        const [resources] = await pool.execute(
            `SELECT r.*, s.name as skill_name 
             FROM resources r
             JOIN skills s ON r.skill_id = s.id
             WHERE r.skill_id IN (?)`,
            [skillIds]
        );

        // Group by skill
        const resourcesBySkill = {};
        resources.forEach(resource => {
            if (!resourcesBySkill[resource.skill_name]) {
                resourcesBySkill[resource.skill_name] = [];
            }
            resourcesBySkill[resource.skill_name].push({
                id: resource.id,
                title: resource.title,
                url: resource.url,
                type: resource.type,
                createdBy: resource.created_by
            });
        });

        res.json({ resources: resourcesBySkill });
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: 'Error fetching resources' });
    }
};

export const addResource = async (req, res) => {
    const { skillId, title, url, type } = req.body;
    const createdBy = req.user.id;

    try {
        await pool.execute(
            `INSERT INTO resources (skill_id, title, url, type, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [skillId, title, url, type, createdBy]
        );

        res.json({ message: 'Resource added successfully' });
    } catch (error) {
        console.error('Error adding resource:', error);
        res.status(500).json({ error: 'Error adding resource' });
    }
};
