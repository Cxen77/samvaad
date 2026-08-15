const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to DB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const collegeSchema = new mongoose.Schema({
    canonicalName: { type: String, required: true, index: true },
    aliases: [{ type: String, index: true }],
    city: String,
    state: String,
    country: { type: String, default: "India" },
    verified: { type: Boolean, default: true }
}, { timestamps: true });

const College = mongoose.model("College", collegeSchema);

const seedColleges = async () => {
    await connectDB();

    try {
        // Read colleges.js file content
        // Since it's ES6 export, we'll try to parsing it manually to avoid loader issues in CJS
        const collegesJsPath = path.join(__dirname, '../../src/utils/colleges.js');
        const rawContent = fs.readFileSync(collegesJsPath, 'utf8');

        // Extract array content
        // Assuming format `export const colleges = [...];`
        const jsonString = rawContent.substring(rawContent.indexOf('['), rawContent.lastIndexOf(']') + 1);
        const collegesList = JSON.parse(jsonString);

        console.log(`Found ${collegesList.length} colleges.`);

        // Determine if we need to purge or upsert
        // We'll upsert based on canonicalName

        console.log('Seeding colleges... this might take a minute.');

        const ops = collegesList.map(name => ({
            updateOne: {
                filter: { canonicalName: name },
                update: {
                    $setOnInsert: {
                        canonicalName: name,
                        country: "India", // Defaulting, though global list has others
                        verified: true
                    }
                },
                upsert: true
            }
        }));

        // Batch execution
        const batchSize = 1000;
        for (let i = 0; i < ops.length; i += batchSize) {
            const batch = ops.slice(i, i + batchSize);
            await College.bulkWrite(batch);
            process.stdout.write(`Processed ${Math.min(i + batchSize, ops.length)} / ${ops.length}\r`);
        }

        console.log('\nSeeding complete!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedColleges();
