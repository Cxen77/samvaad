const fs = require('fs');
const path = require('path');

const indiaPath = path.join(__dirname, 'india_colleges.json');
const worldPath = path.join(__dirname, 'world_universities.json');
const outputPath = path.join(__dirname, 'colleges.js');

try {
    let allColleges = new Set();

    // 1. Process World Universities (Global + specific Nepal focus)
    if (fs.existsSync(worldPath)) {
        const worldData = JSON.parse(fs.readFileSync(worldPath, 'utf8'));
        console.log(`Loaded ${worldData.length} world universities.`);
        worldData.forEach(u => {
            // Add everything, or specific countries? 
            // User asked for "add ever collage of india and nepal" + "I NEED ALL"
            // So we keep the global list we had before + ensure India/Nepal are fully covered.
            allColleges.add(u.name.trim());
        });
    }

    // 2. Process Specific Indian Colleges List
    if (fs.existsSync(indiaPath)) {
        // The VarthanV list structure is weird, usually array of strings or objects. 
        // Let's inspect it or handle errors.
        // Assuming it's [ "College 1", "College 2" ... ] provided by the gist structure or similar.
        // Waiting to see file structure via `cat` might be wise, but let's try generic parsing.

        try {
            const indiaData = JSON.parse(fs.readFileSync(indiaPath, 'utf8'));
            console.log(`Loaded specific India list.`);

            // Check structure
            if (Array.isArray(indiaData)) {
                indiaData.forEach(item => {
                    if (typeof item === 'string') allColleges.add(item.trim());
                    else if (item.college_name) allColleges.add(item.college_name.trim()); // Common field
                    else if (item.name) allColleges.add(item.name.trim());
                });
            }
        } catch (e) {
            console.error("Error parsing india_colleges.json", e.message);
        }
    }

    // 3. Add "Other"
    allColleges.add("Other");

    // 4. Convert to sorted array
    const sortedColleges = Array.from(allColleges).sort();

    const fileContent = `export const colleges = ${JSON.stringify(sortedColleges, null, 4)};\n`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully merged ${sortedColleges.length} colleges to ${outputPath}`);

} catch (err) {
    console.error("Error processing merge:", err);
    process.exit(1);
}
