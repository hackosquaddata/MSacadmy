 // Backend/src/routes/Payment.routes.js
import express from 'express';
import { createPaymentSession, submitManualPayment, listManualPayments, approveManualPayment, listUserManualPayments, rejectManualPayment, createCheckoutSession, getCouponStats, listCouponUsages } from '../controllers/Payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-session/:courseId', authenticate, createPaymentSession);
// New two-step: collect name/email/coupon then return payment session data
router.post('/checkout/:courseId', authenticate, createCheckoutSession);
// Endpoint for submitting manual payment proof
router.post('/submit/:courseId', authenticate, submitManualPayment);

// Admin endpoints
router.get('/manual-payments', authenticate, listManualPayments);
router.post('/manual-payments/:id/approve', authenticate, approveManualPayment);
router.post('/manual-payments/:id/reject', authenticate, rejectManualPayment);
router.get('/coupons/stats', authenticate, getCouponStats);
router.get('/coupons/usages', authenticate, listCouponUsages);

// User endpoints
router.get('/mine', authenticate, listUserManualPayments);

// (Legacy verify endpoint removed)

export default router;