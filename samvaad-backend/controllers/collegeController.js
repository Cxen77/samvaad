import College from "../models/College.js";
import AdminLog from "../models/AdminLog.js";
import User from "../models/User.js";

// Normalization helper
function normalizeForSearch(str) {
    if (!str) return '';
    const STRIP_WORDS = new Set(['the', 'of', 'and', 'for', 'in', 'at']);
    return str.toLowerCase()
        .replace(/[.,\-()'"\/\\&!@#$%^*+=\[\]{}|:;?<>~`]/g, ' ')
        .split(/\s+/)
        .filter(w => w && !STRIP_WORDS.has(w))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// GET /api/colleges/search?q=...
// Public: Returns only ACTIVE and VERIFIED colleges
export const searchColleges = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        if (!q) return res.json([]);

        // Use regex on name for partial matching
        const regex = new RegExp(q, "i");

        const colleges = await College.find({
            name: regex,
            isActive: true,
            isVerified: true
        })
            .limit(20)
            .select("_id name city state country type");

        res.json(colleges);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Search failed" });
    }
};

// POST /api/colleges/request
// Authed User: Request missing college
// Payload: { name, country, state, city, type }
export const requestCollege = async (req, res) => {
    try {
        const { name, country, state, city, type } = req.body;

        // Validation
        if (!name || name.trim().length < 3) return res.status(400).json({ message: "Name must be at least 3 chars" });
        if (!['India', 'Nepal'].includes(country)) return res.status(400).json({ message: "Valid country required" });
        if (!['University', 'College', 'School'].includes(type)) return res.status(400).json({ message: "Valid type required" });
        if (/^\d+$/.test(name)) return res.status(400).json({ message: "Name cannot be numbers only" });

        const normName = normalizeForSearch(name);

        // Check if exists (verified or unverified)
        const existing = await College.findOne({ normalizedName: normName, country });

        if (existing) {
            // If exists and IS verified, return it
            if (existing.isVerified) {
                return res.status(200).json({ message: "College already exists", college: existing });
            }
            // If exists but pending, return it (user can just wait)
            return res.status(200).json({ message: "College is already requested and pending approval", college: existing });
        }

        // Create unverified college
        const newCollege = await College.create({
            name: name.trim(),
            normalizedName: normName,
            country,
            state: state || null,
            city: city || null,
            type,
            source: "Manual",
            isVerified: false,
            isActive: false // Hidden until approved
        });

        // Update User Profile to this pending college
        await User.findByIdAndUpdate(req.user._id, {
            college: {
                collegeId: newCollege._id,
                verified: false // User is not verified student yet either
            }
        });

        res.status(201).json({ message: "Request submitted for verification", college: newCollege });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(200).json({ message: "College already exists" });
        }
        console.error("Request college error:", error);
        res.status(500).json({ message: "Request failed" });
    }
};

// --- ADMIN CONTROL ---

// GET /api/colleges/pending
export const getPendingColleges = async (req, res) => {
    try {
        const colleges = await College.find({ isVerified: false, isActive: false })
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(colleges);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending colleges" });
    }
};

// PUT /api/colleges/:id/approve
export const approveCollege = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) return res.status(404).json({ message: "College not found" });

        college.isVerified = true;
        college.isActive = true;
        await college.save();

        // Log action
        await AdminLog.create({
            adminId: req.user._id,
            action: "APPROVE_COLLEGE",
            targetId: college._id,
            targetType: "College",
            details: `Approved: ${college.name}`,
            ipAddress: req.ip
        });

        res.json({ message: "College approved", college });
    } catch (error) {
        res.status(500).json({ message: "Approval failed" });
    }
};

// PUT /api/colleges/:id/reject
export const rejectCollege = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) return res.status(404).json({ message: "College not found" });

        // Soft delete (keep as inactive, or actually delete? Prompt said 'delete OR set isActive:false')
        // We'll Set isActive: false and keep it to prevent re-request spam? 
        // Actually, if we keep it, normalizedName index prevents re-creation.
        // So let's DELETE it so users can try again with correct spelling if rejected.

        await College.findByIdAndDelete(req.params.id);

        // Log action
        await AdminLog.create({
            adminId: req.user._id,
            action: "REJECT_COLLEGE",
            targetId: college._id, // ID is preserved in log even if doc deleted
            targetType: "College",
            details: `Rejected/Deleted: ${college.name}`,
            ipAddress: req.ip
        });

        res.json({ message: "College rejected and removed" });
    } catch (error) {
        res.status(500).json({ message: "Rejection failed" });
    }
};
