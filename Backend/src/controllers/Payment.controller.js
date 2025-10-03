import { connectSupabase, connectSupabaseAdmin } from '../db/supabaseClient.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createPaymentSession = async (req, res) => {
  try {
    console.log('Creating payment session...');
    const { courseId } = req.params;
    const user = req.user; // From auth middleware

    console.log('User from auth:', user);

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Course fetch error:', courseError);
      return res.status(404).json({ message: "Course not found" });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(course.price * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now().toString(36)}_${courseId.slice(0, 8)}`,
      notes: {
        courseId: courseId,
        userId: user.id,
        courseTitle: course.title
      }
    };

    console.log('Creating Razorpay order:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      id: order.id,
      course_name: course.title,
      description: `Enrollment for ${course.title}`,
      user_name: user.email,
      user_email: user.email
    });

  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({
      message: 'Failed to create payment session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    console.log('Payment verification started', req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log('Missing payment parameters');
      return res.status(400).json({ 
        success: false,
        message: "Missing payment parameters" 
      });
    }

    try {
      // First verify the payment exists
      const order = await razorpay.orders.fetch(razorpay_order_id);
      
      // Then verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;
      
      if (!isValid) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid payment signature" 
        });
      }

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('payment_id', razorpay_payment_id)
        .single();

      if (existingEnrollment) {
        return res.json({
          success: true,
          message: 'Already enrolled with this payment',
          courseId: order.notes.courseId
        });
      }

      // Create enrollment
      const { error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .insert([
          {
            user_id: order.notes.userId,
            course_id: order.notes.courseId,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            amount_paid: order.amount / 100,
            status: 'active'
          }
        ]);

      if (enrollmentError) {
        console.error('Enrollment creation error:', enrollmentError);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to create enrollment' 
        });
      }

      res.json({
        success: true,
        message: 'Payment verified and enrollment created successfully',
        courseId: order.notes.courseId
      });

    } catch (error) {
      console.error('Payment verification inner error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Payment verification failed',
        error: error.message 
      });
    }

  } catch (error) {
    console.error('Payment verification outer error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment verification failed'
    });
  }
};