import express from 'express'
import dotenv from "dotenv"
import {connectSupabase} from './db/supabaseClient.js'
import cors from "cors"
import cookieParser from "cookie-parser";
import paymentRoutes from './routes/Payment.routes.js';
import supportRoutes from './routes/Support.routes.js';
import rateLimit from 'express-rate-limit';

dotenv.config({
    path:'./.env'
})

const app =express()

// Update CORS configuration
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (no origin) or any origin in the allowlist
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({limit:"16kb"}))
app.use(express.static("public"))
app.use(express.urlencoded({extended:true ,limit:"16kb"}))


app.use(cookieParser())

connectSupabase()

// Optional debug middleware (safe, env-gated)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// routes declaration 

app.get("/",(req,res)=>{

    res.send("the server is running successfully ")
})

import userRouter from "./routes/User.routes.js"
import Adminrouter from "./routes/Admin.routes.js"
import commentsRoutes from './routes/Comments.routes.js';
import progressRoutes from './routes/Progress.routes.js';
import quizRoutes from './routes/Quiz.routes.js';
import coursesRouter from './routes/Courses.routes.js';

// Rate limiters
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const sensitivePostLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const commentsLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

app.use(generalLimiter);

app.use("/api/auth/v1", userRouter)
app.use("/api/admin/", Adminrouter)
app.use("/api/payments", sensitivePostLimiter, paymentRoutes)
app.use("/api/courses", coursesRouter)
app.use('/api/auth/v1', commentsRoutes)
app.use('/api/auth/v1', sensitivePostLimiter, progressRoutes);
app.use('/api/auth/v1', sensitivePostLimiter, quizRoutes);
app.use('/api/support', supportRoutes);

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
