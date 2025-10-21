-- Migration: create manual_payments table
-- Stores manual payment attempts when users submit transaction IDs or email receipts
CREATE TABLE IF NOT EXISTS manual_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL, -- e.g., 'UPI', 'Bank Transfer', 'Email'
  upi_address text, -- UPI address used to pay (optional)
  transaction_id text, -- transaction id entered by user
  receipt_email text, -- optional email to which user says they sent payment
  status text DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamptz DEFAULT now(),
  processed_by uuid, -- admin id who processed
  processed_at timestamptz
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_manual_payments_user_id ON manual_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_course_id ON manual_payments(course_id);
