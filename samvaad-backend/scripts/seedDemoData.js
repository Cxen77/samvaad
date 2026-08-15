import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Story from '../models/Story.js';
import connectDB from '../config/db.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const seedData = async () => {
    try {
        await connectDB();

        console.log('Cleaning up old chat data...');
        await Chat.deleteMany({});
        await Message.deleteMany({});
        await Story.deleteMany({});
        // We do NOT delete Users generally, to preserve auth. 
        // But we can create some fake users.

        console.log('Creating Demo Users...');

        // Demo users from valid randomuser images or similar
        const demoUsers = [
            { name: 'Alice Johnson', email: 'alice@example.com', uid: 'demo_alice', profilePic: 'https://randomuser.me/api/portraits/women/44.jpg' },
            { name: 'Bob Smith', email: 'bob@example.com', uid: 'demo_bob', profilePic: 'https://randomuser.me/api/portraits/men/32.jpg' },
            { name: 'Charlie Lee', email: 'charlie@example.com', uid: 'demo_charlie', profilePic: 'https://randomuser.me/api/portraits/men/76.jpg' }
        ];

        const createdUsers = [];
        for (const u of demoUsers) {
            let user = await User.findOne({ email: u.email });
            if (!user) {
                user = await User.create({
                    ...u,
                    username: u.uid,
                    password: 'password123' // Dummy
                });
            }
            createdUsers.push(user);
        }

        console.log('Seed users active. NOTE: Manually login with a real user to interact.');

        // We can't easily seed chats for the "Logged In User" because we don't know who that is until they login.
        // BUT, we can create a public story or logic.

        // Let's create a Story for Alice
        await Story.create({
            userId: createdUsers[0]._id,
            text: "Hello Synapse! This is a demo story.",
            images: []
        });

        console.log('Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
