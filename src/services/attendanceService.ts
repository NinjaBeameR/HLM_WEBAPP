import { supabase } from '../lib/supabase';
import { AttendanceEntry, getCurrentUserId } from '../lib/supabase';

type AttendanceInsert = Omit<AttendanceEntry, 'id' | 'user_id' | 'created_at' | 'balance_after_entry'>;

export const attendanceService = {
  // Get all attendance entries for a worker
  async getWorkerAttendance(workerId: string): Promise<AttendanceEntry[]> {
    const { data, error } = await supabase
      .from('attendance_entries')
      .select('*')
      .eq('worker_id', workerId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get attendance entries for a date range
  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceEntry[]> {
    const { data, error } = await supabase
      .from('attendance_entries')
      .select(`
        *,
        workers!inner (
          name,
          category,
          subcategory
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create attendance entry with balance calculation
  async createAttendanceEntry(entry: AttendanceInsert): Promise<AttendanceEntry> {
    const userId = await getCurrentUserId();

    // Get current worker balance
    const { data: workerBalance, error: balanceError } = await supabase
      .from('worker_balances')
      .select('current_balance')
      .eq('id', entry.worker_id)
      .single();

    if (balanceError) throw balanceError;

    const currentBalance = workerBalance?.current_balance || 0;
    const newBalance = currentBalance + (entry.amount || 0);

    const { data, error } = await supabase
      .from('attendance_entries')
      .insert({
        ...entry,
        user_id: userId,
        balance_after_entry: newBalance,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update attendance entry
  async updateAttendanceEntry(id: string, updates: Partial<AttendanceEntry>): Promise<AttendanceEntry> {
    const { data, error } = await supabase
      .from('attendance_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete attendance entry
  async deleteAttendanceEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Check if attendance exists for worker on date
  async checkAttendanceExists(workerId: string, date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('attendance_entries')
      .select('id')
      .eq('worker_id', workerId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
};