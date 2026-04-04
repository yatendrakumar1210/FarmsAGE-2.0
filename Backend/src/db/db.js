const mongoose = require('mongoose');


const connectDB = async ()=>{
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected");
    } catch (error) {
        console.log("Database connection Error");
        process.exit(1);
    }
}

module.exports = connectDB;