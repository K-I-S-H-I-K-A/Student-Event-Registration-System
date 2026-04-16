import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ================= REGISTER =================
export const register = async (req, res) => {
    try {
        const { email, password, name, phone, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        // check if user exists
        const [existing] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO users (email, password, name, phone, role)
             VALUES (?, ?, ?, ?, ?)`,
            [email, hashedPassword, name, phone, role || "coworker"]
        );

        return res.json({
            success: true,
            message: "User registered successfully",
            userId: result.insertId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ================= LOGIN =================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // create JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            success: true,
            token,
            userId: user.id,
            name: user.name,
            role: user.role
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ================= GET CURRENT USER =================
export const getUser = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, email, name, phone, role FROM users WHERE id = ?",
            [req.user.id]
        );

        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};