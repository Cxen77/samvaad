const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const API_URL = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://user:password@cluster.mongodb.net/synapse?retryWrites=true&w=majority';

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

function log(msg) {
    console.log(msg);
}

// Minimal User Schema for Seeding
const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: { type: String, select: false },
    role: { type: String, default: 'user' },
    isSuspended: { type: Boolean, default: false },
    college: String,
    collegeId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Test Credentials
const TEST_ADMIN = {
    name: 'RBAC Test Admin',
    username: 'rbac_admin',
    email: 'rbac_admin@example.com',
    password: 'password123',
    role: 'admin'
};

const TEST_USER = {
    name: 'RBAC Test User',
    username: 'rbac_user',
    email: 'rbac_user@example.com',
    password: 'password123',
    role: 'user'
};

async function login(email, password) {
    try {
        const res = await axios.post(`${API_URL}/users/login`, { email, password });
        return { token: res.data.token, user: res.data };
    } catch (err) {
        console.error(`${colors.red}Login failed for ${email}:${colors.reset}`, err.response?.data?.message || err.message);
        return null;
    }
}

async function testRoleAssignment(adminToken, targetUserId) {
    console.log(`\n${colors.blue}>>> Testing Secure Role Assignment${colors.reset}`);

    // 1. Invalid Role
    process.stdout.write("1. Assigning 'superadmin' (Invalid)... ");
    try {
        await axios.patch(`${API_URL}/admin/users/${targetUserId}/role`,
            { role: 'superadmin' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log(`${colors.red}FAIL (Should have been rejected)${colors.reset}`);
    } catch (err) {
        if (err.response && err.response.status === 400) console.log(`${colors.green}PASS (Rejected)${colors.reset}`);
        else console.log(`${colors.red}FAIL (Unexpected error: ${err.message})${colors.reset}`);
    }

    // 2. Organizer without College
    process.stdout.write("2. Assigning 'organizer' (User has no college)... ");
    try {
        await axios.patch(`${API_URL}/admin/users/${targetUserId}/role`,
            { role: 'organizer' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log(`${colors.red}FAIL (Should have been rejected)${colors.reset}`);
    } catch (err) {
        if (err.response && err.response.data.message.includes('college')) {
            console.log(`${colors.green}PASS (Rejected: No college)${colors.reset}`);
        } else {
            console.log(`${colors.red}FAIL (Unexpected error: ${err.message})${colors.reset}`);
        }
    }

    // 3. Valid Role
    process.stdout.write("3. Assigning 'moderator' (Valid)... ");
    try {
        await axios.patch(`${API_URL}/admin/users/${targetUserId}/role`,
            { role: 'moderator' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log(`${colors.green}PASS (Success)${colors.reset}`);
    } catch (err) {
        console.log(`${colors.red}FAIL (${err.message})${colors.reset}`);
    }
}

async function testRateLimiting(adminToken, targetUserId) {
    console.log(`\n${colors.blue}>>> Testing Rate Limiting (10 req/hr)${colors.reset}`);
    let limitHit = false;

    for (let i = 0; i < 15; i++) {
        try {
            await axios.patch(`${API_URL}/admin/users/${targetUserId}/role`,
                { role: 'user' },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            process.stdout.write(`${colors.green}.${colors.reset}`);
        } catch (err) {
            if (err.response && err.response.status === 429) {
                console.log(`\n${colors.green}[PASS] Rate limit hit at request ${i + 1}${colors.reset}`);
                limitHit = true;
                break;
            } else {
                process.stdout.write(`${colors.red}x${colors.reset}`);
            }
        }
    }

    if (!limitHit) console.log(`\n${colors.red}[FAIL] Rate limit NOT hit.${colors.reset}`);
}

async function run() {
    let adminId, userId;
    console.log(`${colors.blue}Starting RBAC Verification...${colors.reset}`);

    try {
        console.log(`${colors.blue}Setting up Test Data...${colors.reset}`);
        await mongoose.connect(MONGO_URI);

        // Hash password manually since we are using a local schema without pre-save hook
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TEST_ADMIN.password, salt);

        // Create Admin
        await User.deleteMany({ $or: [{ email: TEST_ADMIN.email }, { username: TEST_ADMIN.username }] });
        const adminDoc = await User.create({ ...TEST_ADMIN, password: hashedPassword });
        adminId = adminDoc._id;
        console.log(`Created Admin: ${TEST_ADMIN.email}`);

        // Create User
        await User.deleteMany({ $or: [{ email: TEST_USER.email }, { username: TEST_USER.username }] });
        const userDoc = await User.create({ ...TEST_USER, password: hashedPassword });
        userId = userDoc._id;
        console.log(`Created User: ${TEST_USER.email}`);

        // Login
        const adminAuth = await login(TEST_ADMIN.email, TEST_ADMIN.password);
        if (!adminAuth) throw new Error("Admin login failed");

        // Run Tests
        await testRoleAssignment(adminAuth.token, userId);
        await testRateLimiting(adminAuth.token, userId);

    } catch (err) {
        console.error(`${colors.red}TEST SUITE FAILED:${colors.reset}`, err);
    } finally {
        console.log(`\n${colors.blue}Cleaning up...${colors.reset}`);
        if (adminId) await User.findByIdAndDelete(adminId);
        if (userId) await User.findByIdAndDelete(userId);
        await mongoose.disconnect();
        console.log("Done.");
    }
}
run();
