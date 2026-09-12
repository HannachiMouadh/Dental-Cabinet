import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  PlusCircle,
  Trash2,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Receipt,
  FileText,
  AlertCircle
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Matériel & Fournitures Dentaires',
  'Équipement & Maintenance',
  'Loyer & Charges Cabinet',
  'Factures (Électricité, Eau, Internet)',
  'Prothésiste & Laboratoire',
  'Autre Dépense Secondaire'
];

function DoctorFinanceTab({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // New Expense form state
  const [formData, setFormData] = useState({
    title: '',
    cost: '',
    category: EXPENSE_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Fetch financial summary and expenses
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, expensesRes] = await Promise.all([
        api.get('/finance/analytics'),
        api.get('/finance/expenses')
      ]);
      setAnalytics(analyticsRes.data);
      setExpenses(expensesRes.data);
    } catch (err) {
      console.error('Erreur chargement finance:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des finances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Veuillez indiquer la désignation de la dépense.');
      return;
    }
    if (!formData.cost || Number(formData.cost) <= 0) {
      alert('Veuillez renseigner un coût valide.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/finance/expenses', {
        title: formData.title.trim(),
        spending: formData.title.trim(), // mapping to user.model fields
        cost: Number(formData.cost),
        category: formData.category,
        date: formData.date,
        notes: formData.notes
      });

      // Reset form
      setFormData({
        title: '',
        cost: '',
        category: EXPENSE_CATEGORIES[0],
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });

      // Refresh data
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Échec de l\'ajout de la dépense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Voulez-vous supprimer cette dépense ?')) return;
    try {
      await api.delete(`/finance/expenses/${id}`);
      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
      // Re-fetch analytics to update deductions
      const analyticsRes = await api.get('/finance/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression de la dépense');
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num) + ' TND';
  };

  const currentMonth = analytics?.summary?.currentMonth;
  const currentYear = analytics?.summary?.currentYear;
  const allTime = analytics?.summary?.allTime;

  // Max net in monthly breakdown for visual progress bars
  const maxRecu = analytics?.monthlyBreakdown
    ? Math.max(...analytics.monthlyBreakdown.map((m) => Math.max(m.recu, m.depenses, 100)))
    : 1000;

  return (
    <div className="finance-tab-container">
      {/* Top Header */}
      <div className="finance-header-bar">
        <div>
          <h2 className="finance-title">
            <TrendingUp size={24} className="icon-pulse-blue" />
            Comptabilité & Finances Cabinet Dentaire
          </h2>
          <p className="finance-subtitle">
            Réservé au Médecin • Suivi des recettes patients (Doit / Reçu), gestion des dépenses secondaires et bénéfice net.
          </p>
        </div>
        <button className="btn-refresh-finance" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="finance-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Stats Cards */}
      <div className="finance-kpi-grid">
        {/* Card 1: Ce Mois - Recettes & Net */}
        <div className="kpi-card month-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap icon-month">
              <Calendar size={22} />
            </div>
            <span className="kpi-badge">Ce Mois ({currentMonth?.name || 'En cours'})</span>
          </div>
          <div className="kpi-metric-group">
            <div className="kpi-primary-val text-success">
              {formatCurrency(currentMonth?.totalRecu)}
            </div>
            <div className="kpi-label">Recettes Encaissées (Reçu)</div>
          </div>
          <div className="kpi-submetrics">
            <div className="submetric-item">
              <span className="submetric-title">Doit Total :</span>
              <strong>{formatCurrency(currentMonth?.totalDoit)}</strong>
            </div>
            <div className="submetric-item text-danger">
              <span className="submetric-title">Dépenses Déduites :</span>
              <strong>- {formatCurrency(currentMonth?.totalExpenses)}</strong>
            </div>
            <div className="submetric-divider"></div>
            <div className="submetric-item highlight-net">
              <span>Bénéfice Net du Mois :</span>
              <strong className={currentMonth?.netEarnings >= 0 ? 'text-cyan' : 'text-danger'}>
                {formatCurrency(currentMonth?.netEarnings)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Cette Année - Recettes & Net */}
        <div className="kpi-card year-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap icon-year">
              <TrendingUp size={22} />
            </div>
            <span className="kpi-badge">Année {currentYear?.year || new Date().getFullYear()}</span>
          </div>
          <div className="kpi-metric-group">
            <div className="kpi-primary-val text-primary-cyan">
              {formatCurrency(currentYear?.totalRecu)}
            </div>
            <div className="kpi-label">Recettes Totales Année (Reçu)</div>
          </div>
          <div className="kpi-submetrics">
            <div className="submetric-item">
              <span className="submetric-title">Doit Facturé Annuel :</span>
              <strong>{formatCurrency(currentYear?.totalDoit)}</strong>
            </div>
            <div className="submetric-item text-danger">
              <span className="submetric-title">Dépenses Annuelles :</span>
              <strong>- {formatCurrency(currentYear?.totalExpenses)}</strong>
            </div>
            <div className="submetric-divider"></div>
            <div className="submetric-item highlight-net">
              <span>Bénéfice Net Annuel :</span>
              <strong className={currentYear?.netEarnings >= 0 ? 'text-cyan' : 'text-danger'}>
                {formatCurrency(currentYear?.netEarnings)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Global / Restant à Payer */}
        <div className="kpi-card reminder-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap icon-wallet">
              <Wallet size={22} />
            </div>
            <span className="kpi-badge badge-warning">Reste à Recouvrer</span>
          </div>
          <div className="kpi-metric-group">
            <div className="kpi-primary-val text-warning">
              {formatCurrency(currentYear?.unpaidRemainder)}
            </div>
            <div className="kpi-label">Impayés Patients (Année en cours)</div>
          </div>
          <div className="kpi-submetrics">
            <div className="submetric-item">
              <span className="submetric-title">Total Historique Reçu :</span>
              <strong>{formatCurrency(allTime?.totalRecu)}</strong>
            </div>
            <div className="submetric-item text-danger">
              <span className="submetric-title">Total Historique Dépenses :</span>
              <strong>- {formatCurrency(allTime?.totalExpenses)}</strong>
            </div>
            <div className="submetric-divider"></div>
            <div className="submetric-item highlight-net">
              <span>Gain Net Global :</span>
              <strong className="text-cyan">{formatCurrency(allTime?.netEarnings)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Add Expense & Monthly Breakdown */}
      <div className="finance-grid-layout">
        {/* Left Column: Form to Add Secondary Cabinet Spending */}
        <div className="finance-section-box">
          <div className="section-box-header">
            <div className="section-title-wrap">
              <PlusCircle size={20} className="text-cyan" />
              <h3>Ajouter une Dépense Secondaire</h3>
            </div>
            <span className="badge-count">Déduction Immédiate</span>
          </div>

          <form onSubmit={handleAddExpense} className="expense-form">
            <div className="form-group">
              <label>Désignation / Type de Dépense (spending) *</label>
              <input
                type="text"
                name="title"
                placeholder="ex. Achat Fraises dentaires, Loyer, Composite 3M..."
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Coût (TND) (cost) *</label>
                <div className="input-icon-field">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="cost"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="currency-suffix">TND</span>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Catégorie</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Notes / Justificatif (optionnel)</label>
              <textarea
                name="notes"
                rows="2"
                placeholder="ex. Facture N° 4528 - Fournisseur DentalPro"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn-submit-expense" disabled={submitting}>
              <PlusCircle size={18} />
              {submitting ? 'Enregistrement...' : 'Enregistrer et Déduire du Bénéfice'}
            </button>
          </form>
        </div>

        {/* Right Column: Monthly Evolution (Current Year) */}
        <div className="finance-section-box">
          <div className="section-box-header">
            <div className="section-title-wrap">
              <PieChart size={20} className="text-cyan" />
              <h3>Évolution Mensuelle ({currentYear?.year || new Date().getFullYear()})</h3>
            </div>
            <span className="badge-hint">Reçus vs Dépenses</span>
          </div>

          <div className="monthly-breakdown-list">
            {analytics?.monthlyBreakdown?.map((month) => {
              const recuPercent = Math.min(100, Math.round((month.recu / maxRecu) * 100));
              const expPercent = Math.min(100, Math.round((month.depenses / maxRecu) * 100));

              return (
                <div key={month.monthIndex} className="month-row-item">
                  <div className="month-name-col">
                    <span className="m-name">{month.monthName}</span>
                    <span className={`m-net ${month.net >= 0 ? 'text-success' : 'text-danger'}`}>
                      Net: {month.net.toFixed(0)} TND
                    </span>
                  </div>

                  <div className="month-bars-col">
                    {/* Encaissement Bar */}
                    <div className="progress-bar-wrap" title={`Encaissé: ${month.recu} TND`}>
                      <div
                        className="bar-fill bar-recu"
                        style={{ width: `${Math.max(recuPercent, month.recu > 0 ? 5 : 0)}%` }}
                      ></div>
                      <span className="bar-label-val">{month.recu} TND</span>
                    </div>

                    {/* Dépense Bar */}
                    <div className="progress-bar-wrap" title={`Dépenses: ${month.depenses} TND`}>
                      <div
                        className="bar-fill bar-depense"
                        style={{ width: `${Math.max(expPercent, month.depenses > 0 ? 5 : 0)}%` }}
                      ></div>
                      <span className="bar-label-val text-muted-depense">
                        {month.depenses > 0 ? `-${month.depenses} TND` : '0 TND'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="finance-section-box full-width">
        <div className="section-box-header">
          <div className="section-title-wrap">
            <Receipt size={20} className="text-cyan" />
            <h3>Journal des Dépenses Secondaires Enregistrées</h3>
          </div>
          <span className="badge-count">{expenses.length} dépenses</span>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-expenses-state">
            <p>Aucune dépense enregistrée pour le moment. Ajoutez une première dépense ci-dessus.</p>
          </div>
        ) : (
          <div className="expenses-table-responsive">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Désignation (spending)</th>
                  <th>Catégorie</th>
                  <th>Notes</th>
                  <th>Montant Déduit (cost)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id}>
                    <td>
                      {new Date(exp.date || exp.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <strong>{exp.title}</strong>
                    </td>
                    <td>
                      <span className="category-pill">{exp.category || 'Autre'}</span>
                    </td>
                    <td className="notes-col">{exp.notes || '-'}</td>
                    <td className="cost-col text-danger">
                      - {formatCurrency(exp.cost)}
                    </td>
                    <td>
                      <button
                        className="btn-delete-expense"
                        title="Supprimer cette dépense"
                        onClick={() => handleDeleteExpense(exp._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorFinanceTab;
