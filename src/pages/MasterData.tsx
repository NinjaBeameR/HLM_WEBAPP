import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Save,
  X,
  User,
  Phone,
  DollarSign,
  Tag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { workerService } from '../services/workerService';
import { CalculationService } from '../utils/calculations';
import { WorkerBalance } from '../types';


const MasterData: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerBalance | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    opening_balance: 0,
    category: '',
    subcategory: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      opening_balance: 0,
      category: '',
      subcategory: '',
    });
    setErrors({});
    setEditingWorker(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Worker name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    } else {
      // Check for duplicate phone number
      const existingWorker = workers.find(w => 
        w.phone === formData.phone && 
        (!editingWorker || w.id !== editingWorker.id)
      );
      if (existingWorker) {
        newErrors.phone = 'Phone number already exists';
      }
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.subcategory) {
      newErrors.subcategory = 'Subcategory is required';
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
      
      if (editingWorker) {
        // Update existing worker (excluding opening balance and other immutable fields)
        await workerService.updateWorker(editingWorker.id!, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          category: formData.category,
          subcategory: formData.subcategory,
        });
      } else {
        // Add new worker
        await workerService.createWorker({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          opening_balance: formData.opening_balance,
          category: formData.category,
          subcategory: formData.subcategory,
        });
      }
      
      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving worker:', error);
      setError(error instanceof Error ? error.message : 'Error saving worker. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (worker: WorkerBalance) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name || '',
      phone: worker.phone || '',
      opening_balance: worker.opening_balance || 0,
      category: worker.category || '',
      subcategory: worker.subcategory || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (worker: WorkerBalance) => {
    if (window.confirm(`Are you sure you want to delete ${worker.name}? This will also delete all related transactions.`)) {
      try {
        setError('');
        await workerService.deleteWorker(worker.id!);
        await loadData();
      } catch (error) {
        console.error('Error deleting worker:', error);
        setError(error instanceof Error ? error.message : 'Error deleting worker. Please try again.');
      }
    }
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.phone?.includes(searchTerm);
    const matchesCategory = !selectedCategory || worker.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCategoryData = categories.find(c => c.name === formData.category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Worker Master</h1>
          <p className="text-gray-600 mt-1">Manage your worker records and details</p>
        </div>
        <button
          onClick={openModal}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Worker
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading workers...</span>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkers.map((worker) => {
                const balanceStatus = CalculationService.getBalanceStatus(worker.current_balance || 0);
                
                return (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                          <div className="text-sm text-gray-500">ID: {worker.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{worker.category}</div>
                      <div className="text-sm text-gray-500">{worker.subcategory}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {CalculationService.formatPhone(worker.phone || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {CalculationService.formatCurrency(worker.opening_balance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium ${
                        (worker.current_balance || 0) >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {CalculationService.formatCurrency(worker.current_balance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(worker)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded"
                          title="Edit Worker"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(worker)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
                          title="Delete Worker"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredWorkers.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory ? 'Try adjusting your search criteria.' : 'Get started by adding a new worker.'}
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  Worker Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter worker name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone number"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag size={16} className="inline mr-1" />
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                  className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory *
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className={`w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.subcategory ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!formData.category}
                >
                  <option value="">Select Subcategory</option>
                  {selectedCategoryData?.subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                {errors.subcategory && <p className="mt-1 text-sm text-red-600">{errors.subcategory}</p>}
              </div>

              {!editingWorker && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign size={16} className="inline mr-1" />
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Opening balance can only be set during worker creation
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {editingWorker ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {editingWorker ? 'Update' : 'Add'} Worker
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;