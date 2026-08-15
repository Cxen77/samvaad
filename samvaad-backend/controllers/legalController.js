import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get legal content (privacy or terms)
// @route   GET /api/v1/legal/:type
// @access  Public
const getLegalContent = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const legalPath = path.join(__dirname, '../data/legal.json');

    if (!fs.existsSync(legalPath)) {
        res.status(404);
        throw new Error('Legal data store not found');
    }

    const data = JSON.parse(fs.readFileSync(legalPath, 'utf8'));

    if (!data[type]) {
        res.status(404);
        throw new Error(`Legal content for '${type}' not found`);
    }

    res.json(data[type]);
});

export { getLegalContent };
