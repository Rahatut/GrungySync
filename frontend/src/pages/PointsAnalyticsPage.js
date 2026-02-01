import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/PointsAnalyticsPage.css';

function PointsAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPointsAnalytics();
  }, []);

  const fetchPointsAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/progress/points-analytics');
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching points analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="points-analytics-page">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="points-analytics-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const maxPoints = Math.max(...analytics.pointsOverTime.map((d) => d.points), 1);

  return (
    <div className="points-analytics-page">
      <div className="analytics-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Points Analytics</h1>
      </div>

      <div className="analytics-grid">
        {/* Summary Cards */}
        <div className="analytics-card summary-card">
          <div className="card-icon">🏆</div>
          <div className="card-content">
            <div className="card-value">{analytics.totalPoints.toLocaleString()}</div>
            <div className="card-label">Total Points</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">🔥</div>
          <div className="card-content">
            <div className="card-value">{analytics.currentStreak}</div>
            <div className="card-label">Day Streak</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <div className="card-value">{analytics.thisWeekTotal}</div>
            <div className="card-label">This Week</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{analytics.thisMonthTotal}</div>
            <div className="card-label">This Month</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <div className="card-value">{analytics.highestDayThisMonth}</div>
            <div className="card-label">Best Day This Month</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">{analytics.averagePointsPerAction}</div>
            <div className="card-label">Avg Points/Action</div>
          </div>
        </div>

        {/* Points Over Time Chart */}
        <div className="analytics-card chart-card">
          <h2>Points Over Time (Last 30 Days)</h2>
          <div className="chart-container">
            <div className="bar-chart">
              {analytics.pointsOverTime.map((day, index) => (
                <div key={index} className="bar-wrapper">
                  <div
                    className="bar"
                    style={{
                      height: `${(day.points / maxPoints) * 100}%`,
                      backgroundColor: day.points > 0 ? '#4CAF50' : '#e0e0e0',
                    }}
                    title={`${formatDate(day.date)}: ${day.points} points`}
                  >
                    <span className="bar-value">{day.points > 0 ? day.points : ''}</span>
                  </div>
                  <div className="bar-label">{formatDate(day.date)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Points by Hobby Space */}
        <div className="analytics-card breakdown-card">
          <h2>Points by Hobby Space</h2>
          <div className="hobby-space-breakdown">
            {analytics.hobbySpaceBreakdown.length > 0 ? (
              analytics.hobbySpaceBreakdown.map((space, index) => (
                <div key={space.hobbySpaceId} className="hobby-space-item">
                  <div className="hobby-space-rank">#{index + 1}</div>
                  <div className="hobby-space-info">
                    <div className="hobby-space-name">{space.hobbySpaceName}</div>
                    <div className="hobby-space-bar">
                      <div
                        className="hobby-space-bar-fill"
                        style={{
                          width: `${(space.points / analytics.totalPoints) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="hobby-space-points">{space.points} pts</div>
                </div>
              ))
            ) : (
              <div className="no-data">No hobby space data yet</div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="analytics-card stats-card">
          <h2>Additional Stats</h2>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Total Actions</span>
              <span className="stat-value">{analytics.totalActions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Days (Last 30)</span>
              <span className="stat-value">
                {analytics.pointsOverTime.filter((d) => d.points > 0).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Consistency Rate</span>
              <span className="stat-value">
                {(
                  (analytics.pointsOverTime.filter((d) => d.points > 0).length / 30) *
                  100
                ).toFixed(0)}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Recent Actions with Media */}
        {analytics.recentActionsWithMedia && analytics.recentActionsWithMedia.length > 0 && (
          <div className="analytics-card recent-actions-card">
            <h2>Recent Actions with Images</h2>
            <div className="recent-actions-grid">
              {analytics.recentActionsWithMedia.map((action, index) => (
                <div key={index} className="action-media-item">
                  {action.mediaUrls && action.mediaUrls.length > 0 && (
                    <div className="action-media-container">
                      {action.mediaUrls.slice(0, 3).map((url, idx) => (
                        <img key={idx} src={url} alt={`Action media ${idx + 1}`} className="action-media" />
                      ))}
                      {action.mediaUrls.length > 3 && (
                        <div className="media-more">+{action.mediaUrls.length - 3}</div>
                      )}
                    </div>
                  )}
                  <div className="action-info">
                    <div className="action-space">{action.hobbySpace?.name || 'Unknown Space'}</div>
                    <div className="action-points">{action.pointsAwarded} pts</div>
                    <div className="action-date">
                      {new Date(action.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PointsAnalyticsPage;
