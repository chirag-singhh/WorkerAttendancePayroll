import mongoose from 'mongoose'

const connectDb = async () => {
    try {
        const connectInstance = await mongoose.connect(process.env.MONGODB_URI)
          console.log(`✅ MongoDB Connected: ${connectInstance.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
}

export default connectDb;