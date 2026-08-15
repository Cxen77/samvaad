const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    country: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }
}, { strict: false });

const College = mongoose.models.College || mongoose.model('College', collegeSchema);

async function verifyFlow() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const testName = "Test Verification University " + Date.now();
        const normName = testName.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Create Pending Request (simulate API request)
        console.log(`\n1. Creating pending request: "${testName}"`);
        const newCollege = await College.create({
            name: testName,
            normalizedName: normName,
            country: 'India',
            type: 'University',
            isVerified: false,
            isActive: false
        });
        console.log('   Created with ID:', newCollege._id);

        // 2. Check Search (Should NOT find it)
        console.log('\n2. Searching for pending college...');
        const search1 = await College.find({
            name: new RegExp(testName, 'i'),
            isActive: true,
            isVerified: true
        });
        if (search1.length === 0) {
            console.log('   MATCH: College NOT found in search (Correct)');
        } else {
            console.error('   FAIL: College found in search but should be hidden!');
        }

        // 3. Simulate Admin Approval (simulate API approve)
        console.log('\n3. Approving college...');
        await College.findByIdAndUpdate(newCollege._id, {
            isVerified: true,
            isActive: true
        });
        console.log('   Approved.');

        // 4. Check Search Again (Should FIND it)
        console.log('\n4. Searching for approved college...');
        const search2 = await College.find({
            name: new RegExp(testName, 'i'),
            isActive: true,
            isVerified: true
        });
        if (search2.length === 1) {
            console.log('   MATCH: College FOUND in search (Correct)');
            console.log('   Result:', search2[0].name);
        } else {
            console.error('   FAIL: College NOT found in search after approval!');
        }

        // Cleanup
        console.log('\n5. Cleaning up test data...');
        await College.findByIdAndDelete(newCollege._id);
        console.log('   Deleted test college.');

        console.log('\nVERIFICATION SUCCESSFUL ✅');

    } catch (error) {
        console.error('Verification Failed ❌', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFlow();
