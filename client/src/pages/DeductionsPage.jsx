/**
 * Deductions Tracker Page
 * 
 * Track tax deductions under various sections with visual progress bars.
 * Sections: 80C, 80D, 80CCD(1B), 80E, 80G
 * CRUD operations for deduction entries.
 */

import { useState, useEffect } from 'react';
import API from '../config/api';
import { formatCurrency, DEDUCTION_LIMITS } from '../utils/taxCalculations';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineX } from 'react-icons/hi';

const DeductionsPage = () => {
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    section: '80C',
    amount: '',
    description: '',
  });

  /**
   * Fetch all deductions on mount
   */
  useEffect(() => {
    fetchDeductions();
  }, []);

  const fetchDeductions = async () => {
    try {
      const response = await API.get('/deductions?fy=2025-26');
      setDeductions(response.data);
    } catch (error) {
      toast.error('Failed to load deductions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add or update a deduction
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      toast.error('Amount and description are required');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/deductions/${editingId}`, formData);
        toast.success('Deduction updated!');
      } else {
        await API.post('/deductions', { ...formData, financialYear: '2025-26' });
        toast.success('Deduction added!');
      }

      // Reset form and refresh
      setFormData({ section: '80C', amount: '', description: '' });
      setShowForm(false);
      setEditingId(null);
      fetchDeductions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save deduction');
    }
  };

  /**
   * Delete a deduction
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deduction?')) return;

    try {
      await API.delete(`/deductions/${id}`);
      toast.success('Deduction deleted');
      fetchDeductions();
    } catch (error) {
      toast.error('Failed to delete deduction');
    }
  };

  /**
   * Edit a deduction — pre-fill the form
   */
  const handleEdit = (deduction) => {
    setFormData({
      section: deduction.section,
      amount: deduction.amount,
      description: deduction.description,
    });
    setEditingId(deduction._id);
    setShowForm(true);
  };

  /**
   * Group deductions by section and calculate totals
   */
  const getGroupedDeductions = () => {
    const grouped = {};

    // Initialize all sections
    Object.keys(DEDUCTION_LIMITS).forEach((section) => {
      grouped[section] = { items: [], total: 0 };
    });

    // Group deductions
    deductions.forEach((d) => {
      if (grouped[d.section]) {
        grouped[d.section].items.push(d);
        grouped[d.section].total += d.amount;
      }
    });

    return grouped;
  };

  const grouped = getGroupedDeductions();
  const totalAll = deductions.reduce((sum, d) => sum + d.amount, 0);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-heading mb-0">Deductions Tracker</h1>
            <p className="text-gray-600">FY 2025-26 — Track your tax-saving investments</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ section: '80C', amount: '', description: '' }); }}
            className="btn-primary flex items-center"
          >
            <HiOutlinePlus className="w-5 h-5 mr-1" />
            Add Deduction
          </button>
        </div>

        {/* Total Summary */}
        <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white mb-8">
          <p className="text-sm text-blue-200 uppercase tracking-wide">Total Deductions Claimed</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalAll)}</p>
          <p className="text-sm text-blue-200 mt-1">
            {deductions.length} deduction{deductions.length !== 1 ? 's' : ''} across {Object.keys(grouped).filter((s) => grouped[s].items.length > 0).length} sections
          </p>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="card mb-6 border-2 border-primary-200 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Deduction' : 'Add New Deduction'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">Section</label>
                <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="input-field">
                  {Object.entries(DEDUCTION_LIMITS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Amount (₹)</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-field" placeholder="e.g., 50000" required />
              </div>
              <div>
                <label className="input-label">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" placeholder="e.g., PPF contribution" required />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update' : 'Add'} Deduction
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section Cards */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([section, data]) => {
            const limit = DEDUCTION_LIMITS[section];
            const percentage = limit.limit === Infinity
              ? 0
              : Math.min((data.total / limit.limit) * 100, 100);
            const isMaxed = limit.limit !== Infinity && data.total >= limit.limit;

            return (
              <div key={section} className="card">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{limit.label}</h3>
                    <p className="text-sm text-gray-500">{limit.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(data.total)}</p>
                    {limit.limit !== Infinity && (
                      <p className="text-xs text-gray-500">of {formatCurrency(limit.limit)}</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {limit.limit !== Infinity && (
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isMaxed ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}

                {/* Deduction Items */}
                {data.items.length > 0 ? (
                  <div className="space-y-2">
                    {data.items.map((item) => (
                      <div key={item._id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-700">{item.description}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                          <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-primary-500">
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-500">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No deductions added yet</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DeductionsPage;
