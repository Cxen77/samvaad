import mongoose from 'mongoose';

const openRoleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    requiredSkills: [{ type: String }],
    vacancies: { type: Number, default: 1, min: 1 },
    filledCount: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true }
}, { _id: true });

const memberRoleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'co-lead', 'member'], default: 'member' }
}, { _id: false });

const joinRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, default: null },  // which openRole they want
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    message: { type: String, default: '' }
}, { timestamps: true });

const teamSchema = mongoose.Schema({
    // ── Existing fields (unchanged) ──────────────────
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    isAutoCreated: { type: Boolean, default: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // source of truth for membership
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    invites: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        roleId: { type: mongoose.Schema.Types.ObjectId, default: null }  // optional: role invite
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── New fields ───────────────────────────────────
    isLookingForMembers: { type: Boolean, default: false },
    teamStatus: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    currentFocus: { type: String, default: '' },
    projectGoals: { type: String, default: '' },   // long-form project goals / about
    openRoles: [openRoleSchema],
    memberRoles: [memberRoleSchema],    // role metadata — always synced with members[]
    joinRequests: [joinRequestSchema]
}, {
    timestamps: true
});

// ── Indexes ──────────────────────────────────────────
teamSchema.index({ members: 1 });
teamSchema.index({ admins: 1 });
teamSchema.index({ createdBy: 1 });
teamSchema.index({ eventId: 1 });
teamSchema.index({ isLookingForMembers: 1 });
teamSchema.index({ category: 1 });
teamSchema.index({ visibility: 1 });
teamSchema.index({ teamStatus: 1 });

// ── Helper: recompute isLookingForMembers ────────────
// Call after any openRoles mutation, then save()
teamSchema.methods.syncLookingForMembers = function () {
    this.isLookingForMembers = this.openRoles.some(r => r.isOpen === true);
};

const Team = mongoose.model('Team', teamSchema);

export default Team;
