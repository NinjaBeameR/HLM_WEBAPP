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
import { StorageService } from '../utils/storage';
import { CalculationService } from '../utils/calculations';
import { ExportService } from '../utils/exports';
import { Worker, Transaction, Category } from '../types';

const Dashboard: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [filters, setFilters] = useState({
    workerId: '',
    category: '',
    subcategory: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workers, filters]);

  const loadData = () => {
    const loadedWorkers = StorageService.getWorkers();
    const loadedTransactions = StorageService.getTransactions();
    const loadedCategories = StorageService.getCategories();

    setWorkers(loadedWorkers);
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
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

  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    if (filters.workerId) {
      filtered = filtered.filter(t => t.workerId === filters.workerId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    }

    if (filters.category) {
      const categoryWorkerIds = workers
        .filter(w => w.category === filters.category)
        .map(w => w.id);
      filtered = filtered.filter(t => categoryWorkerIds.includes(t.workerId));
    }

    return filtered;
  };

  const stats = CalculationService.calculateSummaryStats(filteredWorkers, getFilteredTransactions());

  const selectedCategory = categories.find(c => c.name === filters.category);

  const handleExport = (type: 'csv' | 'pdf') => {
    const exportData = {
      workers: filteredWorkers,
      transactions: getFilteredTransactions(),
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      {/* Minimal Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600">I Owe Them</p>
          <p className="text-xl font-bold text-red-600">
            {CalculationService.formatCurrency(stats.totalIOweThem)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600">They Owe Me</p>
          <p className="text-xl font-bold text-green-600">
            {CalculationService.formatCurrency(stats.totalTheyOweMe)}
          </p>
        </div>
      </div>
      {/* Workers Table Only */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Workers Overview ({filteredWorkers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkers.map((worker) => {
                const balanceStatus = CalculationService.getBalanceStatus(worker.currentBalance);
                return (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                        <div className="text-xs text-gray-500">{worker.subcategory}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{worker.category}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{CalculationService.formatPhone(worker.phone)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{CalculationService.formatCurrency(worker.openingBalance)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-right">
                      <span className={worker.currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {CalculationService.formatCurrency(worker.currentBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
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
              <p className="mt-1 text-sm text-gray-500">Add some workers to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;