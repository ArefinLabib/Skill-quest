import express from "express";
import {createUser, loginUser} from "../controllers/userAuth.controller.js";
import { validateRegister } from "../middleware/userAuth.middleware.js";


const router = express.Router();

router.post("/register", validateRegister, createUser);
router.post("/login", loginUser);



export default router;