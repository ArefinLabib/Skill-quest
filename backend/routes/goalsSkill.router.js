import express from 'express';
import { getGoals, getSkills, saveSkills } from '../controllers/goalsSkill.controller.js';
import { authenticateToken } from '../middleware/userAuth.middleware.js';

const router = express.Router();

router.get('/goals', getGoals);
router.post('/skills', getSkills);
router.post('/submit', authenticateToken, saveSkills);

export default router;