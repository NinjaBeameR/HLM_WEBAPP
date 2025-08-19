import { Worker, Transaction, Category } from '../types';

const STORAGE_KEYS = {
  WORKERS: 'hulimane_workers',
  TRANSACTIONS: 'hulimane_transactions',
  CATEGORIES: 'hulimane_categories',
};

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
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

export const StorageService = {
  // Workers
  getWorkers: (): Worker[] => {
    try {
      const workers = localStorage.getItem(STORAGE_KEYS.WORKERS);
      return workers ? JSON.parse(workers) : [];
    } catch (error) {
      console.error('Error getting workers:', error);
      return [];
    }
  },

  saveWorkers: (workers: Worker[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
    } catch (error) {
      console.error('Error saving workers:', error);
    }
  },

  addWorker: (worker: Omit<Worker, 'id' | 'createdAt' | 'currentBalance'>): Worker => {
    const workers = StorageService.getWorkers();
    const newWorker: Worker = {
      ...worker,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      currentBalance: worker.openingBalance,
    };
    workers.push(newWorker);
    StorageService.saveWorkers(workers);
    return newWorker;
  },

  updateWorker: (id: string, updates: Partial<Worker>): Worker | null => {
    const workers = StorageService.getWorkers();
    const index = workers.findIndex(w => w.id === id);
    if (index === -1) return null;
    
    // Prevent updating opening balance and other immutable fields
    const { openingBalance, createdAt, currentBalance, ...allowedUpdates } = updates;
    workers[index] = { ...workers[index], ...allowedUpdates };
    StorageService.saveWorkers(workers);
    return workers[index];
  },

  deleteWorker: (id: string): boolean => {
    const workers = StorageService.getWorkers();
    const filteredWorkers = workers.filter(w => w.id !== id);
    if (filteredWorkers.length === workers.length) return false;
    
    StorageService.saveWorkers(filteredWorkers);
    // Also delete related transactions
    const transactions = StorageService.getTransactions();
    const filteredTransactions = transactions.filter(t => t.workerId !== id);
    StorageService.saveTransactions(filteredTransactions);
    return true;
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    try {
      const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return transactions ? JSON.parse(transactions) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  saveTransactions: (transactions: Transaction[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  },

  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'balance'>): Transaction => {
    const workers = StorageService.getWorkers();
    const worker = workers.find(w => w.id === transaction.workerId);
    if (!worker) throw new Error('Worker not found');

    const transactions = StorageService.getTransactions();
    const workerTransactions = transactions.filter(t => t.workerId === transaction.workerId);
    
    // Calculate new balance
    let newBalance = worker.currentBalance;
    if (transaction.type === 'attendance') {
      newBalance += transaction.amount;
    } else if (transaction.type === 'payment') {
      newBalance -= transaction.amount;
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      balance: newBalance,
    };

    transactions.push(newTransaction);
    StorageService.saveTransactions(transactions);

    // Update worker's current balance
    worker.currentBalance = newBalance;
    StorageService.saveWorkers(workers);

    return newTransaction;
  },

  getWorkerTransactions: (workerId: string): Transaction[] => {
    const transactions = StorageService.getTransactions();
    return transactions
      .filter(t => t.workerId === workerId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // Categories
  getCategories: (): Category[] => {
    try {
      const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!categories) {
        StorageService.saveCategories(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(categories);
    } catch (error) {
      console.error('Error getting categories:', error);
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories: (categories: Category[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  },

  // Utility methods
  recalculateAllBalances: (): void => {
    const workers = StorageService.getWorkers();
    const transactions = StorageService.getTransactions();

    workers.forEach(worker => {
      const workerTransactions = transactions
        .filter(t => t.workerId === worker.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let balance = worker.openingBalance;
      workerTransactions.forEach(transaction => {
        if (transaction.type === 'attendance') {
          balance += transaction.amount;
        } else if (transaction.type === 'payment') {
          balance -= transaction.amount;
        }
        transaction.balance = balance;
      });

      worker.currentBalance = balance;
    });

    StorageService.saveWorkers(workers);
    StorageService.saveTransactions(transactions);
  }
};