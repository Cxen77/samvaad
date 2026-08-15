import express from "express";
import {
    searchColleges,
    requestCollege,
    getPendingColleges,
    approveCollege,
    rejectCollege
} from "../controllers/collegeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public
router.get("/search", searchColleges);

// Authenticated
router.post("/request", protect, requestCollege);

// Admin Only
router.get("/pending", protect, requireAdmin, getPendingColleges);
router.put("/:id/approve", protect, requireAdmin, approveCollege);
router.delete("/:id/reject", protect, requireAdmin, rejectCollege);

export default router;
