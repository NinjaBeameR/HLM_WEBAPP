import { supabase } from '../lib/supabase';
import { Payment, getCurrentUserId } from '../lib/supabase';

type PaymentInsert = Omit<Payment, 'id' | 'user_id' | 'created_at' | 'balance_after_payment'>;

export const paymentService = {
  // Get all payments for a worker
  async getWorkerPayments(workerId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('worker_id', workerId)
      .order('date_of_payment', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get payments for a date range
  async getPaymentsByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        workers!inner (
          name,
          category,
          subcategory
        )
      `)
      .gte('date_of_payment', startDate)
      .lte('date_of_payment', endDate)
      .order('date_of_payment', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create payment with balance calculation
  async createPayment(payment: PaymentInsert): Promise<Payment> {
    const userId = await getCurrentUserId();

    // Get current worker balance
    const { data: workerBalance, error: balanceError } = await supabase
      .from('worker_balances')
      .select('current_balance')
      .eq('id', payment.worker_id)
      .single();

    if (balanceError) throw balanceError;

    const currentBalance = workerBalance?.current_balance || 0;
    const newBalance = currentBalance - (payment.payment_amount || 0);

    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...payment,
        user_id: userId,
        balance_after_payment: newBalance,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update payment
  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete payment
  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get total payments for a worker
  async getTotalPayments(workerId: string): Promise<number> {
    const { data, error } = await supabase
      .from('payments')
      .select('payment_amount')
      .eq('worker_id', workerId);

    if (error) throw error;
    
    return data?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;
  },
};