import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkUser = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not configured in environment');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const user = await User.findOne({ email: 'test@test.com' });

        if (user) {
            console.log('✅ User found:');
            console.log('Name:', user.name);
            console.log('Email:', user.email);
            console.log('Username:', user.username);
            console.log('Profile Pic:', user.profilePic || '(empty)');
            console.log('Banner Pic:', user.bannerPic || '(empty)');
            console.log('Course:', user.course || '(empty)');
            console.log('Bio:', user.bio || '(empty)');
            console.log('Skills:', user.skills);
            console.log('Socials:', user.socials);
        } else {
            console.log('❌ User not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkUser();
