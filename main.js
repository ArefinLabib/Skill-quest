import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userAuthRouter from './backend/routes/userAuth.router.js';
import goalsSkillRouter from './backend/routes/goalsSkill.router.js';
import projectRouter from './backend/routes/project.router.js';
import profileRouter from './backend/routes/profile.router.js';
import dashboardRouter from './backend/routes/dashboard.router.js';
import roadmapRouter from './backend/routes/roadmap.router.js';
import mentorRouter from './backend/routes/mentor.router.js';
import certificateRouter from './backend/routes/certificate.router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Routes
app.use('/api/auth', userAuthRouter);
app.use('/api', goalsSkillRouter);
app.use('/api/projects', projectRouter);
app.use('/api/profile', profileRouter);
app.use('/api/user', dashboardRouter);
app.use('/api', roadmapRouter);
app.use('/api/mentor', mentorRouter);
app.use('/api/certificates', certificateRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
