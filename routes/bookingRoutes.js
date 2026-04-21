import express from "express";
import {
    createBooking,
    getBookings,
    getBookingById,
    deleteBooking
} from "../controllers/bookingController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireCompleteProfile } from "../middleware/requireCompleteProfile.js";

const router = express.Router();

// All booking routes are protected
router.get("/", authMiddleware, getBookings);
router.get("/:id", authMiddleware, getBookingById);
router.post("/", authMiddleware, requireCompleteProfile, createBooking);
router.delete("/:id", authMiddleware, deleteBooking);

export default router;
