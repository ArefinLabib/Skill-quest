import express from 'express';
import { getResourcesForProject, addResource } from '../controllers/resource.controller.js';
import { authenticateToken } from '../middleware/userAuth.middleware.js';

const router = express.Router();

router.get('/project/:projectId', authenticateToken, getResourcesForProject);
router.post('/', authenticateToken, addResource);

export default router;
