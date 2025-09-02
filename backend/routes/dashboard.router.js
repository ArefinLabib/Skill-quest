import express from "express";
import { getDashboard, logActivity, getUserProfile } from "../controllers/dashboard.controller.js";

import { authenticateToken } from "../middleware/userAuth.middleware.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, getDashboard);
router.get("/profile", authenticateToken, getUserProfile);
router.post("/activity", authenticateToken, logActivity);

export default router;
