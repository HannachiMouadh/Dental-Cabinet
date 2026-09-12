import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  User,
  Phone,
  Calendar,
  Briefcase,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Stethoscope
} from 'lucide-react';
import AddEditPatientModal from './AddEditPatientModal';

const PatientsManagementTab = ({
  patients,
  user,
  onDeletePatient,
  onOpenConsultation,
  onAddToQueue,
  onPatientSaved
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);

  // Filter patients by any available info
  const filteredPatients = patients.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${p.name || ''} ${p.lastName || ''}`.toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const job = (p.job || '').toLowerCase();
    const address = (p.address || '').toLowerCase();
    const medicalHistory = (p.medicalHistory || '').toLowerCase();
    const autre = (p.Autre || '').toLowerCase();

    return (
      fullName.includes(term) ||
      phone.includes(term) ||
      email.includes(term) ||
      job.includes(term) ||
      address.includes(term) ||
      medicalHistory.includes(term) ||
      autre.includes(term)
    );
  });

  const handleCreateNew = () => {
    setPatientToEdit(null);
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    setPatientToEdit(patient);
    setShowModal(true);
  };

  return (
    <div className="patients-mgmt-container">
      {/* Search and Action Bar */}
      <div className="patients-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher des patients par nom, téléphone, email, profession, notes, adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              &times;
            </button>
          )}
        </div>

        <button className="add-patient-btn" onClick={handleCreateNew}>
          <UserPlus size={18} /> Ajouter un Patient
        </button>
      </div>

      {/* Patient List Table / Grid */}
      <div className="patients-table-container">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchTerm
                ? `Aucun patient correspondant à "${searchTerm}" trouvé.`
                : 'Aucun patient enregistré dans le système pour le moment.'}
            </p>
          </div>
        ) : (
          <table className="patients-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact & Infos</th>
                <th>Antécédents / Notes</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const isInQueue = patient.status === 'waiting' || patient.status === 'ready';
                return (
                  <tr key={patient._id}>
                    <td>
                      <div className="patient-name-cell">
                        <div className="patient-avatar-sm">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="patient-full-name">
                            {patient.name} {patient.lastName}
                          </div>
                          <div className="patient-sub-details">
                            {patient.gender && (
                              <span className="capitalize">
                                {patient.gender === 'male' ? 'Homme' : patient.gender === 'female' ? 'Femme' : 'Autre'}
                              </span>
                            )}
                            {patient.dateOfBirth && (
                              <span> • {new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="contact-info-cell">
                        {patient.phone && (
                          <span>
                            <Phone size={13} /> {patient.phone}
                          </span>
                        )}
                        {patient.email && (
                          <span>
                            <Mail size={13} /> {patient.email}
                          </span>
                        )}
                        {patient.job && (
                          <span>
                            <Briefcase size={13} /> {patient.job}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="medical-notes-cell">
                        {(patient.HTA || patient.Diabete || patient.Tabac) && (
                          <div className="badge-group">
                            {patient.HTA && <span className="tag-pill">HTA</span>}
                            {patient.Diabete && <span className="tag-pill">Diabète</span>}
                            {patient.Tabac && <span className="tag-pill">Tabac</span>}
                          </div>
                        )}
                        {patient.medicalHistory && (
                          <p className="note-text">{patient.medicalHistory}</p>
                        )}
                        {((patient.imagesXRay && patient.imagesXRay.length > 0) || patient.imageXRay) && (
                          <div className="patient-xrays-thumbs" style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                            {(patient.imagesXRay && patient.imagesXRay.length > 0 ? patient.imagesXRay : [patient.imageXRay]).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Radio ${i + 1}`}
                                style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer' }}
                                onClick={() => handleEdit(patient)}
                                title="Cliquer pour voir ou modifier les images X-Ray"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`status-pill ${patient.status}`}>
                        {patient.status === 'ready' ? 'PRÊT' : patient.status === 'done' ? 'TERMINÉ' : patient.status === 'waiting' ? 'EN ATTENTE' : 'HORS FILE'}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons-cell">
                        {/* Add to Queue Button if not in queue or done */}
                        <button
                          className="btn-action queue-btn"
                          onClick={() => onAddToQueue(patient._id)}
                          title="Ajouter le patient à la file d'attente"
                        >
                          <Clock size={15} /> Ajouter à la File
                        </button>

                        {/* Doctor consultation form */}
                        {user.role === 'doctor' && (
                          <button
                            className="btn-action ready"
                            onClick={() => onOpenConsultation(patient)}
                            title="Ouvrir la Fiche / Odontogramme"
                          >
                            <Stethoscope size={15} /> Fiche Médicale
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          className="btn-action edit"
                          onClick={() => handleEdit(patient)}
                          title="Modifier les infos du patient"
                        >
                          <Edit2 size={15} /> Modifier
                        </button>

                        {/* Delete Button */}
                        <button
                          className="btn-action delete"
                          onClick={() => onDeletePatient(patient._id)}
                          title="Supprimer le patient"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <AddEditPatientModal
          patientToEdit={patientToEdit}
          onClose={() => setShowModal(false)}
          onPatientSaved={onPatientSaved}
        />
      )}
    </div>
  );
};

export default PatientsManagementTab;
