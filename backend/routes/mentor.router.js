import express from 'express';
import { 
    getMentorDashboard,
    getMentorStats,
    getMentorProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectModules,
    createModule,
    updateModule,
    deleteModule,
    getProjectResources,
    createResource,
    updateResource,
    deleteResource,
    getProjectAnalytics,
    getSkills,
    getGoals
} from '../controllers/mentor.controller.js';
import { authenticateToken, checkRole } from '../middleware/userAuth.middleware.js';

const router = express.Router();

// Middleware to ensure only mentors can access these routes
const mentorOnly = [authenticateToken, checkRole(['mentor'])];

// Dashboard
router.get('/dashboard', mentorOnly, getMentorDashboard);

// Stats for home page
router.get('/stats', mentorOnly, getMentorStats);

// Projects management
router.get('/projects', mentorOnly, getMentorProjects);
router.post('/projects', mentorOnly, createProject);
router.put('/projects/:projectId', mentorOnly, updateProject);
router.delete('/projects/:projectId', mentorOnly, deleteProject);

// Modules management
router.get('/projects/:projectId/modules', mentorOnly, getProjectModules);
router.post('/modules', mentorOnly, createModule);
router.put('/modules/:moduleId', mentorOnly, updateModule);
router.delete('/modules/:moduleId', mentorOnly, deleteModule);

// Resources management
router.get('/projects/:projectId/resources', mentorOnly, getProjectResources);
router.post('/resources', mentorOnly, createResource);
router.put('/resources/:resourceId', mentorOnly, updateResource);
router.delete('/resources/:resourceId', mentorOnly, deleteResource);

// Analytics
router.get('/projects/:projectId/analytics', mentorOnly, getProjectAnalytics);

// Helper endpoints for form data
router.get('/skills', mentorOnly, getSkills);
router.get('/goals', mentorOnly, getGoals);

export default router;
