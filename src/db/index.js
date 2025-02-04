import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async ()=>{
    try{
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`DB connected !! DB host : ${connectionInstance.connection.host} `)
    }
    catch{
        console.error("MONGODB connection failed" , err)
        process.exit(1)
    }
}

export default connectDB 