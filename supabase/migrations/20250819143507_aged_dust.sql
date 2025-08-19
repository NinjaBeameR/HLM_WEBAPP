/*
  # Create attendance entries table

  1. New Tables
    - `attendance_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `worker_id` (uuid, foreign key to workers)
      - `date` (date, required)
      - `attendance` (boolean, required - true for present, false for absent)
      - `amount` (numeric, default 0)
      - `balance_after_entry` (numeric, calculated balance after this entry)
      - `narration` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `attendance_entries` table
    - Add policy for authenticated users to manage their own entries

  3. Constraints
    - Unique constraint on (worker_id, date) to prevent duplicate entries
*/

CREATE TABLE IF NOT EXISTS attendance_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  date date NOT NULL,
  attendance boolean NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  balance_after_entry numeric,
  narration text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own attendance entries"
  ON attendance_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON attendance_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_entries(date);

-- Unique constraint to prevent duplicate entries for same worker on same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_worker_date 
  ON attendance_entries(worker_id, date);