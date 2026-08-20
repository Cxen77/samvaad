import mongoose from 'mongoose';

const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/synapse';
    if (!process.env.MONGO_URI) {
        console.warn('⚠️ WARNING: MONGO_URI is not defined in .env. Falling back to local default.');
    }
    try {
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.warn('⚠️ Server running in development mode without active MongoDB connection.');
        }
    }
};

export default connectDB;
