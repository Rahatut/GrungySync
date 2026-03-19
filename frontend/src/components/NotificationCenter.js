import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/NotificationCenter.css';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-center">
      <button 
        className={`notification-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) fetchNotifications();
        }}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown glass">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead}>Mark all as read</button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifs">No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n._id} 
                  className={`notification-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => markRead(n._id)}
                >
                  <div className="notif-content">
                    <p>{n.message}</p>
                    <span className="notif-date">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  {!n.read && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
