import pool from "../config/db.js";

/**
 * GET /api/mentor/stats
 * Get quick stats for mentor home page
 */
export const getMentorStats = async (req, res) => {
    const userId = req.user?.id;
    
    try {
        // Get mentor's projects count
        const [projectCount] = await pool.execute(
            'SELECT COUNT(*) as total FROM projects WHERE created_by = ?',
            [userId]
        );

        // Get total students enrolled in mentor's projects
        const [studentCount] = await pool.execute(`
            SELECT COUNT(DISTINCT up.user_id) as total
            FROM user_projects up
            JOIN projects p ON up.project_id = p.id
            WHERE p.created_by = ?
        `, [userId]);

        // Get modules count created by mentor
        const [moduleCount] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM skill_modules sm
            JOIN projects p ON sm.project_id = p.id
            WHERE p.created_by = ?
        `, [userId]);

        // Get resources count created by mentor
        const [resourceCount] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM learning_resources lr
            JOIN skill_modules sm ON lr.module_id = sm.id
            JOIN projects p ON sm.project_id = p.id
            WHERE p.created_by = ?
        `, [userId]);

        const stats = {
            totalProjects: projectCount[0]?.total || 0,
            totalStudents: studentCount[0]?.total || 0,
            totalModules: moduleCount[0]?.total || 0,
            totalResources: resourceCount[0]?.total || 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching mentor stats:', error);
        res.status(500).json({ message: 'Failed to fetch mentor stats' });
    }
};

/**
 * GET /api/mentor/dashboard
 * Get mentor dashboard overview with statistics
 */
export const getMentorDashboard = async (req, res) => {
    const userId = req.user?.id;
    
    try {
        // Get mentor's projects count
        const [projectCount] = await pool.execute(
            'SELECT COUNT(*) as total FROM projects WHERE created_by = ?',
            [userId]
        );

        // Get total students enrolled in mentor's projects
        const [studentCount] = await pool.execute(`
            SELECT COUNT(DISTINCT up.user_id) as total
            FROM user_projects up
            JOIN projects p ON up.project_id = p.id
            WHERE p.created_by = ?
        `, [userId]);

        // Get modules count created by mentor
        const [moduleCount] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM skill_modules sm
            JOIN projects p ON sm.project_id = p.id
            WHERE p.created_by = ?
        `, [userId]);

        // Get resources count created by mentor
        const [resourceCount] = await pool.execute(
            'SELECT COUNT(*) as total FROM learning_resources WHERE created_by = ?',
            [userId]
        );

        // Get recent projects
        const [recentProjects] = await pool.execute(`
            SELECT id, name, description, difficulty, created_at,
                   (SELECT COUNT(*) FROM user_projects WHERE project_id = projects.id) as enrolled_count
            FROM projects 
            WHERE created_by = ?
            ORDER BY created_at DESC 
            LIMIT 5
        `, [userId]);

        const dashboard = {
            stats: {
                total_projects: projectCount[0]?.total || 0,
                total_students: studentCount[0]?.total || 0,
                total_modules: moduleCount[0]?.total || 0,
                total_resources: resourceCount[0]?.total || 0
            },
            recent_projects: recentProjects
        };

        res.json(dashboard);
    } catch (error) {
        console.error('Error fetching mentor dashboard:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
};

/**
 * GET /api/mentor/projects
 * Get all projects created by the mentor
 */
export const getMentorProjects = async (req, res) => {
    const userId = req.user?.id;
    
    try {
        const [projects] = await pool.execute(`
            SELECT p.id, p.name, p.description, p.difficulty, p.created_at,
                   COUNT(DISTINCT up.user_id) as enrolled_count,
                   COUNT(DISTINCT sm.id) as modules_count
            FROM projects p
            LEFT JOIN user_projects up ON p.id = up.project_id
            LEFT JOIN skill_modules sm ON p.id = sm.project_id
            WHERE p.created_by = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [userId]);

        res.json(projects);
    } catch (error) {
        console.error('Error fetching mentor projects:', error);
        res.status(500).json({ message: 'Failed to fetch projects' });
    }
};

