/*
  # Create workers table

  1. New Tables
    - `workers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, required)
      - `phone` (text, optional)
      - `category` (text, optional)
      - `subcategory` (text, optional)
      - `opening_balance` (numeric, default 0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `workers` table
    - Add policy for authenticated users to manage their own workers
*/

CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  category text,
  subcategory text,
  opening_balance numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workers"
  ON workers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_category ON workers(category);