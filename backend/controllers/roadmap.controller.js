import pool from "../config/db.js";

/**
 * GET /api/projects/:projectId/roadmap
 * Get the complete roadmap for a project with user progress
 */
export const getProjectRoadmap = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Get project basic info
        const [projectRows] = await pool.execute(
            "SELECT id, name, description, difficulty FROM projects WHERE id = ?",
            [projectId]
        );

        if (projectRows.length === 0) {
            return res.status(404).json({ message: "Project not found" });
        }

        const project = projectRows[0];

        // 2. Get all modules for this project with user progress
        const [moduleRows] = await pool.execute(`
            SELECT 
                sm.id,
                sm.title,
                sm.description,
                sm.order_sequence,
                sm.estimated_hours,
                sm.difficulty,
                sm.is_optional,
                ump.status,
                ump.progress_percentage,
                ump.started_at,
                ump.completed_at,
                ump.time_spent_minutes,
                ump.notes,
                COUNT(lr.id) as total_resources,
                COUNT(CASE WHEN uri.interaction_type = 'completed' THEN 1 END) as completed_resources
            FROM skill_modules sm
            LEFT JOIN user_module_progress ump ON sm.id = ump.module_id AND ump.user_id = ?
            LEFT JOIN learning_resources lr ON sm.id = lr.module_id AND lr.is_approved = TRUE
            LEFT JOIN user_resource_interactions uri ON lr.id = uri.resource_id AND uri.user_id = ?
            WHERE sm.project_id = ?
            GROUP BY sm.id, ump.user_id, ump.module_id
            ORDER BY sm.order_sequence ASC
        `, [userId, userId, projectId]);

        // 3. Get prerequisites for each module
        const [prereqRows] = await pool.execute(`
            SELECT 
                mp.module_id,
                mp.prerequisite_module_id,
                mp.is_strict,
                sm.title as prerequisite_title
            FROM module_prerequisites mp
            JOIN skill_modules sm ON mp.prerequisite_module_id = sm.id
            WHERE mp.module_id IN (SELECT id FROM skill_modules WHERE project_id = ?)
        `, [projectId]);

        // 4. Get skills for each module
        const [skillRows] = await pool.execute(`
            SELECT 
                ms.module_id,
                ms.skill_id,
                ms.target_level,
                ms.is_primary,
                ms.weight,
                s.name as skill_name,
                us.level as user_current_level
            FROM module_skills ms
            JOIN skills s ON ms.skill_id = s.id
            LEFT JOIN user_skills us ON s.id = us.skill_id AND us.user_id = ?
            WHERE ms.module_id IN (SELECT id FROM skill_modules WHERE project_id = ?)
        `, [userId, projectId]);

        // 5. Organize data into roadmap structure
        const modules = moduleRows.map(module => {
            const prerequisites = prereqRows
                .filter(p => p.module_id === module.id)
                .map(p => ({
                    id: p.prerequisite_module_id,
                    title: p.prerequisite_title,
                    is_strict: p.is_strict
                }));

            const skills = skillRows
                .filter(s => s.module_id === module.id)
                .map(s => ({
                    id: s.skill_id,
                    name: s.skill_name,
                    target_level: s.target_level,
                    user_current_level: s.user_current_level || 0,
                    is_primary: s.is_primary,
                    weight: parseFloat(s.weight)
                }));

            return {
                ...module,
                status: module.status || 'not_started',
                progress_percentage: module.progress_percentage || 0,
                prerequisites,
                skills,
                is_unlocked: checkModuleUnlocked(module.id, prerequisites, moduleRows)
            };
        });

        // 6. Calculate overall progress
        const totalModules = modules.length;
        const completedModules = modules.filter(m => m.status === 'completed').length;
        const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        const roadmap = {
            project,
            modules,
            stats: {
                total_modules: totalModules,
                completed_modules: completedModules,
                overall_progress: overallProgress,
                estimated_total_hours: modules.reduce((sum, m) => sum + (m.estimated_hours || 0), 0)
            }
        };

        res.json(roadmap);

    } catch (error) {
        console.error("Error fetching project roadmap:", error);
        res.status(500).json({ message: "Failed to fetch project roadmap" });
    }
};

/**
 * GET /api/modules/:moduleId/resources
 * Get all learning resources for a specific module
 */
