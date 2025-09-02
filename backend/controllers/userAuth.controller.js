import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
    const {name, email, password, role } = req.body
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM users WHERE email = ? OR name = ?",
            [email, name]
        );
        if (rows.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "User already exists"});
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await pool.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                [name, email, hashedPassword, role]
            );
            const userId = result.insertId;
            const token = jwt.sign({ id: userId, role: req.body.role }, process.env.JWT_SECRET);
            
            // console.log("User created with ID:", userId);
            // console.log("Token generated:", token);
            

            // Send response
            res.status(201).json({
            token,
            user: {
                id: userId,
                name,
                email,
                role
            },
            });
        }
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const loginUser = async (req, res) => {
    const {emailOrName, password} = req.body;
    
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM users WHERE email = ? OR name = ?",
            [emailOrName, emailOrName]
        );
        
        if (rows.length === 0) {
            return res.status(400).json({message: "User not found"});
        }
        
        const user = rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role};

        const token = jwt.sign(payload, process.env.JWT_SECRET);
        
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({message: "Internal server error"});
    }
}
