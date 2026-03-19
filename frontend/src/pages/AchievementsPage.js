import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/AchievementsPage.css';

function AchievementsPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/progress/dashboard');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load achievement data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (streak) => {
    if (!streak.isActive) return 'Broken';
    const lastAction = streak.lastActionDate ? new Date(streak.lastActionDate) : null;
    if (!lastAction) return 'Active';
    
    const daysSinceAction = Math.floor((new Date() - lastAction) / (1000 * 60 * 60 * 24));
    if (daysSinceAction > 1) return `Grace Mode (${streak.graceUsedCount}/${streak.maxGraceAllowance})`;
    return 'Hot 🔥';
  };

  const isInGrace = (streak) => {
    if (!streak.isActive) return false;
    const lastAction = streak.lastActionDate ? new Date(streak.lastActionDate) : null;
    if (!lastAction) return false;
    const daysSinceAction = Math.floor((new Date() - lastAction) / (1000 * 60 * 60 * 24));
    return daysSinceAction > 1;
  };

  if (loading) {
    return (
      <div className="achievements-page">
        <div className="loading">Loading your achievements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-page">
        <div className="error">{error}</div>
        <button className="primary-btn" onClick={fetchDashboardData} style={{ marginTop: '20px' }}>
          Retry
        </button>
      </div>
    );
  }

  const { streaks = [], badges = [] } = dashboardData || {};

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1>Achievements</h1>
        <p>Your journey of consistency and milestones across all hobby spaces.</p>
      </div>

      {/* Streaks Section */}
      <div className="achievements-section">
        <h2>
          Active Streaks
          {streaks.filter(s => s.isActive).length > 0 && <span className="fire-icon">🔥</span>}
        </h2>
        {streaks.length === 0 ? (
          <div className="empty-achievements glass">
            No streaks started yet. Join a space and start posting to track your consistency!
          </div>
        ) : (
          <div className="streaks-grid">
            {streaks.map((streak) => (
              <div key={streak._id} className={`streak-card glass ${isInGrace(streak) ? 'in-grace' : ''}`}>
                <div className="streak-header">
                  <div className="space-info">
                    <h3>{streak.hobbySpace?.name}</h3>
                    <span>#{streak.hobbySpace?.slug}</span>
                  </div>
                  <div className="streak-counter">
                    {streak.currentStreak}
                    <span className="fire-icon">🔥</span>
                  </div>
                </div>

                <div className="streak-status">
                  <div className="status-label">Status</div>
                  <div className="status-value">{getStatusText(streak)}</div>
                </div>

                {isInGrace(streak) && (
                  <div className="grace-warning">
                    ⚠️ CRITICAL: Missed days! Post now to save your streak.
                  </div>
                )}

                <div className="streak-status" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '10px' }}>
                  <div>
                    <div className="status-label" style={{ fontSize: '0.75rem' }}>Longest</div>
                    <div className="status-value" style={{ fontSize: '1rem' }}>{streak.longestStreak}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="status-label" style={{ fontSize: '0.75rem' }}>Next Goal</div>
                    <div className="status-value" style={{ fontSize: '1rem' }}>
                      {streak.actionsInCurrentWindow.length}/{streak.requiredActionsInWindow} Actions
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div className="achievements-section">
        <h2>
          Earned Badges
          {badges.length > 0 && <span>🏆</span>}
        </h2>
        {badges.length === 0 ? (
          <div className="empty-achievements glass">
            No badges earned yet. Complete challenges and maintain streaks to unlock rewards!
          </div>
        ) : (
          <div className="badges-grid">
            {badges.map((userBadge) => {
              const bData = userBadge.badgeId || {};
              return (
                <div key={userBadge._id} className="badge-card glass">
                  <div className="badge-icon">{bData.icon || '🎖️'}</div>
                  <div className="badge-info">
                    <h3>{bData.name}</h3>
                    <p>{bData.description}</p>
                    <div className="badge-space">{userBadge.hobbySpace?.name}</div>
                    {userBadge.earnedAt && (
                      <div className="badge-date">
                        Earned on {new Date(userBadge.earnedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AchievementsPage;
