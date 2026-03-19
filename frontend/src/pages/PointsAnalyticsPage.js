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
        <h1>Points Analytics</h1>
      </div>

      <div className="analytics-grid">
        {/* Summary Cards */}
        <div className="analytics-card summary-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
          </div>
          <div className="card-content">
            <div className="card-value">{analytics.totalPoints.toLocaleString()}</div>
            <div className="card-label">Total Points</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
          </div>
          <div className="card-content">
            <div className="card-value">{analytics.currentStreak}</div>
            <div className="card-label">Day Streak</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div className="card-content">
            <div className="card-value">{analytics.thisWeekTotal}</div>
            <div className="card-label">This Week</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div className="card-content">
            <div className="card-value">{analytics.thisMonthTotal}</div>
            <div className="card-label">This Month</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div className="card-content">
            <div className="card-value">{analytics.highestDayThisMonth}</div>
            <div className="card-label">Best Day This Month</div>
          </div>
        </div>

        <div className="analytics-card summary-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
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
                    className={`bar ${day.points === 0 ? 'empty' : ''}`}
                    style={{
                      height: `${(day.points / maxPoints) * 100}%`
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

        {/* Points Distribution */}
        <div className="analytics-card breakdown-card">
          <h2>Points Distribution</h2>
          <div className="stats-list">
            {analytics.pointsByType && Object.entries(analytics.pointsByType).map(([type, points]) => (
              <div key={type} className="stat-item">
                <span className="stat-label" style={{ textTransform: 'capitalize' }}>
                  {type.replace(/_/g, ' ')}
                </span>
                <span className="stat-value">{points} pts</span>
              </div>
            ))}
            {(!analytics.pointsByType || Object.keys(analytics.pointsByType).length === 0) && (
              <div className="no-data">No point distribution data yet</div>
            )}
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
