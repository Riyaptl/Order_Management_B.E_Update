const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config()

const connection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Backend is running')
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
}

module.exports = {connection}