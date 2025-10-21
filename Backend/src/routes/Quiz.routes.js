import express from 'express';
import { getQuiz, submitQuiz } from '../controllers/Quiz.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Authenticated routes
router.get('/content/:contentId/quiz', authenticate, getQuiz);
router.post('/content/:contentId/quiz', authenticate, submitQuiz);

export default router;
