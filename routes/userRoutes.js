import express from 'express';
import db from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getMyProfile, updateMyProfile } from '../controllers/userController.js';

const router = express.Router();

// Logged-in user's own profile
router.get('/me', authMiddleware, getMyProfile);
router.put('/me', authMiddleware, updateMyProfile);

// GET user by ID (public — limited fields)
router.get('/:id', async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        const [results] = await db.query(
            "SELECT id, name, email, phone, role FROM users WHERE id = ?",
            [userId]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(results[0]);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