export const getModuleResources = async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user?.id;

    try {
        // Get resources with user interaction data
        const [resourceRows] = await pool.execute(`
            SELECT 
                lr.id,
                lr.title,
                lr.description,
                lr.url,
                lr.resource_type,
                lr.resource_category,
                lr.difficulty_level,
                lr.estimated_duration,
                lr.order_sequence,
                lr.is_free,
                lr.language,
                lr.rating,
                lr.vote_count,
                uri.interaction_type as user_interaction,
                uri.rating as user_rating,
                uri.time_spent_minutes as user_time_spent,
                uri.created_at as interaction_date
            FROM learning_resources lr
            LEFT JOIN user_resource_interactions uri ON lr.id = uri.resource_id AND uri.user_id = ?
            WHERE lr.module_id = ? AND lr.is_approved = TRUE
            ORDER BY lr.resource_category, lr.order_sequence
        `, [userId, moduleId]);

        // Group resources by category
        const resourcesByCategory = {
            prerequisite: [],
            core: [],
            practice: [],
            assessment: [],
            supplementary: []
        };

        resourceRows.forEach(resource => {
            const category = resource.resource_category;
            if (resourcesByCategory[category]) {
                resourcesByCategory[category].push({
                    ...resource,
                    user_interaction: resource.user_interaction || null,
                    user_rating: resource.user_rating || null,
                    user_time_spent: resource.user_time_spent || 0,
                    interaction_date: resource.interaction_date || null
                });
            }
        });

        res.json({ 
            module_id: parseInt(moduleId),
            resources: resourcesByCategory,
            total_count: resourceRows.length 
        });

    } catch (error) {
        console.error("Error fetching module resources:", error);
        res.status(500).json({ message: "Failed to fetch module resources" });
    }
};

/**
 * PUT /api/modules/:moduleId/progress
 * Update user progress for a specific module
 */
export const updateModuleProgress = async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user?.id;
    const { status, progress_percentage, notes, time_spent_minutes } = req.body;

    try {
        // Validate status
        const validStatuses = ['not_started', 'in_progress', 'completed', 'skipped'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Validate progress percentage
        if (progress_percentage !== undefined && (progress_percentage < 0 || progress_percentage > 100)) {
            return res.status(400).json({ message: "Progress percentage must be between 0 and 100" });
        }

        // Check if module exists
        const [moduleRows] = await pool.execute(
            "SELECT id FROM skill_modules WHERE id = ?",
            [moduleId]
        );

        if (moduleRows.length === 0) {
            return res.status(404).json({ message: "Module not found" });
        }

        // Update or insert progress record
        const now = new Date();
        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push("status = ?");
            values.push(status);

            if (status === 'in_progress') {
                updates.push("started_at = COALESCE(started_at, ?)");
                values.push(now);
            } else if (status === 'completed') {
                updates.push("completed_at = ?");
                values.push(now);
                updates.push("progress_percentage = 100");
            }
        }

        if (progress_percentage !== undefined) {
            updates.push("progress_percentage = ?");
            values.push(progress_percentage);
        }

        if (notes !== undefined) {
            updates.push("notes = ?");
            values.push(notes);
        }

        if (time_spent_minutes !== undefined) {
            updates.push("time_spent_minutes = time_spent_minutes + ?");
            values.push(time_spent_minutes);
        }

        updates.push("updated_at = ?");
        values.push(now);

        values.push(userId, moduleId);

        const query = `
            INSERT INTO user_module_progress (user_id, module_id, ${updates.join(', ')})
            VALUES (?, ?, ${updates.map(() => '?').join(', ')})
            ON DUPLICATE KEY UPDATE ${updates.join(', ')}
        `;

        await pool.execute(query, [userId, moduleId, ...values.slice(0, -2), ...values.slice(-2), ...values.slice(0, -2)]);

        // Log activity and award XP
        if (status === 'in_progress') {
            await logActivity(userId, 'started_module', null, moduleId);
        } else if (status === 'completed') {
            await logActivity(userId, 'completed_module', null, moduleId);
        }

        res.json({ message: "Module progress updated successfully" });

    } catch (error) {
        console.error("Error updating module progress:", error);
        res.status(500).json({ message: "Failed to update module progress" });
    }
};

/**
 * POST /api/resources/:resourceId/interact
 * Record user interaction with a learning resource
 */
