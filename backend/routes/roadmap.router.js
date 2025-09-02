import express from 'express';
import { 
    getProjectRoadmap, 
    getModuleResources, 
    updateModuleProgress, 
    recordResourceInteraction,
    getRoadmapTemplates 
} from '../controllers/roadmap.controller.js';
import { authenticateToken } from '../middleware/userAuth.middleware.js';

const router = express.Router();

// GET /api/projects/:projectId/roadmap - Get complete roadmap for a project
router.get('/projects/:projectId/roadmap', authenticateToken, getProjectRoadmap);

// GET /api/modules/:moduleId/resources - Get all resources for a specific module
router.get('/modules/:moduleId/resources', authenticateToken, getModuleResources);

// PUT /api/modules/:moduleId/progress - Update user progress for a module
router.put('/modules/:moduleId/progress', authenticateToken, updateModuleProgress);

// POST /api/resources/:resourceId/interact - Record user interaction with a resource
router.post('/resources/:resourceId/interact', authenticateToken, recordResourceInteraction);

// GET /api/roadmaps/templates - Get available roadmap templates
router.get('/roadmaps/templates', authenticateToken, getRoadmapTemplates);

export default router;
