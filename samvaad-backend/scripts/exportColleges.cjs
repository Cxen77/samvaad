const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const collegeSchema = new mongoose.Schema({
    name: String,
    normalizedName: String,
    country: String,
    state: String,
    city: String,
    type: String,
    source: String,
    isVerified: Boolean,
    isActive: Boolean
}, { strict: false });

const College = mongoose.model('College', collegeSchema);

async function exportData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Fetching colleges...');
        const colleges = await College.find({}, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 });

        console.log(`Found ${colleges.length} colleges.`);

        const outputPath = path.join(__dirname, 'colleges_export.json');
        fs.writeFileSync(outputPath, JSON.stringify(colleges, null, 2));

        console.log(`\n✅ Successfully exported to: ${outputPath}`);
        console.log('You can now upload this file to MongoDB Atlas using Compass or mongoimport.');

    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

exportData();
