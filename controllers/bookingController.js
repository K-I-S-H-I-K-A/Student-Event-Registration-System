<<<<<<< HEAD
import pool from "../config/db.js";

// ===== CREATE BOOKING =====
export const createBooking = async (req, res) => {
    try {
        const { userId, propertyId, date, startTime, duration, hourlyRate, subtotal, serviceFee, total } = req.body;

        // Check for time conflicts on the same property and date
        const [existing] = await pool.query(
            "SELECT id, startTime, duration FROM bookings WHERE propertyId = ? AND date = ?",
            [propertyId, date]
        );

        // Helper to convert "HH:MM" to minutes
        function timeToMinutes(time) {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
        }

        const newStart = timeToMinutes(startTime);
        const newEnd = newStart + (parseInt(duration) * 60);

        const conflict = existing.find(b => {
            const existingStart = timeToMinutes(b.startTime);
            const existingEnd = existingStart + (parseInt(b.duration) * 60);
            return newStart < existingEnd && newEnd > existingStart;
        });

        if (conflict) {
            return res.status(400).json({
                success: false,
                message: "This time slot is already booked"
            });
        }

        // Insert booking
        const [result] = await pool.query(
            `INSERT INTO bookings (userId, propertyId, date, startTime, duration, hourlyRate, subtotal, serviceFee, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, propertyId, date, startTime, duration, hourlyRate, subtotal, serviceFee, total]
        );

        const booking = { id: result.insertId, userId, propertyId, date, startTime, duration, hourlyRate, subtotal, serviceFee, total };

        res.json({ success: true, booking });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

// ===== GET BOOKINGS =====
// Returns all bookings, or filtered by userId if query param provided
// Enriches with property details (workspace, address, price)
export const getBookings = async (req, res) => {
    try {
        const userId = parseInt(req.query.userId);

        let rows;
        if (!isNaN(userId)) {
            [rows] = await pool.query(
                `SELECT b.*, p.workspace, p.address, p.price
                 FROM bookings b
                 LEFT JOIN properties p ON b.propertyId = p.id
                 WHERE b.userId = ?`,
                [userId]
            );
        } else {
            [rows] = await pool.query(
                `SELECT b.*, p.workspace, p.address, p.price
                 FROM bookings b
                 LEFT JOIN properties p ON b.propertyId = p.id`
            );
        }

        // Add status field to match frontend expectations
        const enriched = rows.map(b => ({
            ...b,
            workspace: b.workspace || "Unknown Workspace",
            address: b.address || "No address",
            price: b.price || 0,
            status: "upcoming"
        }));

        res.json(enriched);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

// ===== GET BOOKING BY ID =====
export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM bookings WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

// ===== DELETE BOOKING =====
export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM bookings WHERE id = ?", [id]);

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};
=======
// Booking Controller
// Handles create, read, and delete booking operations
import pool from "../config/db.js";

// =========== CREATE BOOKING =============
export const createBooking = async (req, res) => {
  try {
    const { propertyId, date, time, status } = req.body;

    const userId = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO bookings
      (propertyId, userId, date, time, status)
      VALUES (?, ?, ?, ?, ?)`,
      [propertyId, userId, date, time, status || "pending"]
    );

    res.json({
      success: true,
      bookingId: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ===== GET ALL BOOKINGS =====
export const getBookings = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM bookings");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ===== GET BOOKING BY ID =====
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM bookings WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ===== DELETE BOOKING =====
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM bookings WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    await pool.query("DELETE FROM bookings WHERE id = ?", [id]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// Booking controller completed.
// Routes still need to be created in bookingsRoutes.js.
// Will be connected to app.js later.
>>>>>>> 3579f549ad2b06b10b42b8acbd869be8ea612f19
