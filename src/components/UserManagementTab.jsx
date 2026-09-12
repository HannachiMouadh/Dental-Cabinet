import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  ShieldCheck,
  ClipboardList,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  Key,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

function UserManagementTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    role: 'secretary',
    phone: '',
    specialty: '',
    password: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStartEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'secretary',
      phone: user.phone || '',
      specialty: user.specialty || '',
      password: '' // empty unless changing
    });
    setSuccessMsg('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      lastName: '',
      email: '',
      role: 'secretary',
      phone: '',
      specialty: '',
      password: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        specialty: formData.specialty
      };

      if (formData.password && formData.password.trim().length > 0) {
        payload.password = formData.password.trim();
      }

      const res = await api.put(`/users/${editingUser._id}`, payload);

      setUsers((prev) =>
        prev.map((u) => (u._id === editingUser._id ? { ...u, ...res.data.user } : u))
      );

      setSuccessMsg(`Compte de ${formData.name} ${formData.lastName} mis à jour avec succès.`);
      setEditingUser(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser._id === currentUser?.id || targetUser._id === currentUser?._id) {
      alert('Vous ne pouvez pas supprimer votre propre compte médecin !');
      return;
    }

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${targetUser.name} ${targetUser.lastName} (${targetUser.role === 'secretary' ? 'Secrétaire' : 'Médecin'}) ?`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${targetUser._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      setSuccessMsg(`Compte ${targetUser.name} ${targetUser.lastName} supprimé.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const secretaryCount = users.filter((u) => u.role === 'secretary').length;
  const doctorCount = users.filter((u) => u.role === 'doctor').length;

  return (
    <div className="users-management-container">
      {/* Header Bar */}
      <div className="users-header-bar">
        <div>
          <h2 className="users-title">
            <Users size={24} className="icon-pulse-blue" />
            Gestion des Utilisateurs & Secrétaires
          </h2>
          <p className="users-subtitle">
            Espace réservé au Médecin • Visualisez, modifiez les profils et supprimez les comptes secrétaires. (La création de compte reste sur la page d'inscription).
          </p>
        </div>

        <div className="users-header-actions">
          <button className="btn-refresh-finance" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="alert-banner success">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="alert-banner error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Utilisateurs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div className="stat-value">{secretaryCount}</div>
            <div className="stat-label">Secrétaires Actives</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{doctorCount}</div>
            <div className="stat-label">Comptes Médecin</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="users-search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur par nom, email, rôle, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="finance-section-box full-width">
        <div className="section-box-header">
          <div className="section-title-wrap">
            <ClipboardList size={20} className="text-cyan" />
            <h3>Liste des Comptes du Cabinet</h3>
          </div>
          <span className="badge-count">{filteredUsers.length} affichés</span>
        </div>

        {loading ? (
          <div className="empty-expenses-state">
            <p>Chargement des comptes...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-expenses-state">
            <p>Aucun utilisateur trouvé correspondant à votre recherche.</p>
          </div>
        ) : (
          <div className="expenses-table-responsive">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = u._id === currentUser?.id || u._id === currentUser?._id;
                  return (
                    <tr key={u._id} className={isCurrent ? 'current-user-row' : ''}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>
                            {u.name} {u.lastName} {isCurrent && <span className="you-badge">(Vous)</span>}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.specialty || (u.role === 'doctor' ? 'Médecin Dentiste' : 'Secrétariat')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role === 'doctor' ? <ShieldCheck size={14} /> : <ClipboardList size={14} />}
                          {u.role === 'doctor' ? 'MÉDECIN' : 'SECRÉTAIRE'}
                        </span>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            className="btn-edit-user"
                            title="Modifier ce compte"
                            onClick={() => handleStartEdit(u)}
                          >
                            <Edit2 size={16} />
                          </button>
                          {!isCurrent && (
                            <button
                              className="btn-delete-expense"
                              title="Supprimer ce compte secrétaire"
                              onClick={() => handleDeleteUser(u)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="patient-modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit2 size={20} className="text-cyan" />
                <h3>Modifier le Compte: {editingUser.name} {editingUser.lastName}</h3>
              </div>
              <button className="btn-close-modal" onClick={handleCancelEdit}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-row">
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prénom</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Téléphone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rôle du compte</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="secretary">Secrétaire</option>
                    <option value="doctor">Médecin</option>
                  </select>
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spécialité / Fonction</label>
                  <input
                    type="text"
                    name="specialty"
                    placeholder="ex. Secrétaire Accueil, Médecin Dentiste..."
                    value={formData.specialty}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Réinitialiser le mot de passe (laisser vide pour ne pas modifier)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    name="password"
                    placeholder="Nouveau mot de passe..."
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                  Annuler
                </button>
                <button type="submit" className="confirm-btn" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementTab;
