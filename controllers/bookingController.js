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
