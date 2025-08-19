import { Worker, Transaction } from '../types';

export const CalculationService = {
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  formatPhone: (phone: string): string => {
    // Format phone number as +91 XXXXX XXXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  },

  getBalanceStatus: (balance: number): { 
    status: 'he_owes' | 'i_owe' | 'settled'; 
    message: string;
    color: string;
  } => {
    if (balance > 0) {
      return {
        status: 'i_owe',
        message: `I Owe ${CalculationService.formatCurrency(balance)}`,
        color: 'text-red-600 bg-red-50 border-red-200'
      };
    } else if (balance < 0) {
      return {
        status: 'he_owes',
        message: `He Owes ${CalculationService.formatCurrency(Math.abs(balance))}`,
        color: 'text-green-600 bg-green-50 border-green-200'
      };
    } else {
      return {
        status: 'settled',
        message: 'Settled',
        color: 'text-gray-600 bg-gray-50 border-gray-200'
      };
    }
  },

  calculateSummaryStats: (workers: Worker[], transactions: Transaction[]) => {
    const totalIOweThem = workers
      .filter(w => w.currentBalance > 0)
      .reduce((sum, w) => sum + w.currentBalance, 0);
    
    const totalTheyOweMe = workers
      .filter(w => w.currentBalance < 0)
      .reduce((sum, w) => sum + Math.abs(w.currentBalance), 0);

    const totalPaymentsMade = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWagesGiven = transactions
      .filter(t => t.type === 'attendance')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIOweThem,
      totalTheyOweMe,
      totalPaymentsMade,
      totalWagesGiven,
      netBalance: totalIOweThem - totalTheyOweMe,
      workersCount: workers.length,
      activeWorkers: workers.filter(w => w.currentBalance !== 0).length,
    };
  },

  getAttendanceAmount: (attendance: string, baseAmount: number): number => {
    switch (attendance) {
      case 'present':
        return baseAmount;
      case 'half-day':
        return baseAmount / 2;
      case 'absent':
        return 0;
      default:
        return baseAmount;
    }
  }
};