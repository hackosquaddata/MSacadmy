import express from 'express'
import dotenv from "dotenv"
import connectSupabase from './db/supabaseClient.js'


const app =express()
app.use(express.json())

dotenv.config({
    path:'./env'
})


connectSupabase()


app.listen(process.env.PORT || 3000,()=>{

    console.log(`the server is conneted to the ${process.env.PORT}`)
})
