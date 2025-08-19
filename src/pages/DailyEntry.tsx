import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  DollarSign, 
  FileText,
  Save,
  Plus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { workerService } from '../services/workerService';
import { attendanceService } from '../services/attendanceService';
import { CalculationService } from '../utils/calculations';
import { WorkerBalance } from '../types';

const DailyEntry: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    attendance: 'present',
    amount: '',
    narration: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentBalance, setCurrentBalance] = useState<number>(0);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workers');
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (formData.workerId) {
      const worker = workers.find(w => w.id === formData.workerId);
      if (worker) {
        setSelectedWorker(worker);
  setCurrentBalance(worker.current_balance ?? 0);
      }
    } else {
      setSelectedWorker(null);
      setCurrentBalance(0);
    }
  }, [formData.workerId, workers]);

  useEffect(() => {
    // Calculate projected balance based on form data
    if (selectedWorker && formData.amount) {
      const amount = parseFloat(formData.amount) || 0;
      const attendanceAmount = CalculationService.getAttendanceAmount(formData.attendance, amount);
  setCurrentBalance((selectedWorker.current_balance ?? 0) + attendanceAmount);
    } else if (selectedWorker) {
  setCurrentBalance(selectedWorker.current_balance ?? 0);
    }
  }, [selectedWorker, formData.amount, formData.attendance]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.workerId) {
      newErrors.workerId = 'Please select a worker';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) < 0) {
      newErrors.amount = 'Amount must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError('');
      
      const baseAmount = parseFloat(formData.amount);
      const finalAmount = CalculationService.getAttendanceAmount(formData.attendance, baseAmount);

      // Check if attendance already exists for this worker on this date
      const attendanceExists = await attendanceService.checkAttendanceExists(formData.workerId, formData.date);
      if (attendanceExists) {
        setError('Attendance already recorded for this worker on this date');
        return;
      }

      await attendanceService.createAttendanceEntry({
        worker_id: formData.workerId,
        date: formData.date,
        attendance: formData.attendance === 'present',
        amount: finalAmount,
        narration: formData.narration.trim(),
      });

      // Reset form
      setFormData({
        workerId: '',
        date: new Date().toISOString().split('T')[0],
        attendance: 'present',
        amount: '',
        narration: '',
      });

      // Reload workers to get updated balances
      await loadData();
    } catch (error) {
      console.error('Error adding entry:', error);
      setError(error instanceof Error ? error.message : 'Error adding entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAttendanceIcon = (attendance: string) => {
    switch (attendance) {
      case 'present':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'absent':
        return <XCircle className="text-red-600" size={20} />;
      case 'half-day':
        return <Clock className="text-orange-600" size={20} />;
      default:
        return <CheckCircle className="text-green-600" size={20} />;
    }
  };

  const getAttendanceColor = (attendance: string) => {
    switch (attendance) {
      case 'present':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'absent':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'half-day':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const projectedAmount = formData.amount ? 
    CalculationService.getAttendanceAmount(formData.attendance, parseFloat(formData.amount)) : 0;

  const balanceStatus = CalculationService.getBalanceStatus(currentBalance);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workers...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Daily Entry</h1>
        <p className="text-gray-600 mt-1">Record worker attendance and wages</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Plus className="mr-2" size={20} />
            New Attendance Entry
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Worker Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Select Worker *
            </label>
            <select
              value={formData.workerId}
              onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
              className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.workerId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Choose a worker...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} - {worker.category} ({worker.subcategory})
                </option>
              ))}
            </select>
            {errors.workerId && <p className="mt-1 text-sm text-red-600">{errors.workerId}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* Attendance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attendance Status *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['present', 'absent', 'half-day'].map((attendance) => (
                <label
                  key={attendance}
                  className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.attendance === attendance
                      ? getAttendanceColor(attendance)
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value={attendance}
                    checked={formData.attendance === attendance}
                    onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    {getAttendanceIcon(attendance)}
                    <span className="text-sm font-medium capitalize">
                      {attendance === 'half-day' ? 'Half Day' : attendance}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign size={16} className="inline mr-1" />
              Daily Wage Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter daily wage"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
            
            {projectedAmount !== parseFloat(formData.amount || '0') && formData.amount && (
              <p className="mt-1 text-sm text-blue-600">
                Effective amount: {CalculationService.formatCurrency(projectedAmount)} 
                ({formData.attendance === 'half-day' ? '50% for half day' : 
                  formData.attendance === 'absent' ? 'No amount for absent' : 'Full amount'})
              </p>
            )}
          </div>

          {/* Narration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Notes (Optional)
            </label>
            <textarea
              value={formData.narration}
              onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or comments..."
            />
          </div>

          {/* Current Balance Display */}
          {selectedWorker && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Balance Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Balance:</span>
                  <p className={`font-semibold ${(selectedWorker.current_balance ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {CalculationService.formatCurrency(selectedWorker.current_balance ?? 0)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">After This Entry:</span>
                  <p className={`font-semibold ${currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {CalculationService.formatCurrency(currentBalance)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${balanceStatus.color}`}>
                  {balanceStatus.message}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Attendance Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Stats */}
      {workers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Workers:</span>
              <p className="text-xl font-bold text-blue-600">{workers.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Active Workers:</span>
              <p className="text-xl font-bold text-green-600">
                {workers.filter(w => w.current_balance !== 0).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyEntry;