import express from "express";

import {
    createBooking,
    getBookings,
    getBookingById,
    deleteBooking
} from "../controllers/bookingController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== CREATE BOOKING (protected) =====
router.post("/", authMiddleware, createBooking);

// ===== GET ALL BOOKINGS (protected) =====
router.get("/", authMiddleware, getBookings);

// ===== GET BOOKING BY ID (protected) =====
router.get("/:id", authMiddleware, getBookingById);

// ===== DELETE BOOKING (protected) =====
router.delete("/:id", authMiddleware, deleteBooking);

export default router;
