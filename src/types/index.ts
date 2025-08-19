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