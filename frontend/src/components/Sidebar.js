import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      onLogout();
      navigate('/auth');
    }
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isHobbyActive = () =>
    location.pathname === '/hobby-spaces' ||
    location.pathname.startsWith('/hobby-space');

  const initials = user?.username?.charAt(0).toUpperCase() || '?';

  return (
    <aside className="sidebar">
      {/* Brand / Logo */}
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        Grungy
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${isActive('/', true) ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <span className="nav-icon">⌂</span>
          <span className="nav-label">Home</span>
        </button>

        <button
          className={`sidebar-nav-item ${isHobbyActive() ? 'active' : ''}`}
          onClick={() => navigate('/hobby-spaces')}
        >
          <span className="nav-icon">◎</span>
          <span className="nav-label">Hobby Spaces</span>
        </button>

        <button
          className={`sidebar-nav-item ${isActive('/search') ? 'active' : ''}`}
          onClick={() => navigate('/search')}
        >
          <span className="nav-icon">⊙</span>
          <span className="nav-label">People</span>
        </button>



        <button
          className={`sidebar-nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
          onClick={() => navigate('/leaderboard')}
        >
          <span className="nav-icon">▤</span>
          <span className="nav-label">Leaderboard</span>
        </button>

        {/* Achievements tab removed */}

        <button
          className={`sidebar-nav-item ${isActive('/point-system') ? 'active' : ''}`}
          onClick={() => navigate('/point-system')}
        >
          <span className="nav-icon">✧</span>
          <span className="nav-label">Point System</span>
        </button>

        {user && (
          <button
            className={`sidebar-nav-item ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <span className="nav-icon">◉</span>
            <span className="nav-label">My Profile</span>
          </button>
        )}
      </nav>

      {/* User summary + logout */}
      <div className="sidebar-bottom">
        {user && (
          <div
            className="sidebar-user-card"
            onClick={() => navigate(`/profile/${user.id}`)}
            title="View profile"
          >
            <div className="sidebar-avatar">
              {user.avatar && !user.avatar.includes('placeholder') ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                initials
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">{user.username}</span>
              {user.bio && (
                <span className="sidebar-userbio">{user.bio}</span>
              )}
            </div>
          </div>
        )}

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
