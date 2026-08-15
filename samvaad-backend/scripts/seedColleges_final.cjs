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

const College = mongoose.models.College || mongoose.model("College", collegeSchema);

const seedColleges = async () => {
    await connectDB();

    try {
        const filePath = path.join(__dirname, '../../src/utils/colleges_varthan.json');

        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            process.exit(1);
        }

        console.log("Reading file...");
        const rawData = fs.readFileSync(filePath, 'utf8');
        const colleges = JSON.parse(rawData); // Expecting array of objects

        console.log(`Loaded ${colleges.length} colleges from file.`);

        const ops = [];

        // 1. Process VarthanV List (India)
        for (const c of colleges) {
            const name = c.college; // Correct field name
            const city = c.district; // Correct field name
            const state = c.state;

            if (name) {
                // Clean name (remove Id: C-xxxxx)
                const cleanName = name.replace(/\(Id: [CU]-\d+\)/, '').trim();

                ops.push({
                    updateOne: {
                        filter: { canonicalName: cleanName },
                        update: {
                            $setOnInsert: {
                                canonicalName: cleanName,
                                city: city,
                                state: state,
                                country: "India"
                            },
                            $set: { verified: true }
                        },
                        upsert: true
                    }
                });
            }
        }

        // 2. Add Nepal Colleges (Manual Top List)
        const nepalColleges = [
            "Tribhuvan University",
            "Kathmandu University",
            "Pokhara University",
            "Purbanchal University",
            "Nepal Sanskrit University",
            "Lumbini Buddhist University",
            "Mid-Western University",
            "Far-Western University",
            "Agriculture and Forestry University",
            "Nepal Open University",
            "Rajarshi Janak University",
            "Madan Bhandari University of Science and Technology",
            "Gandaki University",
            "Manmohan Technical University",
            "Amrit Science Campus",
            "Tri-Chandra Multiple Campus",
            "Padma Kanya Multiple Campus",
            "Shanker Dev Campus",
            "Pulchowk Campus",
            "Thapathali Campus",
            "Paschimanchal Campus",
            "Purwanchal Campus",
            "Kathmandu Medical College",
            "Nepal Medical College",
            "Manipal College of Medical Sciences",
            "College of Medical Sciences",
            "Nepal Engineering College",
            "Kantipur Engineering College",
            "Himalaya College of Engineering",
            "Advanced College of Engineering and Management",
            "Kathmandu Engineering College",
            "Sagarmatha Engineering College",
            "Lalitpur Engineering College",
            "National College of Engineering",
            "Cosmos College of Management and Technology",
            "Universal College of Medical Sciences",
            "Chitwan Medical College",
            "Gandaki Medical College",
            // Popular Indian Colleges (Manual Override/Additions)
            "DIT University",
            "BMS Institute of Technology and Management",
            "BMS College of Engineering",
            "Ramaiah Institute of Technology",
            "RV College of Engineering",
            "PES University",
            "Bangalore Institute of Technology",
            "Dayananda Sagar College of Engineering",
            "Manipal Institute of Technology",
            "Vellore Institute of Technology",
            "SRM Institute of Science and Technology",
            "BITS Pilani",
            "Thapar Institute of Engineering and Technology",
            "Amity University",
            "Lovely Professional University",
            "Chandigarh University",
            "Jain University",
            "Christ University",
            "Symbiosis International University"
        ];

        for (const nc of nepalColleges) {
            ops.push({
                updateOne: {
                    filter: { canonicalName: nc },
                    update: {
                        $setOnInsert: {
                            canonicalName: nc,
                            city: "Kathmandu", // Default
                            state: "Bagmati", // Default
                            country: "Nepal"
                        },
                        $set: { verified: true }
                    },
                    upsert: true
                }
            });
        }

        console.log(`Prepared ${ops.length} operations. Executing...`);

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
        console.error('Seeding failed:', JSON.stringify(error, null, 2));
        if (error.writeErrors) {
            console.error('Write Errors:', JSON.stringify(error.writeErrors.slice(0, 5), null, 2));
        }
        process.exit(1);
    }
};

seedColleges();
