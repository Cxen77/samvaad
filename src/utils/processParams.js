const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'temp_colleges.json');
const outputPath = path.join(__dirname, 'colleges.js');

try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const collegesData = JSON.parse(rawData);

    // Extract unique names and sort them
    const collegeNames = [...new Set(collegesData.map(c => c.name))].sort();

    // Add "Other" at the end if not present
    if (!collegeNames.includes("Other")) {
        collegeNames.push("Other");
    }

    const fileContent = `export const colleges = ${JSON.stringify(collegeNames, null, 4)};\n`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully wrote ${collegeNames.length} colleges to ${outputPath}`);

} catch (err) {
    console.error("Error processing colleges:", err);
    process.exit(1);
}
