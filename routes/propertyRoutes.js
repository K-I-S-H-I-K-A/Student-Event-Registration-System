import express from "express";
import {
    createProperty,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
} from "../controllers/propertyController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);

// Protected
router.post("/", authMiddleware, createProperty);
router.put("/:id", authMiddleware, updateProperty);
router.delete("/:id", authMiddleware, deleteProperty);

export default router;