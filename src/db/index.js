import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n DB connected !! DB host: ${connectionInstance.connection.host}`);
    }
    catch{
        console.log("connection failed" , error);
        process.exit(1);
    }
}

export default connectDB 