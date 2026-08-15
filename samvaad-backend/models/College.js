import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    country: { type: String, enum: ["India", "Nepal"], required: true },
    state: { type: String, default: null },
    city: { type: String, default: null },
    type: { type: String, enum: ["University", "College"], required: true },
    source: { type: String, enum: ["UGC", "AISHE", "NepalMoE", "Manual"], default: "Manual" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compound unique index — prevents duplicate explosion
collegeSchema.index({ normalizedName: 1, country: 1 }, { unique: true });

// Text index — enables search
collegeSchema.index({ name: "text" });

export default mongoose.model("College", collegeSchema);
