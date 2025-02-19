import express from "express";
import cors from "cors"; 
import cookieParser from "cookie-parser";

const app = express();


const corsOptions = {
    origin:process.env.CORS_ORIGIN,
    credentials: true
}
app.use(cors(corsOptions))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static('public'))
app.use(cookieParser)



// import routes 
import userRoutes from "./routes/user.routes.js"



// routes declaration
app.use("/api/v1/users", userRoutes) // http://localhost/8000/api/v1/users

export {app}