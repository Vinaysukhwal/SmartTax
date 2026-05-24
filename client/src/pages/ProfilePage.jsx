/**
 * Profile Page
 * 
 * Displays and allows editing of user profile information.
 * Fields: name, email (read-only), PAN (read-only), phone, address.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../config/api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlineIdentification, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pan: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Load user data into form on mount
   */
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        pan: user.pan || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        pincode: user.address?.pincode || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Save profile changes
   */
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await API.put('/user/profile', {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
      });

      updateUser(response.data);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container animate-fadeIn">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-heading mb-0">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary">
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="card mb-6 flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <HiOutlineUser className="w-5 h-5 mr-2 text-primary-500" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="input-field disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="input-label flex items-center">
                <HiOutlineMail className="w-4 h-4 mr-1" />
                Email
                <span className="text-xs text-gray-400 ml-2">(cannot be changed)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="input-field bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="input-label flex items-center">
                <HiOutlineIdentification className="w-4 h-4 mr-1" />
                PAN Number
                <span className="text-xs text-gray-400 ml-2">(cannot be changed)</span>
              </label>
              <input
                type="text"
                value={formData.pan}
                disabled
                className="input-field bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="input-label flex items-center">
                <HiOutlinePhone className="w-4 h-4 mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="9876543210"
                className="input-field disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <HiOutlineLocationMarker className="w-5 h-5 mr-2 text-primary-500" />
            Address
          </h3>
          <div className="space-y-5">
            <div>
              <label className="input-label">Street Address</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="123, Main Street"
                className="input-field disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="input-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Mumbai"
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="input-label">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Maharashtra"
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="input-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="400001"
                  maxLength={6}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
