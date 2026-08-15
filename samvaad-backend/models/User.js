import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Optional for Google users
    role: {
        type: String,
        enum: ['user', 'moderator', 'organizer', 'admin'],
        default: 'user',
        index: true
    },
    isSuspended: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    // Student Verification
    collegeVerified: {
        type: String,
        enum: ['false', 'pending', 'rejected', 'true'],
        default: 'false',
        index: true
    },
    collegeVerificationMethod: { type: String, enum: ['email', 'id_card'], default: null },
    collegeVerifiedAt: { type: Date },
    collegeIdCardUrl: { type: String, default: '' },
    collegeEmailForVerification: { type: String, default: '' }, // Temp: college email during OTP flow
    verificationNote: { type: String, default: '' }, // Rejection reason set by admin/mod

    // Auth & Verification
    isEmailVerified: { type: Boolean, default: false },
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    otpLockUntil: { type: Date },
    otpResendCount: { type: Number, default: 0 },
    otpResendResetAt: { type: Date },

    // Password Reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    firebaseUid: { type: String, unique: true, sparse: true }, // Link to Firebase Auth
    githubId: { type: String, unique: true, sparse: true }, // GitHub OAuth ID
    githubAccessToken: { type: String, select: false }, // GitHub Access Token
    profilePic: { type: String, default: '' },
    bannerPic: { type: String, default: '' },
    course: { type: String, default: '' },
    usn: { type: String, default: '', trim: true, uppercase: true },
    college: { type: String, default: '' },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', index: true },
    year: { type: String, default: '' },
    section: { type: String, default: '' },
    className: { type: String, default: '' },
    location: { type: String, default: '' },
    pushToken: { type: String, default: '' }, // FCM Token
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    socials: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        portfolio: { type: String, default: '' }
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    publicKey: { type: String, default: null }, // E2EE ECDH public key (SPKI hex)
    statusMessage: { type: String, default: 'Available' },
    presenceStatus: { type: String, enum: ['online', 'away', 'busy', 'offline'], default: 'online' },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost' }],
    projects: [{
        title: String,
        desc: String,
        image: String,
        status: String,
        role: String,
        tags: [String],
        github: String,
        liveDemo: String
    }],
    settings: {
        privacy: {
            profileVisibility: { type: String, default: 'public' },
            allowMessages: { type: Boolean, default: true },
            allowTeamInvites: { type: Boolean, default: true },
            showOnlineStatus: { type: Boolean, default: true },
            showLastActive: { type: Boolean, default: true }
        },
        notifications: {
            emailNotifications: { type: Boolean, default: true },
            teamInvites: { type: Boolean, default: true },
            newMessages: { type: Boolean, default: true },
            eventReminders: { type: Boolean, default: true },
            mentions: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true }
        }
    }
}, {
    timestamps: true
});

// Indexes for performance (FIXED — no duplicates)
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ contacts: 1 });
userSchema.index({ collegeId: 1, year: 1, section: 1 }); // Academic filter index for organizer exports
userSchema.index({ name: 'text', username: 'text', email: 'text', role: 'text', college: 'text' });

// Methods
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
