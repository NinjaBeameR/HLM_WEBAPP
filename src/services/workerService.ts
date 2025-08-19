import { supabase } from '../lib/supabase';
import { Worker, WorkerBalance, getCurrentUserId } from '../lib/supabase';

type WorkerInsert = Omit<Worker, 'id' | 'user_id' | 'created_at'>;
type WorkerUpdate = Partial<Omit<Worker, 'id' | 'user_id' | 'created_at' | 'opening_balance'>>;

export const workerService = {
  // Get all workers for the current user
  async getWorkers(): Promise<Worker[]> {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get workers with calculated balances
  async getWorkersWithBalances(): Promise<WorkerBalance[]> {
    const { data, error } = await supabase
      .from('worker_balances')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get a single worker by ID
  async getWorker(id: string): Promise<Worker | null> {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Create a new worker
  async createWorker(worker: WorkerInsert): Promise<Worker> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('workers')
      .insert({
        ...worker,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a worker
  async updateWorker(id: string, updates: WorkerUpdate): Promise<Worker> {
    const { data, error } = await supabase
      .from('workers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a worker
  async deleteWorker(id: string): Promise<void> {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get workers by category
  async getWorkersByCategory(category: string): Promise<Worker[]> {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) throw error;
    return data || [];
  },
};