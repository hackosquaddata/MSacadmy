import { Router } from 'express';
import { getCourse, getCourseById, checkCourseAccess } from '../controllers/User.controller.js';

const router = Router();

// Public list of courses
router.get('/', getCourse);

// Course detail
router.get('/:courseId', getCourseById);

// Course access check (protected route expects token)
router.get('/:courseId/access', checkCourseAccess);

export default router;