/**
 * POST /api/mentor/projects
 * Create a new project
 */
export const createProject = async (req, res) => {
    const userId = req.user?.id;
    const { title, description, difficulty_level, estimated_duration, xp_reward } = req.body;

    // Validation
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    if (!['Beginner', 'Intermediate', 'Advanced'].includes(difficulty_level)) {
        return res.status(400).json({ message: 'Invalid difficulty level' });
    }

    try {
        // Create project
        const [result] = await pool.execute(
            'INSERT INTO projects (name, description, difficulty, created_by) VALUES (?, ?, ?, ?)',
            [title, description, difficulty_level, userId]
        );

        const projectId = result.insertId;

        res.status(201).json({ 
            message: 'Project created successfully', 
            project_id: projectId,
            project: {
                id: projectId,
                name: title,
                description,
                difficulty: difficulty_level,
                created_by: userId
            }
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Failed to create project' });
    }
};

/**
 * PUT /api/mentor/projects/:projectId
 * Update a project
 */
export const updateProject = async (req, res) => {
    const userId = req.user?.id;
    const { projectId } = req.params;
    const { title, description, difficulty_level } = req.body;

    try {
        // Check if project belongs to mentor
        const [project] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND created_by = ?',
            [projectId, userId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Update project
        await pool.execute(
            'UPDATE projects SET name = ?, description = ?, difficulty = ? WHERE id = ?',
            [title, description, difficulty_level, projectId]
        );

        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Failed to update project' });
    }
};

/**
 * DELETE /api/mentor/projects/:projectId
 * Delete a project and all associated content
 */
export const deleteProject = async (req, res) => {
    const userId = req.user?.id;
    const { projectId } = req.params;

    try {
        // Check if project belongs to mentor
        const [project] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND created_by = ?',
            [projectId, userId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Delete project (CASCADE will handle related records)
        await pool.execute('DELETE FROM projects WHERE id = ?', [projectId]);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Failed to delete project' });
    }
};

/**
 * GET /api/mentor/projects/:projectId/modules
 * Get all modules for a specific project
 */
export const getProjectModules = async (req, res) => {
    const userId = req.user?.id;
    const { projectId } = req.params;

    try {
        // Check if project belongs to mentor
        const [project] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND created_by = ?',
            [projectId, userId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Get modules with resource count
        const [modules] = await pool.execute(`
            SELECT sm.id, sm.title, sm.description, sm.order_sequence, 
                   sm.estimated_hours, sm.difficulty, sm.is_optional,
                   COUNT(lr.id) as resource_count
            FROM skill_modules sm
            LEFT JOIN learning_resources lr ON sm.id = lr.module_id AND lr.is_approved = true
            WHERE sm.project_id = ?
            GROUP BY sm.id
            ORDER BY sm.order_sequence
        `, [projectId]);

        res.json(modules);
    } catch (error) {
        console.error('Error fetching project modules:', error);
        res.status(500).json({ message: 'Failed to fetch modules' });
    }
};

/**
 * POST /api/mentor/modules
 * Create a new module
 */
export const createModule = async (req, res) => {
    const userId = req.user?.id;
    const { project_id, title, description, order_index, xp_reward } = req.body;

    // Validation
    if (!title || !description || !project_id) {
        return res.status(400).json({ message: 'Title, description, and project_id are required' });
    }

    try {
        // Check if project belongs to mentor
        const [project] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND created_by = ?',
            [project_id, userId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Create module
        const [result] = await pool.execute(`
            INSERT INTO skill_modules (project_id, title, description, order_sequence, estimated_hours, difficulty) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [project_id, title, description, order_index || 1, 0, 'Beginner']);

        const moduleId = result.insertId;

        res.status(201).json({ 
            message: 'Module created successfully', 
            module_id: moduleId,
            module: {
                id: moduleId,
                title,
                description,
                order_index: order_index || 1,
                xp_reward: xp_reward || 0
            }
        });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ message: 'Failed to create module' });
    }
};

/**
 * PUT /api/mentor/modules/:moduleId
 * Update a module
 */
export const updateModule = async (req, res) => {
    const userId = req.user?.id;
    const { moduleId } = req.params;
    const { title, description, order_index, xp_reward } = req.body;

    try {
        // Check if module belongs to mentor's project
        const [module] = await pool.execute(`
            SELECT sm.id FROM skill_modules sm
            JOIN projects p ON sm.project_id = p.id
            WHERE sm.id = ? AND p.created_by = ?
        `, [moduleId, userId]);

        if (module.length === 0) {
            return res.status(404).json({ message: 'Module not found or unauthorized' });
        }

        // Update module
        await pool.execute(`
            UPDATE skill_modules 
            SET title = ?, description = ?, order_sequence = ?
            WHERE id = ?
        `, [title, description, order_index, moduleId]);

        res.json({ message: 'Module updated successfully' });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ message: 'Failed to update module' });
    }
};

/**
 * DELETE /api/mentor/modules/:moduleId
 * Delete a module
 */
export const deleteModule = async (req, res) => {
    const userId = req.user?.id;
    const { moduleId } = req.params;

    try {
        // Check if module belongs to mentor's project
        const [module] = await pool.execute(`
            SELECT sm.id FROM skill_modules sm
            JOIN projects p ON sm.project_id = p.id
            WHERE sm.id = ? AND p.created_by = ?
        `, [moduleId, userId]);

        if (module.length === 0) {
            return res.status(404).json({ message: 'Module not found or unauthorized' });
        }

        // Delete module (CASCADE will handle related records)
        await pool.execute('DELETE FROM skill_modules WHERE id = ?', [moduleId]);

        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(500).json({ message: 'Failed to delete module' });
    }
};

/**
 * GET /api/mentor/projects/:projectId/resources
 * Get all resources for a project
 */
export const getProjectResources = async (req, res) => {
    const userId = req.user?.id;
    const { projectId } = req.params;

    try {
        // Check if project belongs to mentor
        const [project] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND created_by = ?',
            [projectId, userId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Get resources
        const [resources] = await pool.execute(`
            SELECT lr.id, lr.title, lr.description, lr.url, lr.resource_type, lr.resource_category,
                   lr.difficulty_level, lr.estimated_duration, lr.order_sequence, lr.is_free,
                   lr.language, lr.rating, lr.vote_count, lr.is_approved, lr.created_at
            FROM learning_resources lr
            JOIN skill_modules sm ON lr.module_id = sm.id
            WHERE sm.project_id = ?
            ORDER BY lr.resource_category, lr.order_sequence
        `, [projectId]);

        res.json(resources);
    } catch (error) {
        console.error('Error fetching project resources:', error);
        res.status(500).json({ message: 'Failed to fetch resources' });
    }
};

/**
 * POST /api/mentor/resources
 * Create a new resource
 */
export const createResource = async (req, res) => {
    const userId = req.user?.id;
    const { project_id, title, type, url, description, duration } = req.body;

    // Validation
    if (!title || !type || !url) {
        return res.status(400).json({ message: 'Title, type, and URL are required' });
    }

    try {
        // Check if project belongs to mentor
        const [project] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND created_by = ?',
            [project_id, userId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Get first module for the project (or create one if none exists)
        let [modules] = await pool.execute(
            'SELECT id FROM skill_modules WHERE project_id = ? LIMIT 1',
            [project_id]
        );

        let moduleId;
        if (modules.length === 0) {
            // Create a default module
            const [moduleResult] = await pool.execute(`
                INSERT INTO skill_modules (project_id, title, description, order_sequence, difficulty) 
                VALUES (?, ?, ?, ?, ?)
            `, [project_id, 'Main Module', 'Default module for resources', 1, 'Beginner']);
            moduleId = moduleResult.insertId;
        } else {
            moduleId = modules[0].id;
        }

        // Create resource
        const [result] = await pool.execute(`
            INSERT INTO learning_resources 
            (module_id, title, description, url, resource_type, resource_category,
             difficulty_level, estimated_duration, order_sequence, is_free, language, created_by, is_approved)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
        `, [moduleId, title, description, url, type, 'core', 'Beginner', duration || 0, 1, true, 'en', userId]);

        res.status(201).json({ 
            message: 'Resource created successfully', 
            resource_id: result.insertId,
            resource: {
                id: result.insertId,
                title,
                type,
                url,
                description,
                duration: duration || 0
            }
        });
    } catch (error) {
        console.error('Error creating resource:', error);
        res.status(500).json({ message: 'Failed to create resource' });
    }
};

/**
 * PUT /api/mentor/resources/:resourceId
 * Update a resource
 */
export const updateResource = async (req, res) => {
    const userId = req.user?.id;
    const { resourceId } = req.params;
    const { title, type, url, description, duration } = req.body;

    try {
        // Check if resource belongs to mentor
        const [resource] = await pool.execute(`
            SELECT lr.id FROM learning_resources lr
            JOIN skill_modules sm ON lr.module_id = sm.id
            JOIN projects p ON sm.project_id = p.id
            WHERE lr.id = ? AND p.created_by = ?
        `, [resourceId, userId]);

        if (resource.length === 0) {
            return res.status(404).json({ message: 'Resource not found or unauthorized' });
        }

        // Update resource
        await pool.execute(`
            UPDATE learning_resources 
            SET title = ?, description = ?, url = ?, resource_type = ?, estimated_duration = ?, updated_at = NOW()
            WHERE id = ?
        `, [title, description, url, type, duration || 0, resourceId]);

        res.json({ message: 'Resource updated successfully' });
    } catch (error) {
        console.error('Error updating resource:', error);
        res.status(500).json({ message: 'Failed to update resource' });
    }
};

/**
 * DELETE /api/mentor/resources/:resourceId
 * Delete a resource
 */
export const deleteResource = async (req, res) => {
    const userId = req.user?.id;
    const { resourceId } = req.params;

    try {
        // Check if resource belongs to mentor
        const [resource] = await pool.execute(`
            SELECT lr.id FROM learning_resources lr
            JOIN skill_modules sm ON lr.module_id = sm.id
            JOIN projects p ON sm.project_id = p.id
            WHERE lr.id = ? AND p.created_by = ?
        `, [resourceId, userId]);

        if (resource.length === 0) {
            return res.status(404).json({ message: 'Resource not found or unauthorized' });
        }

        // Delete resource
        await pool.execute('DELETE FROM learning_resources WHERE id = ?', [resourceId]);

        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ message: 'Failed to delete resource' });
    }
};

/**
 * GET /api/mentor/projects/:projectId/analytics
 * Get analytics for a specific project
 */
export const getProjectAnalytics = async (req, res) => {
    const userId = req.user?.id;
    const { projectId } = req.params;

    try {
        // Check if project belongs to mentor
        const [project] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND created_by = ?',
            [projectId, userId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Get enrollment count
        const [enrollmentCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM user_projects WHERE project_id = ?',
            [projectId]
        );

        // Get completion count
        const [completionCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM user_projects WHERE project_id = ? AND status = "completed"',
            [projectId]
        );

        const enrollments = enrollmentCount[0]?.count || 0;
        const completions = completionCount[0]?.count || 0;
        const completionRate = enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0;

        res.json({
            enrollments,
            completions,
            completion_rate: completionRate
        });
    } catch (error) {
        console.error('Error fetching project analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

/**
 * GET /api/mentor/skills
 * Get all available skills for project/module creation
 */
export const getSkills = async (req, res) => {
    try {
        const [skills] = await pool.execute('SELECT id, name FROM skills ORDER BY name');
        res.json(skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ message: 'Failed to fetch skills' });
    }
};

/**
 * GET /api/mentor/goals
 * Get all available goals for project creation
 */
export const getGoals = async (req, res) => {
    try {
        const [goals] = await pool.execute('SELECT id, name FROM goals ORDER BY name');
        res.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ message: 'Failed to fetch goals' });
    }
};
