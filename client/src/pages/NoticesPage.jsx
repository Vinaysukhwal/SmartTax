/**
 * Notice Tracker Page
 * 
 * Track income tax notices from the IT department.
 * Add notices, update status, filter by status.
 */

import { useState, useEffect } from 'react';
import API from '../config/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineBell, HiOutlineExclamation } from 'react-icons/hi';

const NoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    noticeType: '',
    dateReceived: '',
    dueDate: '',
    notes: '',
  });

  // Notice type options
  const noticeTypes = [
    'Intimation u/s 143(1)',
    'Scrutiny Notice u/s 143(2)',
    'Defective Return u/s 139(9)',
    'Demand Notice u/s 156',
    'Reassessment u/s 148',
    'Penalty Notice u/s 271',
    'Other',
  ];

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await API.get('/notices');
      setNotices(response.data);
    } catch (error) {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new notice
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.noticeType || !formData.dateReceived || !formData.dueDate) {
      toast.error('All fields are required');
      return;
    }

    try {
      await API.post('/notices', formData);
      toast.success('Notice added!');
      setFormData({ noticeType: '', dateReceived: '', dueDate: '', notes: '' });
      setShowForm(false);
      fetchNotices();
    } catch (error) {
      toast.error('Failed to add notice');
    }
  };

  /**
   * Update notice status
   */
  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.put(`/notices/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchNotices();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  /**
   * Delete a notice
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;

    try {
      await API.delete(`/notices/${id}`);
      toast.success('Notice deleted');
      fetchNotices();
    } catch (error) {
      toast.error('Failed to delete notice');
    }
  };

  // Filter notices by status
  const filteredNotices = filter === 'all'
    ? notices
    : notices.filter((n) => n.status === filter);

  // Status badge styles
  const statusStyles = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Responded: 'bg-blue-100 text-blue-800',
    Resolved: 'bg-green-100 text-green-800',
  };

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
            <h1 className="section-heading mb-0">Notice Tracker</h1>
            <p className="text-gray-600">Track income tax notices and their responses</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <HiOutlinePlus className="w-5 h-5 mr-1" />
            Add Notice
          </button>
        </div>

        {/* Pending Notices Alert */}
        {notices.filter((n) => n.status === 'Pending').length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <HiOutlineExclamation className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-800 text-sm">
              <strong>{notices.filter((n) => n.status === 'Pending').length} pending</strong> notice{notices.filter((n) => n.status === 'Pending').length > 1 ? 's' : ''} — respond before the due date to avoid penalties.
            </p>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="card mb-6 border-2 border-primary-200 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Notice</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Notice Type</label>
                <select value={formData.noticeType} onChange={(e) => setFormData({ ...formData, noticeType: e.target.value })} className="input-field" required>
                  <option value="">Select notice type</option>
                  {noticeTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Date Received</label>
                <input type="date" value={formData.dateReceived} onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Due Date</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Notes (optional)</label>
                <input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" placeholder="Any additional details" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="btn-primary">Add Notice</button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['all', 'Pending', 'Responded', 'Resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
              {status !== 'all' && (
                <span className="ml-1.5">({notices.filter((n) => n.status === status).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Notices List */}
        {filteredNotices.length > 0 ? (
          <div className="space-y-4">
            {filteredNotices.map((notice) => {
              const isOverdue = notice.status === 'Pending' && new Date(notice.dueDate) < new Date();
              return (
                <div key={notice._id} className={`card ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{notice.noticeType}</h3>
                        <span className={`badge ${statusStyles[notice.status]}`}>{notice.status}</span>
                        {isOverdue && <span className="badge bg-red-100 text-red-800">⚠ Overdue</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                        <span>Received: {new Date(notice.dateReceived).toLocaleDateString('en-IN')}</span>
                        <span>Due: {new Date(notice.dueDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      {notice.notes && (
                        <p className="text-sm text-gray-600 mt-2">{notice.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Status Dropdown */}
                      <select
                        value={notice.status}
                        onChange={(e) => handleStatusChange(notice._id, e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary-300"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Responded">Responded</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <button
                        onClick={() => handleDelete(notice._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <HiOutlineBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notices found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter !== 'all' ? 'Try a different filter' : 'Add notices you receive from the IT department'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticesPage;
