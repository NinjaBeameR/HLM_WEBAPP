import { supabase } from './supabaseClient';
import { Worker, Transaction, Category } from '../types';

export const SupabaseService = {
  // Workers CRUD
  getWorkers: async (userId: string): Promise<Worker[]> => {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  addWorker: async (userId: string, worker: Omit<Worker, 'id' | 'createdAt' | 'currentBalance'>): Promise<Worker> => {
    const { data, error } = await supabase
      .from('workers')
      .insert([{ ...worker, user_id: userId, created_at: new Date().toISOString(), currentBalance: worker.openingBalance }])
      .select();
    if (error) throw error;
    return data?.[0];
  },

  updateWorker: async (id: string, updates: Partial<Worker>): Promise<Worker> => {
    const { data, error } = await supabase
      .from('workers')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  },

  deleteWorker: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Attendance CRUD
  getAttendanceEntries: async (userId: string, workerId?: string): Promise<Transaction[]> => {
    let query = supabase.from('attendance_entries').select('*').eq('user_id', userId);
    if (workerId) query = query.eq('worker_id', workerId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  addAttendanceEntry: async (userId: string, entry: Omit<Transaction, 'id' | 'createdAt' | 'balance'>): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('attendance_entries')
      .insert([{ ...entry, user_id: userId, created_at: new Date().toISOString() }])
      .select();
    if (error) throw error;
    return data?.[0];
  },

  // Payments CRUD
  getPayments: async (userId: string, workerId?: string): Promise<Transaction[]> => {
    let query = supabase.from('payments').select('*').eq('user_id', userId);
    if (workerId) query = query.eq('worker_id', workerId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  addPayment: async (userId: string, payment: Omit<Transaction, 'id' | 'createdAt' | 'balance'>): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('payments')
      .insert([{ ...payment, user_id: userId, created_at: new Date().toISOString() }])
      .select();
    if (error) throw error;
    return data?.[0];
  },

  // Categories (static or from Supabase if needed)
  getCategories: async (): Promise<Category[]> => {
    // If categories are stored in Supabase, fetch here. Otherwise, return static.
    return [
      {
        id: '1',
        name: 'Construction',
        subcategories: ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Helper', 'Supervisor']
      },
      {
        id: '2',
        name: 'Household',
        subcategories: ['Cook', 'Cleaner', 'Gardener', 'Driver', 'Security', 'Caretaker']
      },
      {
        id: '3',
        name: 'General Labor',
        subcategories: ['Daily Worker', 'Casual Labor', 'Seasonal Worker', 'Part-time', 'Contract Worker']
      }
    ];
  },

  // Worker balances view
  getWorkerBalances: async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('worker_balances')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }
};
