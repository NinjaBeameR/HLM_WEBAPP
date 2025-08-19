import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  User, 
  Calendar, 
  DollarSign,
  Save,
  AlertCircle,
  CheckCircle,
  Receipt
} from 'lucide-react';
import { workerService } from '../services/workerService';
import { paymentService } from '../services/paymentService';
import { CalculationService } from '../utils/calculations';
import { WorkerBalance } from '../types';

const Payments: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedWorker, setSelectedWorker] = useState<WorkerBalance | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      setSelectedWorker(worker || null);
    } else {
      setSelectedWorker(null);
    }
  }, [formData.workerId, workers]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.workerId) {
      newErrors.workerId = 'Please select a worker';
    }

    if (!formData.date) {
      newErrors.date = 'Payment date is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Payment amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Payment amount must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      const amount = parseFloat(formData.amount);

      await paymentService.createPayment({
        worker_id: formData.workerId,
        date_of_payment: formData.date,
        payment_amount: amount,
      });

      // Reset form
      setFormData({
        workerId: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
      });

      // Reload workers to get updated balances
      await loadData();
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      setError(error instanceof Error ? error.message : 'Error recording payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const projectedBalance = selectedWorker && formData.amount ? 
  (selectedWorker.current_balance ?? 0) - parseFloat(formData.amount) :
    selectedWorker?.current_balance || 0;

  const currentBalanceStatus = selectedWorker ? 
  CalculationService.getBalanceStatus(selectedWorker.current_balance ?? 0) : null;
    
  const projectedBalanceStatus = selectedWorker && formData.amount ? 
    CalculationService.getBalanceStatus(projectedBalance) : null;

  const workersWithBalance = workers.filter(w => w.current_balance !== 0);

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
        <h1 className="text-3xl font-bold text-gray-900">Payment Processing</h1>
        <p className="text-gray-600 mt-1">Record payments made to workers</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Workers with Balance</p>
              <p className="text-2xl font-bold text-blue-600">{workersWithBalance.length}</p>
            </div>
            <Receipt className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {CalculationService.formatCurrency(
                  workers.filter(w => (w.current_balance ?? 0) > 0)
                    .reduce((sum, w) => sum + (w.current_balance ?? 0), 0)
                )}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="mr-2" size={20} />
            Record Payment
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
              {workers.map(worker => {
                const balanceInfo = CalculationService.getBalanceStatus(worker.current_balance ?? 0);
                return (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} - {balanceInfo.message}
                  </option>
                );
              })}
            </select>
            {errors.workerId && <p className="mt-1 text-sm text-red-600">{errors.workerId}</p>}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Payment Date *
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

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign size={16} className="inline mr-1" />
              Payment Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter payment amount"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* Balance Information */}
          {selectedWorker && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Balance Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Balance:</span>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      (selectedWorker.current_balance ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {CalculationService.formatCurrency(selectedWorker.current_balance ?? 0)}
                    </span>
                    {currentBalanceStatus && (
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${currentBalanceStatus.color}`}>
                          {currentBalanceStatus.message}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {formData.amount && (
                  <>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">After Payment:</span>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${
                          projectedBalance >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {CalculationService.formatCurrency(projectedBalance)}
                        </span>
                        {projectedBalanceStatus && (
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${projectedBalanceStatus.color}`}>
                              {projectedBalanceStatus.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {formData.amount && parseFloat(formData.amount) > (selectedWorker.current_balance ?? 0) && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm text-orange-800">
                      Payment amount exceeds current balance. Worker will owe you money.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!selectedWorker}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
            >
              <Save size={20} className="mr-2" />
              Record Payment
            </button>
          </div>
        </form>
      </div>

      {/* Workers with Outstanding Balances */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Workers with Outstanding Balances</h3>
        </div>
        
        <div className="p-6">
          {workersWithBalance.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">All Settled!</h4>
              <p className="mt-1 text-sm text-gray-500">No outstanding balances to clear.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workersWithBalance.map(worker => {
                const balanceStatus = CalculationService.getBalanceStatus(worker.current_balance ?? 0);
                return (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setFormData({ ...formData, workerId: worker.id })}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                      <div className="text-xs text-gray-500">{worker.category} - {worker.subcategory}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        (worker.current_balance ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {CalculationService.formatCurrency(worker.current_balance ?? 0)}
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${balanceStatus.color}`}>
                          {balanceStatus.message}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Payment</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Worker:</span>
                  <span className="font-medium">{selectedWorker.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Amount:</span>
                  <span className="font-medium">{CalculationService.formatCurrency(parseFloat(formData.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className={`font-medium ${(selectedWorker.current_balance ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {CalculationService.formatCurrency(selectedWorker.current_balance ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">New Balance:</span>
                  <span className={`font-semibold ${projectedBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {CalculationService.formatCurrency(projectedBalance)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;