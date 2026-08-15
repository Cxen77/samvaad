import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/synapse');
        console.log('Connected to MongoDB');

        // Check if test user exists
        const existingUser = await User.findOne({ email: 'test@test.com' });
        if (existingUser) {
            console.log('Test user already exists!');
            console.log('Email: test@test.com');
            console.log('Password: test123');
            process.exit(0);
        }

        // Create test user
        const user = await User.create({
            name: 'Test User',
            username: 'testuser',
            email: 'test@test.com',
            password: 'test123',
            course: 'Computer Science',
            year: '3rd Year',
            bio: 'This is a test user account',
            skills: ['React', 'Node.js', 'MongoDB'],
            socials: {
                github: 'https://github.com/testuser',
                linkedin: 'https://linkedin.com/in/testuser'
            }
        });

        console.log('✅ Test user created successfully!');
        console.log('📧 Email: test@test.com');
        console.log('🔑 Password: test123');
        console.log('\nYou can now:');
        console.log('1. Go to http://localhost:5173/login');
        console.log('2. Login with the above credentials');
        console.log('3. Go to profile and test the update features!');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

createTestUser();
