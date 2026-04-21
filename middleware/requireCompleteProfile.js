import pool from "../config/db.js";

const REQUIRED_FIELDS = ["name", "phone", "email", "address", "city", "zip", "province", "country"];

export const requireCompleteProfile = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT name, phone, email, address, city, zip, province, country
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];
        const missingFields = REQUIRED_FIELDS.filter(f => {
            const v = user[f];
            return v === null || v === undefined || String(v).trim() === "";
        });

        if (missingFields.length > 0) {
            return res.status(403).json({
                message: "Please complete your Personal Information before performing this action.",
                missingFields
            });
        }

        next();
    } catch (err) {
        console.error("requireCompleteProfile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
