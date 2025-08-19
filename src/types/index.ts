export interface Worker {
  id: string;
  name: string;
  phone: string;
  openingBalance: number;
  category: string;
  subcategory: string;
  createdAt: string;
  currentBalance: number;
}

export interface Transaction {
  id: string;
  workerId: string;
  date: string;
  type: 'attendance' | 'payment';
  attendance?: 'present' | 'absent' | 'half-day';
  amount: number;
  balance: number;
  narration?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export interface ExportData {
  workers: Worker[];
  transactions: Transaction[];
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    workerId?: string;
    category?: string;
  };
}
// WorkerBalance type for reports and balances
export interface WorkerBalance {
  id: string;
  name: string;
  phone?: string;
  category?: string;
  subcategory?: string;
  opening_balance?: number;
  current_balance?: number;
  created_at?: string;
}

// AttendanceEntry type for attendance transactions
export interface AttendanceEntry {
  id: string;
  worker_id: string;
  date: string;
  attendance: boolean;
  amount: number;
  balance_after_entry?: number;
  narration?: string;
  created_at?: string;
}

// Payment type for payment transactions
export interface Payment {
  id: string;
  worker_id: string;
  date_of_payment: string;
  payment_amount: number;
  balance_after_payment?: number;
  created_at?: string;
}