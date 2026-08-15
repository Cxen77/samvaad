import mongoose from 'mongoose';
import Chat from './models/Chat.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const simulateRequest = async () => {
    try {
        console.log("\n--- SIMULATING API RESPONSE ---\n");
        const users = await User.find({}, 'name _id');
        
        for (const user of users) {
             console.log(`\nUser: ${user.name}`);
             const chats = await Chat.find({ participants: user._id })
                .populate('participants', 'name email profilePic status lastSeen')
                .populate('lastMessage')
                .populate('groupAdmin', 'name profilePic')
                .sort({ updatedAt: -1 });
             
             console.log(`Chats Found: ${chats.length}`);
             chats.forEach(c => {
                 if (c.isGroupChat) {
                     console.log(`   - Group: "${c.chatName}"`);
                     console.log(`     Participants Populated: ${c.participants.length}`);
                     // Check if current user is in populated list
                     const foundSelf = c.participants.find(p => p._id.toString() === user._id.toString());
                     console.log(`     Self (${user.name}) in populated list? ${!!foundSelf}`);
                 }
             });
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
};

setTimeout(simulateRequest, 2000);
