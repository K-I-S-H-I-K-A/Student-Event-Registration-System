// routes/propertyRoutes.js
import express from "express";
import {
    createProperty,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
} from "../controllers/propertyController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);

// Protected
router.post("/", verifyToken, createProperty);
router.put("/:id", verifyToken, updateProperty);
router.delete("/:id", verifyToken, deleteProperty);

export default router;