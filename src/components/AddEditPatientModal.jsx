import React, { useState } from 'react';
import api from '../services/api';
import { UserPlus, User, Calendar, Phone, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

const AddEditPatientModal = ({ onClose, patientToEdit = null, onPatientSaved }) => {
  const [formData, setFormData] = useState({
    name: patientToEdit?.name || '',
    lastName: patientToEdit?.lastName || '',
    dateOfBirth: patientToEdit?.dateOfBirth ? patientToEdit.dateOfBirth.split('T')[0] : '',
    gender: patientToEdit?.gender || 'male',
    phone: patientToEdit?.phone || '',
    email: patientToEdit?.email || '',
    address: patientToEdit?.address || '',
    job: patientToEdit?.job || '',
    medicalHistory: patientToEdit?.medicalHistory || '',
    imagesXRay: patientToEdit?.imagesXRay || (patientToEdit?.imageXRay ? [patientToEdit.imageXRay] : [])
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!patientToEdit;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const filePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then((base64Results) => {
      setFormData((prev) => ({
        ...prev,
        imagesXRay: [...(prev.imagesXRay || []), ...base64Results]
      }));
    });
  };

  const removeImageXRay = (index) => {
    setFormData((prev) => ({
      ...prev,
      imagesXRay: prev.imagesXRay.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.lastName || !formData.dateOfBirth || !formData.phone) {
      setError('Le prénom, nom, date de naissance et numéro de téléphone sont obligatoires');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (isEditMode) {
        response = await api.put(`/patients/${patientToEdit._id}`, formData);
      } else {
        response = await api.post('/patients', formData);
      }
      if (onPatientSaved) {
        onPatientSaved(response.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Échec de ${isEditMode ? 'la mise à jour' : "l'ajout"} du patient`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            {isEditMode ? (
              <Edit3 size={24} className="icon-blue" />
            ) : (
              <UserPlus size={24} className="icon-blue" />
            )}
            <h2>{isEditMode ? 'Modifier les Informations du Patient' : 'Ajouter un Nouveau Patient'}</h2>
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
              <label>Prénom *</label>
              <div className="input-group">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="ex. Jean"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nom *</label>
              <div className="input-group">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="ex. Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date de Naissance *</label>
              <div className="input-group">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Genre *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="custom-select">
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Numéro de Téléphone *</label>
              <div className="input-group">
                <Phone size={16} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="ex. 06 12 34 56 78"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Profession / Emploi</label>
              <input
                type="text"
                name="job"
                placeholder="ex. Ingénieur"
                value={formData.job}
                onChange={handleChange}
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email (Optionnel)</label>
              <input
                type="email"
                name="email"
                placeholder="patient@exemple.com"
                value={formData.email}
                onChange={handleChange}
                className="custom-input"
              />
            </div>

            <div className="form-group">
              <label>Adresse</label>
              <input
                type="text"
                name="address"
                placeholder="Ville, Adresse rue"
                value={formData.address}
                onChange={handleChange}
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes Médicales / Historique (Optionnel)</label>
            <textarea
              name="medicalHistory"
              rows="2"
              placeholder="Allergies, conditions chroniques..."
              value={formData.medicalHistory}
              onChange={handleChange}
              className="custom-textarea"
            />
          </div>

          <div className="form-group">
            <label>Radiographies / Images X-Ray du Patient (Optionnel, Multiples)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleFileChange}
              className="custom-input"
            />
            {formData.imagesXRay && formData.imagesXRay.length > 0 && (
              <div className="image-preview-grid" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {formData.imagesXRay.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={img}
                      alt={`Radio ${idx + 1}`}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageXRay(idx)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        lineHeight: '1'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="confirm-btn" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <CheckCircle2 size={18} /> {isEditMode ? 'Enregistrer les Modifications' : 'Enregistrer le Patient'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditPatientModal;
