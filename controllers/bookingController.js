const Booking = require("../config/db.js");

// ===========Create Bookings =============
export const createBooking = async (req, res) => {
  try {
    const { propertyId, date, time, status } = req.body;
    const userId = req.user.id;
    const [result] = await pool.query(
      `INSERT INTO bookings
      (propertyId, userId, date, time, status)
      VALUES (?, ?, ?, ?,?)`,
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
