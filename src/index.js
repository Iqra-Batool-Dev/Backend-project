import connectDB from "./db/index.js";
import dotenv from "dotenv"
import { app } from "./app.js";

dotenv.config({
    path: "./env"
})





connectDB()
.then(()=>{

    app.on("error", (error)=>{
        console.log("ERR", error)
        throw error
    })
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`🔗server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed", err)
})


/*
import express from "express"
const app  = express()
(async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on("error" , (error)=>{
        console.log("ERRR", error)
        throw error
       })
       app.listen(process.env.PORT , ()=>{
        console.log(`app is listening on ${process.env.PORT}`)
       })
    } catch (error) {
        console.error("ERROR", err)
    }
})() //execute immediately */