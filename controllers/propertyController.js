import pool from "../config/db.js";

// ===== CREATE PROPERTY =====
export const createProperty = async (req, res) => {
    try {
        const { workspace, address, neighbourhood, sqft, price, description, amenities } = req.body;

        const ownerId = req.user.id; // from JWT

        const [result] = await pool.query(
            `INSERT INTO properties 
            (workspace, address, neighbourhood, sqft, price, description, amenities, ownerId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [workspace, address, neighbourhood, sqft, price, description, JSON.stringify(amenities), ownerId]
        );

        res.json({
            success: true,
            propertyId: result.insertId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

// ===== GET ALL PROPERTIES =====
export const getAllProperties = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM properties");

        // convert amenities back to array
        const formatted = rows.map(p => ({
            ...p,
            amenities: p.amenities ? JSON.parse(p.amenities) : []
        }));

        res.json(formatted);

    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// ===== GET SINGLE PROPERTY =====
export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM properties WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Not found" });
        }

        const property = rows[0];
        property.amenities = property.amenities ? JSON.parse(property.amenities) : [];

        res.json(property);

    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// ===== UPDATE PROPERTY =====
export const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM properties WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Not found" });
        }

        const property = rows[0];

        // 🚨 Check ownership
        if (property.ownerId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { workspace, address, neighbourhood, sqft, price, description, amenities } = req.body;

        await pool.query(
            `UPDATE properties 
             SET workspace=?, address=?, neighbourhood=?, sqft=?, price=?, description=?, amenities=?
             WHERE id=?`,
            [workspace, address, neighbourhood, sqft, price, description, JSON.stringify(amenities), id]
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// ===== DELETE PROPERTY =====
export const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM properties WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Not found" });
        }

        const property = rows[0];

        // 🚨 Check ownership
        if (property.ownerId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await pool.query("DELETE FROM properties WHERE id = ?", [id]);

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false });
    }
};