// routes/authRoutes.js
import express from "express";
import { register, login, getUser } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// AUTH
router.post("/register", register);
router.post("/login", login);

// CURRENT USER (JWT protected)
router.get("/user", authMiddleware, getUser);

export default router;