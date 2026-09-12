import React from 'react';
import { Bell, CheckCircle, Clock, UserCheck, AlertCircle, X } from 'lucide-react';

const NotificationBanner = ({ notifications, onDismiss, onConfirmSecretaryReady }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="notification-wrapper">
      {notifications.map((notif) => (
        <div key={notif.id} className={`notification-item ${notif.type}`}>
          <div className="notif-content">
            <Bell size={20} className="notif-icon" />
            <div>
              <div className="notif-title">{notif.title}</div>
              <div className="notif-message">{notif.message}</div>
            </div>
          </div>

          <div className="notif-actions">
            {notif.type === 'doctor-done' && (
              <button
                className="action-btn ready-btn"
                onClick={() => onConfirmSecretaryReady(notif.patientId)}
              >
                <UserCheck size={16} /> Marquer le Patient Prêt
              </button>
            )}
            <button className="dismiss-btn" onClick={() => onDismiss(notif.id)}>
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationBanner;
