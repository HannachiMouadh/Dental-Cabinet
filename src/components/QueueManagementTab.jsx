import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  Trash2,
  GripVertical,
  Stethoscope,
  ArrowDown,
  Sparkles,
  ChevronRight,
  User as UserIcon,
  Phone,
  Calendar
} from 'lucide-react';

const QueueManagementTab = ({
  patients,
  user,
  onMarkReady,
  onToggleReady,
  onMarkDone,
  onRemoveFromQueue,
  onOpenConsultation,
  onReorderQueue
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Separate active queue (waiting & ready) vs completed done queue
  const activeQueue = patients.filter((p) => p.status === 'waiting' || p.status === 'ready');
  const donePatients = patients.filter((p) => p.status === 'done');

  // The very first patient in activeQueue is NEXT/READY TO ENTER
  const nextPatient = activeQueue.length > 0 ? activeQueue[0] : null;

  // HTML5 Drag & Drop handlers for reordering active queue
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (index) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder array locally and notify parent to update state & persist
    const newActiveList = [...activeQueue];
    const [movedPatient] = newActiveList.splice(draggedIndex, 1);
    newActiveList.splice(targetIndex, 0, movedPatient);

    // Combine with done queue
    const fullReordered = [...newActiveList, ...donePatients];
    onReorderQueue(fullReordered);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="queue-mgmt-container">
      {/* 1. NEXT PATIENT HIGHLIGHT BANNER */}
      {nextPatient ? (
        <div className="next-patient-hero-card">
          <div className="hero-badge">
            <Sparkles size={16} /> PROCHAIN PATIENT PRÊT À ENTRER
          </div>
          <div className="hero-content">
            <div className="hero-avatar">
              <UserIcon size={32} />
            </div>
            <div className="hero-details">
              <h3>
                {nextPatient.name} {nextPatient.lastName}
              </h3>
              <p>
                Statut:{' '}
                <span className={`status-pill ${nextPatient.status}`}>
                  {nextPatient.status === 'ready' ? 'PRÊT' : 'EN ATTENTE'}
                </span>
                {nextPatient.phone && (
                  <span>
                    {' '}
                    • Tél: {nextPatient.phone}
                  </span>
                )}
              </p>
            </div>
            <div className="hero-actions">
              {user.role === 'doctor' && (
                <button
                  className="btn-hero-action primary"
                  onClick={() => onOpenConsultation(nextPatient)}
                >
                  <Stethoscope size={18} /> Ouvrir Fiche Médicale
                </button>
              )}

              {user.role === 'secretary' && (
                <button
                  className={`btn-hero-action ${nextPatient.status === 'ready' ? 'done' : 'ready'}`}
                  onClick={() => onToggleReady ? onToggleReady(nextPatient) : onMarkReady(nextPatient._id)}
                >
                  <UserCheck size={18} /> {nextPatient.status === 'ready' ? 'Remettre en attente' : 'Appeler & Marquer Prêt'}
                </button>
              )}

              {user.role === 'doctor' && nextPatient.status === 'ready' && (
                <button
                  className="btn-hero-action done"
                  onClick={() => onMarkDone(nextPatient._id)}
                >
                  <CheckCircle2 size={18} /> Terminer Consultation
                </button>
              )}

              <button
                className="btn-hero-action delete"
                onClick={() => onRemoveFromQueue(nextPatient._id)}
                title="Retirer de la file d'attente"
              >
                <Trash2 size={18} /> Retirer de la File
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="next-patient-hero-card empty">
          <Clock size={28} />
          <h3>Aucun patient en attente dans la file pour le moment</h3>
        </div>
      )}

      {/* 2. VERTICALLY ORGANISED QUEUE WITH DRAG & DROP */}
      <div className="queue-vertical-section">
        <div className="section-header">
          <div>
            <h4>File d'Attente Organisée Verticalement ({activeQueue.length})</h4>
            <p className="hint-text">Glissez-déposez les cartes des patients avec la poignée (⋮⋮) pour réordonner les priorités.</p>
          </div>
        </div>

        {activeQueue.length === 0 ? (
          <div className="empty-queue-box">
            <p>La file d'attente est vide. Ajoutez des patients depuis l'onglet Gestion des Patients.</p>
          </div>
        ) : (
          <div className="vertical-queue-list">
            {activeQueue.map((patient, index) => {
              const isNext = index === 0;
              const isBeingDragged = draggedIndex === index;
              const isBeingDraggedOver = dragOverIndex === index;

              return (
                <div
                  key={patient._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={() => handleDragLeave(index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`vertical-queue-item status-${patient.status} ${
                    isNext ? 'is-first-next' : ''
                  } ${isBeingDragged ? 'dragging' : ''} ${
                    isBeingDraggedOver ? 'drag-over' : ''
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="drag-handle" title="Glisser pour réordonner les priorités">
                    <GripVertical size={20} />
                  </div>

                  {/* Priority Order Badge */}
                  <div className="queue-position-badge">
                    {isNext ? 'SUIVANT' : `#${index + 1}`}
                  </div>

                  {/* Patient Info */}
                  <div className="item-patient-info">
                    <h5>
                      {patient.name} {patient.lastName}
                    </h5>
                    <div className="item-subinfo">
                      <span>
                        <Calendar size={13} /> {patient.gender === 'male' ? 'Homme' : patient.gender === 'female' ? 'Femme' : 'Autre'},{' '}
                        {patient.dateOfBirth
                          ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </span>
                      {patient.phone && (
                        <span>
                          <Phone size={13} /> {patient.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="item-status">
                    <span className={`status-pill ${patient.status}`}>
                      {patient.status === 'ready' ? 'PRÊT' : 'EN ATTENTE'}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="item-actions">
                    {user.role === 'doctor' && (
                      <button
                        className="btn-icon-action consultation"
                        onClick={() => onOpenConsultation(patient)}
                        title="Ouvrir la fiche de consultation et l'odontogramme"
                      >
                        <Stethoscope size={16} /> Ouvrir Fiche
                      </button>
                    )}

                    {user.role === 'secretary' && (
                      <button
                        className={`btn-icon-action ${patient.status === 'ready' ? 'done' : 'ready'}`}
                        onClick={() => onToggleReady ? onToggleReady(patient) : onMarkReady(patient._id)}
                        title={patient.status === 'ready' ? "Remettre le statut en attente" : "Marquer le patient prêt à entrer"}
                      >
                        <UserCheck size={16} /> {patient.status === 'ready' ? 'En Attente' : 'Marquer Prêt'}
                      </button>
                    )}

                    {user.role === 'doctor' && patient.status === 'ready' && (
                      <button
                        className="btn-icon-action done"
                        onClick={() => onMarkDone(patient._id)}
                        title="Marquer la consultation terminée"
                      >
                        <CheckCircle2 size={16} /> Terminé
                      </button>
                    )}

                    {/* Remove from queue option */}
                    <button
                      className="btn-icon-action delete"
                      onClick={() => onRemoveFromQueue(patient._id)}
                      title="Retirer le patient de la file d'attente"
                    >
                      <Trash2 size={16} /> Retirer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. FINISHED CONSULTATIONS HISTORY */}
      {donePatients.length > 0 && (
        <div className="done-patients-section">
          <h4>Consultations Terminées Aujourd'hui ({donePatients.length})</h4>
          <div className="done-grid">
            {donePatients.map((p) => (
              <div key={p._id} className="done-card">
                <div>
                  <strong>
                    {p.name} {p.lastName}
                  </strong>
                  <span className="done-time">
                    • Terminée à{' '}
                    {new Date(p.updatedAt || p.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {user.role === 'doctor' && (
                  <button
                    className="btn-action ready"
                    onClick={() => onOpenConsultation(p)}
                  >
                    <Stethoscope size={14} /> Voir Fiche
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagementTab;
