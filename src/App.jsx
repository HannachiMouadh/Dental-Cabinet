import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from './services/api';

import AuthModal from './components/AuthModal';
import PatientFormModal from './components/PatientFormModal';
import EditProfileModal from './components/EditProfileModal';
import NotificationBanner from './components/NotificationBanner';
import PatientsManagementTab from './components/PatientsManagementTab';
import QueueManagementTab from './components/QueueManagementTab';
import DoctorFinanceTab from './components/DoctorFinanceTab';
import {
  Stethoscope,
  ClipboardList,
  LogOut,
  Users,
  ListOrdered,
  Sparkles,
  UserCog,
  Clock,
  UserCheck,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'patients'
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedPatientForForm, setSelectedPatientForForm] = useState(null);

  // Browser notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Socket Connection setup
  useEffect(() => {
    // Only connect WebSocket if user is logged in
    if (!user) return;

    // Vercel serverless functions do not maintain persistent WebSockets.
    // If deployed on Vercel and not on a dedicated server or localhost, fallback gracefully.
    const isVercelHost = SOCKET_URL && SOCKET_URL.includes('vercel.app');

    const newSocket = io(SOCKET_URL || 'http://localhost:3000', {
      transports: isVercelHost ? ['websocket'] : ['polling', 'websocket'],
      autoConnect: true,
      reconnectionAttempts: 3,
      timeout: 5000
    });

    newSocket.on('connect_error', (err) => {
      // Suppress spam in console if serverless host doesn't support persistent WebSockets
      console.warn('Real-time sync notice (WebSockets offline on serverless host):', err.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user]);



  // Fetch patient list
  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('patientDoneNotification', (data) => {
      const { patient } = data;
      setPatients((prev) =>
        prev.map((p) => (p._id === patient._id ? { ...p, status: 'done' } : p))
      );

      if (user.role === 'secretary') {
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: 'doctor-done',
            title: 'Consultation Terminée par le Médecin',
            message: `Le patient ${patient.name} ${patient.lastName} a été marqué comme TERMINÉ par le médecin.`,
            patientId: patient._id
          },
          ...prev
        ]);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Consultation Terminée', {
            body: `${patient.name} ${patient.lastName} est marqué TERMINÉ.`,
            icon: '/favicon.ico'
          });
        }
      }
    });

    socket.on('patientReadyNotification', (data) => {
      const { patient } = data;
      setPatients((prev) =>
        prev.map((p) => (p._id === patient._id ? { ...p, status: 'ready' } : p))
      );

      if (user.role === 'doctor') {
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: 'patient-ready',
            title: 'Patient Prêt à Entrer !',
            message: `Le patient ${patient.name} ${patient.lastName} a été vérifié et est PRÊT à entrer !`,
            patientId: patient._id
          },
          ...prev
        ]);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Patient Prêt à Entrer', {
            body: `${patient.name} ${patient.lastName} est prêt en salle d'attente.`,
            icon: '/favicon.ico'
          });
        }
      }
    });

    socket.on('patientAdded', (newPatient) => {
      setPatients((prev) => {
        if (prev.some((p) => p._id === newPatient._id)) return prev;
        return [newPatient, ...prev];
      });
    });

    socket.on('patientUpdated', (updatedPatient) => {
      setPatients((prev) =>
        prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p))
      );
    });

    socket.on('patientDeleted', ({ id }) => {
      setPatients((prev) => prev.filter((p) => p._id !== id));
    });

    return () => {
      socket.off('patientDoneNotification');
      socket.off('patientReadyNotification');
      socket.off('patientAdded');
      socket.off('patientUpdated');
      socket.off('patientDeleted');
    };
  }, [socket, user]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/users/logout', { refreshToken });
    } catch (err) {
      console.error('Erreur de déconnexion:', err);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  const handleMarkDone = async (patientId) => {
    try {
      await api.patch(`/patients/${patientId}/status`, { status: 'done' });
    } catch (err) {
      alert(err.response?.data?.message || 'Seuls les médecins peuvent marquer les patients comme terminés');
    }
  };

  const handleMarkReady = async (patientId) => {
    try {
      await api.patch(`/patients/${patientId}/status`, {
        status: 'ready',
        secretaryAcknowledgedDone: true
      });
      setNotifications((prev) => prev.filter((n) => n.patientId !== patientId));
    } catch (err) {
      alert(err.response?.data?.message || 'Seule la secrétaire peut marquer un patient prêt');
    }
  };

  const handleToggleReady = async (patient) => {
    const newStatus = patient.status === 'ready' ? 'waiting' : 'ready';
    try {
      await api.patch(`/patients/${patient._id}/status`, {
        status: newStatus,
        secretaryAcknowledgedDone: newStatus === 'ready'
      });
      if (newStatus === 'waiting') {
        setNotifications((prev) => prev.filter((n) => n.patientId !== patient._id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Échec de la modification du statut');
    }
  };

  const handleAddToQueue = async (patientId) => {
    try {
      await api.patch(`/patients/${patientId}/status`, { status: 'waiting' });
      alert('Patient ajouté à la file d\'attente active !');
    } catch (err) {
      alert(err.response?.data?.message || 'Échec de l\'ajout du patient à la file');
    }
  };

  const handleRemoveFromQueue = async (patientId) => {
    if (!window.confirm('Retirer le patient de la file d\'attente ? (Le patient restera enregistré dans les dossiers)')) return;
    try {
      await api.patch(`/patients/${patientId}/status`, { status: 'none' });
    } catch (err) {
      alert(err.response?.data?.message || 'Échec du retrait du patient de la file');
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Supprimer définitivement le patient des dossiers ?')) return;
    try {
      await api.delete(`/patients/${patientId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Échec de la suppression du patient');
    }
  };

  const handlePatientSaved = (savedPatient) => {
    setPatients((prev) => {
      const index = prev.findIndex((p) => p._id === savedPatient._id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = savedPatient;
        return updated;
      }
      return [savedPatient, ...prev];
    });
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!user) {
    return <AuthModal onLoginSuccess={(userData) => setUser(userData)} />;
  }

  const waitingQueue = patients.filter((p) => p.status === 'waiting');
  const readyQueue = patients.filter((p) => p.status === 'ready');
  const doneQueue = patients.filter((p) => p.status === 'done');

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <Sparkles className="icon-sparkle" size={26} />
          <h2>Gestion Cabinet Dentaire</h2>
        </div>

        {/* Global Navigation Tabs */}
        <div className="header-main-nav">
          <button
            className={`nav-tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <Users size={18} /> Gestion des Patients
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <ListOrdered size={18} /> File d'Attente
            {waitingQueue.length + readyQueue.length > 0 && (
              <span className="queue-count-badge">
                {waitingQueue.length + readyQueue.length}
              </span>
            )}
          </button>
          {user.role === 'doctor' && (
            <button
              className={`nav-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => setActiveTab('finance')}
            >
              <TrendingUp size={18} /> Finances & Dépenses
            </button>
          )}
        </div>


        <div className="header-user">
          <div className={`role-badge ${user.role}`}>
            {user.role === 'doctor' ? <Stethoscope size={16} /> : <ClipboardList size={16} />}
            <span>{user.role === 'doctor' ? 'MÉDECIN' : 'SECRÉTAIRE'}</span>
          </div>

          <div className="user-details">
            <span className="user-name">
              {user.name} {user.lastName}
            </span>
            <span className="user-email">{user.email}</span>
          </div>

          <div className="user-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="edit-profile-btn" onClick={() => setShowProfileModal(true)} title="Modifier le profil">
              <UserCog size={18} />
            </button>
            <button className="logout-btn" onClick={handleLogout} title="Se déconnecter">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <NotificationBanner
        notifications={notifications}
        onDismiss={dismissNotification}
        onConfirmSecretaryReady={handleMarkReady}
      />

      <main className="dashboard-content">
        {/* Stats Summary */}
        <div className="stats-grid">
          <div className="stat-card waiting">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-value">{waitingQueue.length}</div>
              <div className="stat-label">En attente en salle</div>
            </div>
          </div>

          <div className="stat-card ready">
            <div className="stat-icon">
              <UserCheck size={24} />
            </div>
            <div>
              <div className="stat-value">{readyQueue.length}</div>
              <div className="stat-label">Prêts à entrer</div>
            </div>
          </div>

          <div className="stat-card done">
            <div className="stat-icon">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="stat-value">{doneQueue.length}</div>
              <div className="stat-label">Consultations Terminées</div>
            </div>
          </div>
        </div>

        {/* Tab 1: Patients Management */}
        {activeTab === 'patients' && (
          <PatientsManagementTab
            patients={patients}
            user={user}
            onDeletePatient={handleDeletePatient}
            onOpenConsultation={(p) => setSelectedPatientForForm(p)}
            onAddToQueue={handleAddToQueue}
            onPatientSaved={handlePatientSaved}
          />
        )}

        {/* Tab 2: Queue Management (Vertical + Drag & Drop) */}
        {activeTab === 'queue' && (
          <QueueManagementTab
            patients={patients}
            user={user}
            onMarkReady={handleMarkReady}
            onToggleReady={handleToggleReady}
            onMarkDone={handleMarkDone}
            onRemoveFromQueue={handleRemoveFromQueue}
            onOpenConsultation={(p) => setSelectedPatientForForm(p)}
            onReorderQueue={(reorderedPatients) => setPatients(reorderedPatients)}
          />
        )}

        {/* Tab 3: Cabinet Finance & Spendings (Doctor Only) */}
        {activeTab === 'finance' && user.role === 'doctor' && (
          <DoctorFinanceTab user={user} />
        )}
      </main>


      {/* Consultation & Fiche Form Modal */}
      {selectedPatientForForm && (
        <PatientFormModal
          user={user}
          patient={selectedPatientForForm}
          onClose={() => setSelectedPatientForForm(null)}
          onPatientUpdated={handlePatientSaved}
        />
      )}

      {/* Edit Doctor / Secretary Profile Modal */}
      {showProfileModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
}

export default App;

