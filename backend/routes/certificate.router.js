import express from 'express';
import { 
    generateCertificate,
    getUserCertificates,
    getCertificate,
    getCertificatePreview
} from '../controllers/certificate.controller.js';
import { authenticateToken, checkRole } from '../middleware/userAuth.middleware.js';

const router = express.Router();

// Middleware to ensure only students can access certificate routes
const studentOnly = [authenticateToken, checkRole(['student'])];

// Certificate routes
router.post('/generate', studentOnly, generateCertificate);
router.get('/user', studentOnly, getUserCertificates);
router.get('/:certificateId', studentOnly, getCertificate);
router.get('/:certificateId/preview', studentOnly, getCertificatePreview);

export default router;
