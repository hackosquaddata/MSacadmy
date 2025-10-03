// Backend/src/routes/Payment.routes.js
import express from 'express';
import { createPaymentSession, verifyPayment } from '../controllers/Payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-session/:courseId', authenticate, createPaymentSession);
router.post('/verify', verifyPayment);

export default router;