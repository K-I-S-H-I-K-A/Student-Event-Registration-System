import pool from "../config/db.js";

const PROFILE_FIELDS = "id, name, email, phone, address, city, zip, province, country, role";

// GET /users/me — return the logged-in user's profile
export const getMyProfile = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("getMyProfile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /users/me — update the logged-in user's profile
export const updateMyProfile = async (req, res) => {
    try {
        const { name, phone, address, city, zip, province, country } = req.body;

        await pool.query(
            `UPDATE users
             SET name = ?, phone = ?, address = ?, city = ?, zip = ?, province = ?, country = ?
             WHERE id = ?`,
            [name, phone, address, city, zip, province, country, req.user.id]
        );

        const [rows] = await pool.query(
            `SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`,
            [req.user.id]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error("updateMyProfile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
