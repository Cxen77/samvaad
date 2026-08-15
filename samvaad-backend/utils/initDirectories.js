import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDirectories = () => {
    const uploadsDir = path.join(__dirname, '../uploads');
    const dirs = [
        uploadsDir,
        path.join(uploadsDir, 'posts'),
        path.join(uploadsDir, 'profile'),
        path.join(uploadsDir, 'banners'),
        path.join(uploadsDir, 'events'),
        path.join(uploadsDir, 'recordings'),
        path.join(uploadsDir, 'documents'),
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
};

export default initDirectories;
