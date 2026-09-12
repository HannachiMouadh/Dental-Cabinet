import React, { useState } from 'react';
import api from '../services/api';
import { User, Phone, Mail, Stethoscope, Lock, X, Save, UserCog } from 'lucide-react';

const EditProfileModal = ({ user, onClose, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialty: user?.specialty || (user?.role === 'doctor' ? 'Médecin Dentiste' : 'Secrétaire'),
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const userId = user.id || user._id;
      const res = await api.put(`/users/profile/${userId}`, formData);
      const updatedUser = res.data.user;

      // Preserve local storage & session
      const existingStorage = localStorage.getItem('user');
      const parsed = existingStorage ? JSON.parse(existingStorage) : {};
      const newUserData = { ...parsed, ...updatedUser };
      
      localStorage.setItem('user', JSON.stringify(newUserData));
      setSuccessMsg('Profil mis à jour avec succès !');

      if (onProfileUpdated) {
        onProfileUpdated(newUserData);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <UserCog className="icon-glow" size={24} style={{ color: '#38bdf8' }} />
            <h2>Modifier le Profil ({user?.role === 'doctor' ? 'Médecin' : 'Secrétaire'})</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="patient-form">
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <div className="input-group">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Prénom"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nom</label>
              <div className="input-group">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Adresse Email</label>
            <div className="input-group">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemple.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Numéro de Téléphone (Tél)</label>
              <div className="input-group">
                <Phone className="input-icon" size={16} />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="75 370 971 / 94 035 783"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Spécialité / Titre</label>
              <div className="input-group">
                <Stethoscope className="input-icon" size={16} />
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="ex. Médecin Dentiste"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Nouveau Mot de Passe (Optionnel)</label>
            <div className="input-group">
              <Lock className="input-icon" size={16} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Laissez vide pour conserver l'actuel"
              />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="confirm-btn" disabled={loading}>
              <Save size={16} /> {loading ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
