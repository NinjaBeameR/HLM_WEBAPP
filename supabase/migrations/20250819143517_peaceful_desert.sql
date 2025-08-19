/*
  # Create worker balances view

  1. Views
    - `worker_balances` - Consolidated view showing current balances for all workers
      - Combines worker info with calculated current balances
      - Includes total attendance amounts and total payments
      - Shows current balance as: opening_balance + total_attendance - total_payments

  2. Security
    - View inherits RLS from underlying tables
*/

CREATE OR REPLACE VIEW worker_balances 
WITH (security_invoker = true) AS
SELECT 
  w.id,
  w.user_id,
  w.name,
  w.phone,
  w.category,
  w.subcategory,
  w.opening_balance,
  COALESCE(a.total_attendance, 0) as total_attendance,
  COALESCE(p.total_payments, 0) as total_payments,
  (w.opening_balance + COALESCE(a.total_attendance, 0) - COALESCE(p.total_payments, 0)) as current_balance
FROM workers w
LEFT JOIN (
  SELECT 
    worker_id,
    SUM(amount) as total_attendance
  FROM attendance_entries
  GROUP BY worker_id
) a ON w.id = a.worker_id
LEFT JOIN (
  SELECT 
    worker_id,
    SUM(payment_amount) as total_payments
  FROM payments
  GROUP BY worker_id
) p ON w.id = p.worker_id;