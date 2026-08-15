import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../synapse-backend/.env') });

// Register models
import '../models/User.js';
import Team from '../models/Team.js';
import Post from '../models/Post.js';

async function checkPopulate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const posts = await Post.find({ attachedTeamId: { $ne: null } })
            .populate('attachedTeamId')
            .sort({ createdAt: -1 })
            .limit(1)
            .lean();
        
        if (posts.length > 0) {
            const p = posts[0];
            console.log(`Post ID: ${p._id}`);
            console.log(`attachedTeamId field value:`, p.attachedTeamId);
            if (p.attachedTeamId && typeof p.attachedTeamId === 'object') {
                console.log(`SUCCESS: Population worked. Team name: ${p.attachedTeamId.name}`);
            } else {
                console.log(`FAILURE: Population failed. Field is:`, typeof p.attachedTeamId);
            }
        } else {
            console.log('No posts found with attached teams.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkPopulate();
