import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SettingsMenu.css';
import '../styles/HeaderBar.css';

export default function HeaderBar({ user, onLogout }) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = () => setShowSettings((s) => !s);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    }
  };

  return (
    <div className="header-bar">
      <h1 className="gradient-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Grungy</h1>
      <div className="header-actions-right">
        <div className="nav-buttons">
          <button className="nav-button" onClick={() => navigate('/search')}>
            Search
          </button>
          <button className="nav-button" onClick={() => navigate('/points-analytics')}>
            📊 Analytics
          </button>
          <button className="nav-button" onClick={() => navigate(`/profile/${user.id}`)}>
            Profile
          </button>
        </div>
        <div className="settings-trigger">
          <button
            className="settings-icon-btn"
            onClick={toggleSettings}
            title="Settings"
            aria-label="Settings"
          >
            ⚙️
          </button>
          {showSettings && (
            <div className="settings-popover">
              <div className="settings-item">
                <div className="settings-title">Account</div>
              </div>
              <div className="settings-item">
                <div className="settings-title">Preferences</div>
              </div>
              <div className="settings-item">
                <div className="settings-title">Audience and visibility</div>
              </div>
              <div className="settings-item">
                <div className="settings-title">Your activity</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
