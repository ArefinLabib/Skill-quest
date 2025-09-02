import express from "express";
import { getStudentProfile } from "../controllers/profile.controller.js";
import { authenticateToken } from "../middleware/userAuth.middleware.js";

const router = express.Router();

router.get("/student/me", authenticateToken, getStudentProfile);

export default router;
