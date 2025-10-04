import express from 'express'
import dotenv from "dotenv"
import {connectSupabase} from './db/supabaseClient.js'
import cors from "cors"
import cookieParser from "cookie-parser";
import paymentRoutes from './routes/Payment.routes.js';

dotenv.config({
    path:'./.env'
})

const app =express()

// Update CORS configuration
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials:true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({limit:"16kb"}))
app.use(express.static("public"))
app.use(express.urlencoded({extended:true ,limit:"16kb"}))


app.use(cookieParser())

connectSupabase()

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// routes declaration 

app.get("/",(req,res)=>{

    res.send("the server is running successfully ")
})

import userRouter from "./routes/User.routes.js"
import Adminrouter from "./routes/Admin.routes.js"
import commentsRoutes from './routes/Comments.routes.js';
import progressRoutes from './routes/Progress.routes.js';

app.use("/api/auth/v1", userRouter)
app.use("/api/admin/", Adminrouter)
app.use("/api/payments", paymentRoutes)
app.use("/api/courses", userRouter)
app.use('/api/auth/v1', commentsRoutes)
app.use('/api/auth/v1', progressRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
