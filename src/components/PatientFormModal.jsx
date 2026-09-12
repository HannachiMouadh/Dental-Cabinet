import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { TeethSVG } from './TeethSVG';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  X,
  Save,
  Activity,
  User,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  Edit3
} from 'lucide-react';
import api from '../services/api';
import './PatientFormModal.css';

const PatientFormModal = ({ user, patient, onClose, onPatientUpdated }) => {
  const [activeTab, setActiveTab] = useState('medicalCard'); // 'medicalCard' | 'toothDetail' | 'pdfPreview'
  const [formData, setFormData] = useState({
    name: patient.name || '',
    lastName: patient.lastName || '',
    dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
    job: patient.job || '',
    phone: patient.phone || '',
    email: patient.email || '',
    address: patient.address || '',
    HTA: patient.HTA || false,
    Diabete: patient.Diabete || false,
    Tabac: patient.Tabac || false,
    Autre: patient.Autre || '',
    presentMedications: patient.presentMedications || '',
    imageXRay: patient.imageXRay || '',
    imagesXRay: patient.imagesXRay || (patient.imageXRay ? [patient.imageXRay] : []),
    treatmentSessions: patient.treatmentSessions || [
      { date: new Date().toISOString().split('T')[0], acte: '', doit: '', recu: '' }
    ],
    teethNotes: patient.teethNotes || {},
    teethConditions: patient.teethConditions || {}
  });

  // FDI to Sequential # mapping helper
  const fdiToSeqMap = {
    // Upper Right (Adult 1-8)
    '18': '1', '17': '2', '16': '3', '15': '4', '14': '5', '13': '6', '12': '7', '11': '8',
    // Upper Left (Adult 9-16)
    '21': '9', '22': '10', '23': '11', '24': '12', '25': '13', '26': '14', '27': '15', '28': '16',
    // Lower Left (Adult 17-24)
    '38': '17', '37': '18', '36': '19', '35': '20', '34': '21', '33': '22', '32': '23', '31': '24',
    // Lower Right (Adult 25-32)
    '41': '25', '42': '26', '43': '27', '44': '28', '45': '29', '46': '30', '47': '31', '48': '32',
    // Baby dentition (1-20)
    '55': 'Baby 1', '54': 'Baby 2', '53': 'Baby 3', '52': 'Baby 4', '51': 'Baby 5',
    '61': 'Baby 6', '62': 'Baby 7', '63': 'Baby 8', '64': 'Baby 9', '65': 'Baby 10',
    '75': 'Baby 11', '74': 'Baby 12', '73': 'Baby 13', '72': 'Baby 14', '71': 'Baby 15',
    '81': 'Baby 16', '82': 'Baby 17', '83': 'Baby 18', '84': 'Baby 19', '85': 'Baby 20'
  };

  const getToothDisplayLabel = (fdi) => {
    const seq = fdiToSeqMap[fdi];
    return seq ? `#${seq} (FDI ${fdi})` : `FDI ${fdi}`;
  };

  const [selectedTooth, setSelectedTooth] = useState('11');
  const [toothCondition, setToothCondition] = useState('Healthy');
  const [toothNoteInput, setToothNoteInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [ordonnanceText, setOrdonnanceText] = useState(patient.ordonnanceText || '');

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Treatment Session row handling
  const handleSessionChange = (index, field, value) => {
    const updated = [...formData.treatmentSessions];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, treatmentSessions: updated }));
  };

  const addSessionRow = () => {
    setFormData((prev) => ({
      ...prev,
      treatmentSessions: [
        ...prev.treatmentSessions,
        { date: new Date().toISOString().split('T')[0], acte: '', doit: '', recu: '' }
      ]
    }));
  };

  const removeSessionRow = (index) => {
    const updated = formData.treatmentSessions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, treatmentSessions: updated }));
  };

  // Multiple Images X-Ray upload handler
  const handleMultipleImagesUpload = (e) => {
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

  // Tooth selection and note updating
  const handleSelectTooth = (toothNum) => {
    setSelectedTooth(toothNum);
    setToothNoteInput(formData.teethNotes[toothNum] || '');
    setToothCondition(formData.teethConditions[toothNum] || 'Healthy');
  };

  const handleToothInputChange = (fdiNumber, val) => {
    const updatedNotes = {
      ...formData.teethNotes,
      [fdiNumber]: val
    };
    setFormData((prev) => ({ ...prev, teethNotes: updatedNotes }));
    if (selectedTooth === fdiNumber) {
      setToothNoteInput(val);
    }
  };

  const handleSaveToothNote = () => {
    const updatedNotes = {
      ...formData.teethNotes,
      [selectedTooth]: toothNoteInput
    };
    const updatedConditions = {
      ...formData.teethConditions,
      [selectedTooth]: toothCondition
    };
    setFormData((prev) => ({
      ...prev,
      teethNotes: updatedNotes,
      teethConditions: updatedConditions
    }));
  };

  // Save to DB
  const handleSavePatientRecord = async () => {
    setIsSaving(true);
    try {
      const payload = { ...formData, ordonnanceText };
      const res = await api.put(`/patients/${patient._id}`, payload);
      if (onPatientUpdated) onPatientUpdated(res.data);
      alert('Dossier médical et Ordonnance enregistrés avec succès !');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement du dossier');
    } finally {
      setIsSaving(false);
    }
  };

  // Export Ordonnance PDF with html2pdf.js
  const handleExportPDF = () => {
    const element = document.getElementById('pdf-printable-ordonnance');
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Ordonnance_${formData.name}_${formData.lastName}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const doctorName = user ? `${user.name || ''} ${user.lastName || ''}`.trim() : 'Wouroud Abbes Maaloul';
  const doctorSpecialty = user?.specialty || 'MEDECIN DENTISTE';
  const doctorPhone = user?.phone || '94 035 783';
  const currentDateFormatted = new Date().toLocaleDateString('fr-FR');

  return (
    <div className="patient-modal-overlay">
      <div className="patient-modal-container">
        {/* Modal Header */}
        <div className="modal-header-bar">
          <div className="modal-title-group">
            <Activity className="icon-pulse" size={24} />
            <div>
              <h2>Consultation Patient & Fiche Médicale</h2>
              <p>
                Patient: <strong>{formData.name} {formData.lastName}</strong> | Tél: {formData.phone || 'N/A'}
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'medicalCard' ? 'active' : ''}`}
            onClick={() => setActiveTab('medicalCard')}
          >
            <Edit3 size={16} /> Fiche Médicale & Antécédents
          </button>
          <button
            className={`tab-btn ${activeTab === 'toothDetail' ? 'active' : ''}`}
            onClick={() => setActiveTab('toothDetail')}
          >
            <Sparkles size={16} /> Odontogramme Interactif & Historique
          </button>
          <button
            className={`tab-btn ${activeTab === 'pdfPreview' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdfPreview')}
          >
            <FileText size={16} /> Ordonnance (Saisie & Aperçu PDF)
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-content">
          {/* TAB 1: MEDICAL CARD & ANTECEDENTS */}
          {activeTab === 'medicalCard' && (
            <div className="tab-pane">
              <div className="form-section-card">
                <h3>Informations Personnelles & Contact du Patient</h3>
                <div className="form-grid-3">
                  <div className="input-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Date de Naissance</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Profession / Emploi</label>
                    <input
                      type="text"
                      value={formData.job}
                      onChange={(e) => handleInputChange('job', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Adresse</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Téléphone (Tél)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Antecedents Checklist */}
              <div className="form-section-card">
                <h3>Antécédents Médicaux</h3>
                <div className="checkbox-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.HTA}
                      onChange={(e) => handleInputChange('HTA', e.target.checked)}
                    />
                    <span>HTA</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.Diabete}
                      onChange={(e) => handleInputChange('Diabete', e.target.checked)}
                    />
                    <span>Diabète</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.Tabac}
                      onChange={(e) => handleInputChange('Tabac', e.target.checked)}
                    />
                    <span>Tabac</span>
                  </label>
                </div>
                <div className="form-grid-2 margin-top">
                  <div className="input-group">
                    <label>Autres (Autres conditions)</label>
                    <input
                      type="text"
                      value={formData.Autre}
                      onChange={(e) => handleInputChange('Autre', e.target.value)}
                      placeholder="ex. Allergie à la Pénicilline"
                    />
                  </div>
                  <div className="input-group">
                    <label>Médication en Cours</label>
                    <input
                      type="text"
                      value={formData.presentMedications}
                      onChange={(e) => handleInputChange('presentMedications', e.target.value)}
                      placeholder="Prescriptions en cours..."
                    />
                  </div>
                </div>
              </div>

              {/* X-Ray / Radiography Image Upload Section */}
              <div className="form-section-card">
                <h3>Radiographie / Images X-Ray (Multiples)</h3>
                <div className="xray-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImagesUpload}
                    className="custom-file-input"
                  />
                  {formData.imagesXRay && formData.imagesXRay.length > 0 ? (
                    <div className="xray-preview-grid" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', background: '#f1f5f9', borderRadius: '8px' }}>
                      {formData.imagesXRay.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={img}
                            alt={`Radio Patient ${idx + 1}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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
                              width: '22px',
                              height: '22px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                      Aucune image de radiographie téléversée. Vous pouvez sélectionner plusieurs images.
                    </p>
                  )}
                </div>
              </div>

              {/* Treatment Sessions (Fiche table) */}
              <div className="form-section-card">
                <div className="card-header-flex">
                  <h3>Consultations & Traitements (Acte / Paiement)</h3>
                  <button className="btn-secondary" onClick={addSessionRow}>
                    <Plus size={16} /> Ajouter une Ligne
                  </button>
                </div>
                <table className="treatment-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Acte (Procédure Dentaire)</th>
                      <th>Doit (Montant Total)</th>
                      <th>Reçu (Montant Payé)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.treatmentSessions.map((session, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="date"
                            value={session.date ? session.date.split('T')[0] : ''}
                            onChange={(e) => handleSessionChange(idx, 'date', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="ex. Ext 27, Ca(OH)2, Endo 15"
                            value={session.acte}
                            onChange={(e) => handleSessionChange(idx, 'acte', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="180"
                            value={session.doit}
                            onChange={(e) => handleSessionChange(idx, 'doit', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="50"
                            value={session.recu}
                            onChange={(e) => handleSessionChange(idx, 'recu', e.target.value)}
                          />
                        </td>
                        <td>
                          <button className="btn-icon-danger" onClick={() => removeSessionRow(idx)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE ODONTOGRAM & TOOTH HISTORY */}
          {activeTab === 'toothDetail' && (
            <div className="tab-pane odontogram-pane">
              <div className="odontogram-layout">
                {/* SVG Tooth Chart Component */}
                <div className="odontogram-chart-section">
                  <h3>Schéma Dentaire Interactif (Odontogramme)</h3>
                  <p className="hint-text">Cliquez sur n'importe quelle dent pour saisir des notes de traitement.</p>
                  <TeethSVG
                    selectedTooth={selectedTooth}
                    toothNotes={formData.teethNotes}
                    toothConditions={formData.teethConditions}
                    onSelectTooth={handleSelectTooth}
                    onToothInputChange={handleToothInputChange}
                    showInputs={true}
                  />
                </div>

                {/* Tooth Form Control */}
                <div className="tooth-editor-card">
                  <h3>Détails & Historique de la Dent</h3>
                  <div className="tooth-selected-header">
                    <span className="selected-tooth-badge">Dent {getToothDisplayLabel(selectedTooth)}</span>
                  </div>

                  <div className="input-group">
                    <label>État / Condition</label>
                    <select
                      value={toothCondition}
                      onChange={(e) => setToothCondition(e.target.value)}
                    >
                      <option value="Healthy">Saine / Normale</option>
                      <option value="Caries">Carie</option>
                      <option value="Extracted">Extraite</option>
                      <option value="Filled">Obturation / Composite</option>
                      <option value="Endo">Endodontique (Dévitalisée)</option>
                      <option value="Crown">Couronne / Prothèse</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Notes & Historique pour la Dent {getToothDisplayLabel(selectedTooth)}</label>
                    <textarea
                      rows={5}
                      placeholder="ex. Carie occlusale, dévitalisation faite le 23 Déc"
                      value={toothNoteInput}
                      onChange={(e) => setToothNoteInput(e.target.value)}
                    />
                  </div>

                  <button className="btn-primary c-btn" onClick={handleSaveToothNote}>
                    Enregistrer la Note ({getToothDisplayLabel(selectedTooth)})
                  </button>

                  <div className="recorded-teeth-summary">
                    <h4>Historique de la Dent {getToothDisplayLabel(selectedTooth)}</h4>
                    {(formData.teethConditions[selectedTooth] || formData.teethNotes[selectedTooth]) ? (
                      <div className="selected-tooth-details-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
                        <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem' }}>
                          <strong>Condition actuelle :</strong>{' '}
                          <span style={{ fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                            {formData.teethConditions[selectedTooth] || 'Healthy'}
                          </span>
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                          <strong>Notes :</strong> {formData.teethNotes[selectedTooth] || 'Aucune note spécifique enregistrée.'}
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.5rem' }}>
                        Aucun enregistrement pour la dent {getToothDisplayLabel(selectedTooth)}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC ORDONNANCE PREVIEW & EXPORT */}
          {activeTab === 'pdfPreview' && (
            <div className="tab-pane ordonnance-pane">
              <div className="form-section-card ordonnance-editor-card">
                <h3>Saisie de l'Ordonnance Médicale</h3>
                <div className="input-group">
                  <label>Prescriptions & Médicaments (Texte affiché au centre de l'ordonnance)</label>
                  <textarea
                    rows={6}
                    placeholder="ex. 1- Amoxicilline 1g : 1 comprimé 2 fois par jour pendant 7 jours&#10;2- Paracétamol 1g : 1 comprimé si douleur toutes les 8h"
                    value={ordonnanceText}
                    onChange={(e) => setOrdonnanceText(e.target.value)}
                    style={{ fontSize: '0.95rem', lineHeight: '1.6', fontFamily: 'inherit', padding: '0.75rem' }}
                  />
                </div>
              </div>

              <div className="pdf-controls-bar">
                <button className="btn-primary" onClick={handleExportPDF}>
                  <Download size={18} /> Télécharger l'Ordonnance PDF
                </button>
              </div>

              {/* Printable Ordonnance HTML matching reference image */}
              <div id="pdf-printable-ordonnance" className="pdf-ordonnance-paper">
                {/* Header (Doctor Info in French & Arabic) */}
                <div className="ordonnance-header">
                  {/* Left Header - French */}
                  <div className="ordonnance-header-left">
                    <h2 className="doc-name">DOCTEUR {doctorName.toUpperCase()}</h2>
                    <h3 className="doc-specialty">{doctorSpecialty.toUpperCase()}</h3>
                    <p className="doc-degree">Diplômée de la faculté de Médecine Dentaire de Monastir</p>
                  </div>

                  {/* Right Header - Arabic */}
                  <div className="ordonnance-header-right" dir="rtl">
                    <h2 className="doc-name-ar">الدكتورة {user?.name ? `${user.name} ${user.lastName || ''}` : 'ورود عباس معلول'}</h2>
                    <h3 className="doc-specialty-ar">طبيبة أسنان</h3>
                    <p className="doc-degree-ar">متخرجة من كلية طب الأسنان بالمنستير</p>
                  </div>
                </div>

                {/* Ordonnance Title */}
                <div className="ordonnance-title-block">
                  <h1 className="title-text">Ordonnance</h1>
                </div>

                {/* Patient Name & Date Row */}
                <div className="ordonnance-info-row">
                  <div className="info-patient">
                    <span className="info-label">M:</span>
                    <span className="info-dots">{formData.name} {formData.lastName}</span>
                  </div>
                  <div className="info-date">
                    <span className="info-label">Date:</span>
                    <span className="info-dots">{currentDateFormatted}</span>
                  </div>
                </div>

                {/* Center Content (Ordonnance Body Text) */}
                <div className="ordonnance-body-content">
                  {ordonnanceText ? (
                    <div className="prescriptions-text">
                      {ordonnanceText.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="prescriptions-placeholder">
                      <p>Saisissez les médicaments dans le champ de saisie ci-dessus.</p>
                    </div>
                  )}
                </div>

                {/* Footer Bar (Address & Phone in Arabic & French) */}
                <div className="ordonnance-footer">
                  <div className="footer-line">
                    <span className="footer-icon">🏠</span>
                    <span className="footer-address-ar">شارع الحبيب بورقيبة - قبالة المعتمدية - الطويرف</span>
                    <span className="footer-phone-icon">📞</span>
                    <span className="footer-phone">{doctorPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="modal-footer-bar">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-success-save" onClick={handleSavePatientRecord} disabled={isSaving}>
            <Save size={18} /> {isSaving ? 'Enregistrement...' : 'Enregistrer la Fiche Complète'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientFormModal;
