import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET user by ID
router.get('/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ?";

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(results[0]);
    });
});

export default router;