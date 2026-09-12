import React, { useState } from 'react';
import api from '../services/api';
import { UserPlus, User, Calendar, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

const AddPatientModal = ({ onClose, onPatientAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    medicalHistory: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Secretary registers patient -> backend automatically sets status: 'waiting'
      const response = await api.post('/patients', formData);
      onPatientAdded(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add patient to queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <UserPlus size={24} className="icon-blue" />
            <h2>Add Patient to Waiting Queue</h2>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="patient-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <div className="input-group">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. John"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <div className="input-group">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <div className="input-group">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="custom-select">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-group">
                <Phone size={16} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. +1 555 0192"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email (Optional)</label>
              <input
                type="email"
                name="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={handleChange}
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Medical History / Notes (Optional)</label>
            <textarea
              name="medicalHistory"
              rows="2"
              placeholder="Allergies, chronic conditions..."
              value={formData.medicalHistory}
              onChange={handleChange}
              className="custom-textarea"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="confirm-btn" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Add to Queue (Waiting)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
