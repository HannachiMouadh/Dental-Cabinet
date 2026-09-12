import React, { useState } from 'react';
import api from '../services/api';
import { User, Lock, Mail, Phone, Calendar, Stethoscope, ClipboardList, UserPlus, LogIn, Sparkles } from 'lucide-react';

const AuthModal = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    role: 'secretary',
    phone: '',
    dateOfBirth: '',
    gender: 'male'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register API call
        await api.post('/users/register', formData);
        // Automatically switch to login or perform login after registration
        const loginRes = await api.post('/users/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('accessToken', loginRes.data.accessToken);
        localStorage.setItem('refreshToken', loginRes.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
        onLoginSuccess(loginRes.data.user);
      } else {
        // Login API call
        const loginRes = await api.post('/users/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('accessToken', loginRes.data.accessToken);
        localStorage.setItem('refreshToken', loginRes.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
        onLoginSuccess(loginRes.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de l\'authentification. Veuillez vérifier vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles className="icon-glow" size={32} />
            <h1>DentalCare Pro</h1>
          </div>
          <p className="auth-subtitle">
            {isRegister ? 'Créer un compte (Médecin ou Secrétaire)' : 'Se connecter pour accéder à la gestion du cabinet'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <div className="form-row">
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Prénom"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="role-selector">
                <label className="role-label">Sélectionnez Votre Rôle :</label>
                <div className="role-options">
                  <label className={`role-card ${formData.role === 'secretary' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="secretary"
                      checked={formData.role === 'secretary'}
                      onChange={handleChange}
                    />
                    <ClipboardList size={20} />
                    <span>Secrétaire</span>
                  </label>
                  <label className={`role-card ${formData.role === 'doctor' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="doctor"
                      checked={formData.role === 'doctor'}
                      onChange={handleChange}
                    />
                    <Stethoscope size={20} />
                    <span>Médecin</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Numéro de Téléphone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Adresse Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : isRegister ? (
              <>
                <UserPlus size={18} /> Créer le Compte
              </>
            ) : (
              <>
                <LogIn size={18} /> Se Connecter
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isRegister ? 'Vous avez déjà un compte ?' : "Vous n'avez pas encore de compte ?"}{' '}
            <button
              type="button"
              className="toggle-auth-btn"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
            >
              {isRegister ? 'Se Connecter' : 'Créer un Compte'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
