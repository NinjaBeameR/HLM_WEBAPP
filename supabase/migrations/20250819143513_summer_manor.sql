/*
  # Create payments table

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `worker_id` (uuid, foreign key to workers)
      - `date_of_payment` (date, required)
      - `payment_amount` (numeric, default 0)
      - `balance_after_payment` (numeric, calculated balance after this payment)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Add policy for authenticated users to manage their own payments

  3. Constraints
    - Check constraint to ensure payment_amount is positive
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  date_of_payment date NOT NULL,
  payment_amount numeric DEFAULT 0 NOT NULL,
  balance_after_payment numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_worker_id ON payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date_of_payment);

-- Check constraint to ensure positive payment amounts
ALTER TABLE payments ADD CONSTRAINT check_positive_payment 
  CHECK (payment_amount >= 0);