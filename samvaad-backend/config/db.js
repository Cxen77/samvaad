import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/synapse';
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.warn(`⚠️ Warning: Backend is running without database connection. Please configure a valid MONGO_URI in samvaad-backend/.env or start MongoDB locally.`);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

export default connectDB;
