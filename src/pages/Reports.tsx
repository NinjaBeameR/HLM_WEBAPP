import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  Calendar,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { workerService } from '../services/workerService';
import { attendanceService } from '../services/attendanceService';
import { paymentService } from '../services/paymentService';
import { CalculationService } from '../utils/calculations';
import { ExportService } from '../utils/exports';
import { WorkerBalance, AttendanceEntry, Payment } from '../types';

const Reports: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerBalance[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerBalance | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const workersData = await workerService.getWorkersWithBalances();
      setWorkers(workersData);
      
      // Load transactions if date range is selected
      if (dateRange.from && dateRange.to) {
        const [attendanceData, paymentsData] = await Promise.all([
          attendanceService.getAttendanceByDateRange(dateRange.from, dateRange.to),
          paymentService.getPaymentsByDateRange(dateRange.from, dateRange.to)
        ]);
        setAttendanceEntries(attendanceData);
        setPayments(paymentsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    filterTransactions();
  }, [attendanceEntries, payments, selectedWorkerId, dateRange]);

  useEffect(() => {
    if (selectedWorkerId) {
      const worker = workers.find(w => w.id === selectedWorkerId);
      setSelectedWorker(worker || null);
    } else {
      setSelectedWorker(null);
    }
  }, [selectedWorkerId, workers]);

  const filterTransactions = () => {
    // Combine attendance and payment entries into a unified transaction list
    const attendanceTransactions = attendanceEntries.map(entry => ({
      id: entry.id,
      workerId: entry.worker_id,
      date: entry.date,
      type: 'attendance' as const,
      attendance: entry.attendance ? 'present' : 'absent',
      amount: entry.amount,
      balance: entry.balance_after_entry || 0,
      narration: entry.narration || '',
      createdAt: entry.created_at
    }));
    
    const paymentTransactions = payments.map(payment => ({
      id: payment.id,
      workerId: payment.worker_id,
      date: payment.date_of_payment,
      type: 'payment' as const,
      attendance: undefined,
      amount: payment.payment_amount,
      balance: payment.balance_after_payment || 0,
      narration: 'Payment made',
      createdAt: payment.created_at
    }));
    
    let filtered = [...attendanceTransactions, ...paymentTransactions];

    if (selectedWorkerId) {
      filtered = filtered.filter(t => t.workerId === selectedWorkerId);
    }

    if (dateRange.from) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(dateRange.from));
    }

    if (dateRange.to) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(dateRange.to));
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredTransactions(filtered);
  };

  const getTransactionStats = () => {
    const attendanceTransactions = filteredTransactions.filter(t => t.type === 'attendance');
    const paymentTransactions = filteredTransactions.filter(t => t.type === 'payment');

    const totalWages = attendanceTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = paymentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const presentDays = attendanceTransactions.filter(t => t.attendance === 'present').length;
    const absentDays = attendanceTransactions.filter(t => t.attendance === 'absent').length;
    const halfDays = attendanceTransactions.filter(t => t.attendance === 'half-day').length;

    return {
      totalWages,
      totalPayments,
      netAmount: totalWages - totalPayments,
      presentDays,
      absentDays,
      halfDays,
      totalAttendanceDays: attendanceTransactions.length,
      totalTransactions: filteredTransactions.length,
    };
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    const exportData = {
      workers: selectedWorkerId ? workers.filter(w => w.id === selectedWorkerId).map(w => ({
        id: w.id!,
        name: w.name!,
        phone: w.phone || '',
        category: w.category || '',
        subcategory: w.subcategory || '',
        openingBalance: w.opening_balance || 0,
        currentBalance: w.current_balance || 0,
        createdAt: ''
      })) : workers.map(w => ({
        id: w.id!,
        name: w.name!,
        phone: w.phone || '',
        category: w.category || '',
        subcategory: w.subcategory || '',
        openingBalance: w.opening_balance || 0,
        currentBalance: w.current_balance || 0,
        createdAt: ''
      })),
      transactions: filteredTransactions,
      dateRange: dateRange.from && dateRange.to ? dateRange : undefined,
      filters: { workerId: selectedWorkerId }
    };

    if (type === 'csv') {
      ExportService.exportToCSV(exportData);
    } else {
      ExportService.exportToPDF(exportData);
    }
  };

  const clearFilters = () => {
    setSelectedWorkerId('');
    setDateRange({ from: '', to: '' });
  };

  const stats = getTransactionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Detailed worker reports and transaction history</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download size={16} className="mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <div className="h-5 w-5 text-red-600 mr-2">⚠</div>
          <span className="text-red-700">{error}</span>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Worker
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Workers</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} - {worker.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => {
                setDateRange({ ...dateRange, from: e.target.value });
                if (e.target.value && dateRange.to) {
                  loadData();
                }
              }}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => {
                setDateRange({ ...dateRange, to: e.target.value });
                if (dateRange.from && e.target.value) {
                  loadData();
                }
              }}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {(selectedWorkerId || dateRange.from || dateRange.to) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Worker Summary (if specific worker selected) */}
      {selectedWorker && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Worker Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{selectedWorker.name}</div>
              <div className="text-sm text-gray-600">{selectedWorker.category}</div>
              <div className="text-xs text-gray-500">{selectedWorker.subcategory}</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {CalculationService.formatCurrency(selectedWorker.opening_balance || 0)}
              </div>
              <div className="text-sm text-gray-600">Opening Balance</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className={`text-xl font-bold ${(selectedWorker.current_balance || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {CalculationService.formatCurrency(selectedWorker.current_balance || 0)}
              </div>
              <div className="text-sm text-gray-600">Current Balance</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">
                {CalculationService.formatPhone(selectedWorker.phone || "")}
              </div>
              <div className="text-sm text-gray-600">Phone</div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Wages</p>
              <p className="text-2xl font-bold text-green-600">
                {CalculationService.formatCurrency(stats.totalWages)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-red-600">
                {CalculationService.formatCurrency(stats.totalPayments)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present Days</p>
              <p className="text-2xl font-bold text-blue-600">{stats.presentDays}</p>
              <p className="text-xs text-gray-500">
                {stats.halfDays} half days, {stats.absentDays} absent
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Amount</p>
              <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {CalculationService.formatCurrency(stats.netAmount)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Transaction History ({filteredTransactions.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const worker = workers.find(w => w.id === transaction.workerId);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {worker ? worker.name : 'Unknown'}
                      </div>
                      {worker && (
                        <div className="text-sm text-gray-500">
                          {worker.category} - {worker.subcategory}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'attendance' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {transaction.attendance || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span className={transaction.type === 'attendance' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'attendance' ? '+' : '-'}
                        {CalculationService.formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span className={transaction.balance >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {CalculationService.formatCurrency(transaction.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.narration || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or add some transactions to see the report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;