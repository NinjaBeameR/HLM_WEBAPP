import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { workerService } from '../services/workerService';
import { attendanceService } from '../services/attendanceService';
import { paymentService } from '../services/paymentService';
import { CalculationService } from '../utils/calculations';
import { ExportService } from '../utils/exports';
import { WorkerBalance, AttendanceEntry, Payment } from '../types';

const Dashboard: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerBalance[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    workerId: '',
    category: '',
    subcategory: '',
    dateFrom: '',
    dateTo: '',
  });

  // Default categories
  const categories = [
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
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workers, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [workersData, attendanceData, paymentsData] = await Promise.all([
        workerService.getWorkersWithBalances(),
        filters.dateFrom && filters.dateTo 
          ? attendanceService.getAttendanceByDateRange(filters.dateFrom, filters.dateTo)
          : Promise.resolve([]),
        filters.dateFrom && filters.dateTo 
          ? paymentService.getPaymentsByDateRange(filters.dateFrom, filters.dateTo)
          : Promise.resolve([])
      ]);
      
      setWorkers(workersData);
      setAttendanceEntries(attendanceData);
      setPayments(paymentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workers];

    if (filters.workerId) {
      filtered = filtered.filter(w => w.id === filters.workerId);
    }

    if (filters.category) {
      filtered = filtered.filter(w => w.category === filters.category);
    }

    if (filters.subcategory) {
      filtered = filtered.filter(w => w.subcategory === filters.subcategory);
    }

    setFilteredWorkers(filtered);
  };

  const stats = CalculationService.calculateSummaryStats(
    filteredWorkers.map(w => ({
      id: w.id!,
      name: w.name!,
      phone: w.phone || '',
      category: w.category || '',
      subcategory: w.subcategory || '',
      openingBalance: w.opening_balance || 0,
      currentBalance: w.current_balance || 0,
      createdAt: ''
    })),
    []
  );

  const selectedCategory = categories.find(c => c.name === filters.category);

  const handleExport = (type: 'csv' | 'pdf') => {
    const exportData = {
      workers: filteredWorkers.map(w => ({
        id: w.id!,
        name: w.name!,
        phone: w.phone || '',
        category: w.category || '',
        subcategory: w.subcategory || '',
        openingBalance: w.opening_balance || 0,
        currentBalance: w.current_balance || 0,
        createdAt: ''
      })),
      transactions: [],
      dateRange: filters.dateFrom && filters.dateTo ? {
        from: filters.dateFrom,
        to: filters.dateTo
      } : undefined,
      filters: {
        workerId: filters.workerId,
        category: filters.category,
      }
    };

    if (type === 'csv') {
      ExportService.exportToCSV(exportData);
    } else {
      ExportService.exportToPDF(exportData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your labour management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
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
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Worker
            </label>
            <select
              value={filters.workerId}
              onChange={(e) => setFilters({ ...filters, workerId: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Workers</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, subcategory: '' })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <select
              value={filters.subcategory}
              onChange={(e) => setFilters({ ...filters, subcategory: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!filters.category}
            >
              <option value="">All Subcategories</option>
              {selectedCategory?.subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {(filters.workerId || filters.category || filters.dateFrom || filters.dateTo) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setFilters({ workerId: '', category: '', subcategory: '', dateFrom: '', dateTo: '' })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">I Owe Them</p>
              <p className="text-2xl font-bold text-red-600">
                {CalculationService.formatCurrency(stats.totalIOweThem)}
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
              <p className="text-sm font-medium text-gray-600">They Owe Me</p>
              <p className="text-2xl font-bold text-green-600">
                {CalculationService.formatCurrency(stats.totalTheyOweMe)}
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
              <p className="text-sm font-medium text-gray-600">Total Workers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.workersCount}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeWorkers} active</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Wages</p>
              <p className="text-2xl font-bold text-orange-600">
                {CalculationService.formatCurrency(stats.totalWagesGiven)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Workers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Workers Overview ({filteredWorkers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkers.map((worker) => {
                const balanceStatus = CalculationService.getBalanceStatus(worker.current_balance || 0);
                
                return (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                        <div className="text-sm text-gray-500">{worker.subcategory}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {worker.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {CalculationService.formatPhone(worker.phone || "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {CalculationService.formatCurrency(worker.opening_balance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span className={(worker.current_balance || 0) >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {CalculationService.formatCurrency(worker.current_balance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${balanceStatus.color}`}>
                        {balanceStatus.message}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredWorkers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or add some workers to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;