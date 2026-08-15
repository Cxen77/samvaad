import mongoose from 'mongoose';
import Chat from './models/Chat.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const checkVisibility = async () => {
    try {
        console.log("\n--- CHECKING CHAT VISIBILITY FOR ALL USERS ---\n");

        const users = await User.find({}, 'name _id');

        for (const user of users) {
            console.log(`Checking for User: ${user.name} (ID: ${user._id})`);

            // Exactly simulating the controller query: Chat.find({ participants: user._id })
            const chats = await Chat.find({ participants: user._id })
                .select('chatName isGroupChat participants');

            console.log(`  -> Found ${chats.length} chats.`);
            chats.forEach(c => {
                if (c.isGroupChat) {
                    console.log(`     - [GROUP] ${c.chatName} (ID: ${c._id})`);
                    // Check if user ID is strictly in participants
                    const isInList = c.participants.some(p => p.toString() === user._id.toString());
                    console.log(`       User in participants array? ${isInList}`);
                } else {
                    // console.log(`     - [DM] ${c._id}`);
                }
            });
            console.log("");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
};

setTimeout(checkVisibility, 2000);
