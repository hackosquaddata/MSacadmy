import express from 'express'
import dotenv from "dotenv"
import connectSupabase from './db/supabaseClient.js'
import cors from "cors"
import cookieParser from "cookie-parser";

dotenv.config({
    path:'./.env'
})

const app =express()

app.use(cors({
    origin:process.env.ORIGIN,
    credentials:true    
}))

app.use(express.json({limit:"16kb"}))
app.use(express.static("public"))
app.use(express.urlencoded({extended:true ,limit:"16kb"}))


app.use(cookieParser())

connectSupabase()

// routes declaration 

app.get("/",(req,res)=>{

    res.send("the server is running successfully ")
})

import userRouter from "./routes/User.routes.js"

app.use("/api/auth/v1",userRouter)

app.listen((process.env.PORT||3000),()=>{

    console.log(`the server is conneted to the ${process.env.PORT || 3000}`)
})
