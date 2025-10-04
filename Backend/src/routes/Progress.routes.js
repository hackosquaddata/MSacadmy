import express from 'express';
import { getCourseProgress, updateProgress } from '../controllers/Progress.controller.js';

const router = express.Router();

// Get progress for a course
router.get('/courses/:courseId/progress', getCourseProgress);

// Update progress for a content
router.post('/content/:contentId/progress', updateProgress);

export default router;