export const recordResourceInteraction = async (req, res) => {
    const { resourceId } = req.params;
    const userId = req.user?.id;
    const { interaction_type, rating, feedback, time_spent_minutes } = req.body;

    try {
        // Validate interaction type
        const validTypes = ['viewed', 'completed', 'bookmarked', 'rated', 'reported'];
        if (!validTypes.includes(interaction_type)) {
            return res.status(400).json({ message: "Invalid interaction type" });
        }

        // Validate rating if provided
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        // Check if resource exists
        const [resourceRows] = await pool.execute(
            "SELECT id FROM learning_resources WHERE id = ?",
            [resourceId]
        );

        if (resourceRows.length === 0) {
            return res.status(404).json({ message: "Resource not found" });
        }

        // Insert interaction record
        await pool.execute(`
            INSERT INTO user_resource_interactions 
            (user_id, resource_id, interaction_type, rating, feedback, time_spent_minutes)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                rating = COALESCE(VALUES(rating), rating),
                feedback = COALESCE(VALUES(feedback), feedback),
                time_spent_minutes = time_spent_minutes + COALESCE(VALUES(time_spent_minutes), 0),
                created_at = NOW()
        `, [userId, resourceId, interaction_type, rating, feedback, time_spent_minutes || 0]);

        // Update resource rating if this was a rating interaction
        if (interaction_type === 'rated' && rating) {
            await updateResourceRating(resourceId);
        }

        // Log activity and award XP
        if (interaction_type === 'viewed') {
            await logActivity(userId, 'viewed_resource', null, null, { resource_id: resourceId });
        } else if (interaction_type === 'completed') {
            await logActivity(userId, 'completed_resource', null, null, { resource_id: resourceId });
        }

        res.json({ message: "Resource interaction recorded successfully" });

    } catch (error) {
        console.error("Error recording resource interaction:", error);
        res.status(500).json({ message: "Failed to record resource interaction" });
    }
};

/**
 * GET /api/roadmaps/templates
 * Get available roadmap templates
 */
export const getRoadmapTemplates = async (req, res) => {
    const { category, difficulty } = req.query;

    try {
        let query = `
            SELECT 
                rt.id,
                rt.name,
                rt.description,
                rt.category,
                rt.difficulty,
                rt.estimated_total_hours,
                COUNT(tm.module_id) as module_count
            FROM roadmap_templates rt
            LEFT JOIN template_modules tm ON rt.id = tm.template_id
            WHERE rt.is_active = TRUE
        `;

        const params = [];

        if (category) {
            query += " AND rt.category = ?";
            params.push(category);
        }

        if (difficulty) {
            query += " AND rt.difficulty = ?";
            params.push(difficulty);
        }

        query += " GROUP BY rt.id ORDER BY rt.name";

        const [templates] = await pool.execute(query, params);

        res.json({ templates });

    } catch (error) {
        console.error("Error fetching roadmap templates:", error);
        res.status(500).json({ message: "Failed to fetch roadmap templates" });
    }
};

// Helper functions

function checkModuleUnlocked(moduleId, prerequisites, allModules) {
    if (prerequisites.length === 0) return true;

    return prerequisites.every(prereq => {
        const prereqModule = allModules.find(m => m.id === prereq.id);
        if (!prereq.is_strict) return true; // Non-strict prerequisites don't block
        return prereqModule && prereqModule.status === 'completed';
    });
}

async function updateResourceRating(resourceId) {
    try {
        await pool.execute(`
            UPDATE learning_resources 
            SET 
                rating = (
                    SELECT COALESCE(AVG(rating), 0) 
                    FROM user_resource_interactions 
                    WHERE resource_id = ? AND interaction_type = 'rated' AND rating IS NOT NULL
                ),
                vote_count = (
                    SELECT COUNT(*) 
                    FROM user_resource_interactions 
                    WHERE resource_id = ? AND interaction_type = 'rated' AND rating IS NOT NULL
                )
            WHERE id = ?
        `, [resourceId, resourceId, resourceId]);
    } catch (error) {
        console.error("Error updating resource rating:", error);
    }
}

async function logActivity(userId, action, projectId = null, moduleId = null, metadata = null) {
    try {
        await pool.execute(
            `INSERT INTO user_activity (user_id, action, project_id, module_id, metadata)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, action, projectId, moduleId, metadata ? JSON.stringify(metadata) : null]
        );
    } catch (error) {
        console.error("Error logging activity:", error);
    }
}
