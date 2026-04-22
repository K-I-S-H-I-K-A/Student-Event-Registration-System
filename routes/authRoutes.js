import express from "express";
import { register, login, getUser, becomeOwner } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// AUTH
router.post("/register", register);
router.post("/login", login);

// CURRENT USER (JWT protected)
router.get("/user", authMiddleware, getUser);

// ROLE UPGRADE (JWT protected)
router.post("/become-owner", authMiddleware, becomeOwner);

export default router;