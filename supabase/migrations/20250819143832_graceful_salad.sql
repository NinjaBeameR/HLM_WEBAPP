/*
  # Labour Management System Database Schema

  1. New Tables
    - `workers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, required)
      - `phone` (text, unique per user)
      - `category` (text)
      - `subcategory` (text)
      - `opening_balance` (numeric, default 0)
      - `created_at` (timestamp)

    - `attendance_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `worker_id` (uuid, foreign key to workers)
      - `date` (date, required)
      - `attendance` (boolean, required - true for present, false for absent)
      - `amount` (numeric, default 0)
      - `balance_after_entry` (numeric)
      - `narration` (text)
      - `created_at` (timestamp)

    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `worker_id` (uuid, foreign key to workers)
      - `date_of_payment` (date, required)
      - `payment_amount` (numeric, default 0, check >= 0)
      - `balance_after_payment` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Create indexes for performance optimization

  3. Views
    - `worker_balances` view for calculated current balances
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  category text,
  subcategory text,
  opening_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create attendance_entries table
CREATE TABLE IF NOT EXISTS attendance_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  date date NOT NULL,
  attendance boolean NOT NULL,
  amount numeric DEFAULT 0,
  balance_after_entry numeric,
  narration text,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  date_of_payment date NOT NULL,
  payment_amount numeric DEFAULT 0,
  balance_after_payment numeric,
  created_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE payments ADD CONSTRAINT check_positive_payment CHECK (payment_amount >= 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_category ON workers(category);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON attendance_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_entries(date);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance_entries(worker_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_worker_id ON payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date_of_payment);

-- Enable Row Level Security
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workers
CREATE POLICY "Users can manage their own workers"
  ON workers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for attendance_entries
CREATE POLICY "Users can manage their own attendance entries"
  ON attendance_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for payments
CREATE POLICY "Users can manage their own payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique constraint for worker attendance per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance_entries(worker_id, date);

-- Create worker_balances view for calculated balances
CREATE OR REPLACE VIEW worker_balances
WITH (security_invoker = true)
AS
SELECT 
  w.id,
  w.user_id,
  w.name,
  w.phone,
  w.category,
  w.subcategory,
  w.opening_balance,
  COALESCE(attendance_total.total_attendance, 0) as total_attendance,
  COALESCE(payments_total.total_payments, 0) as total_payments,
  w.opening_balance + COALESCE(attendance_total.total_attendance, 0) - COALESCE(payments_total.total_payments, 0) as current_balance
FROM workers w
LEFT JOIN (
  SELECT 
    worker_id,
    SUM(amount) as total_attendance
  FROM attendance_entries
  GROUP BY worker_id
) attendance_total ON w.id = attendance_total.worker_id
LEFT JOIN (
  SELECT 
    worker_id,
    SUM(payment_amount) as total_payments
  FROM payments
  GROUP BY worker_id
) payments_total ON w.id = payments_total.worker_id;