
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI, actionsAPI } from '../services/api';
import '../styles/ProfilePage.css';
import '../styles/SettingsMenu.css';
import '../styles/SearchPage.css';

import api from '../services/api';
import '../styles/PointsAnalyticsPage.css';

function ProfilePage({ user, onLogout }) {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [userActions, setUserActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();

  // Points Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      onLogout();
      navigate('/auth');
    }
  };

  useEffect(() => {
    if (userId) {
      loadProfileData();
      fetchPointsAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUserProfile(), fetchUserActions()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!userId) {
        setError('No user ID provided');
        return;
      }
      const response = await authAPI.getUserById(userId);
      setProfileUser(response.data);
      // Check if current user is following this user
      const currentUserRes = await authAPI.getProfile();
      const isFollowingUser = currentUserRes.data.following.some(
        (followedUser) => followedUser._id === userId || followedUser === userId
      );
      setIsFollowing(isFollowingUser);
    } catch (err) {
      setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
      console.error('Profile fetch error:', err);
    }
  };

  const fetchUserActions = async () => {
    try {
      const response = await actionsAPI.getUserActions(userId);
      setUserActions(response.data);
    } catch (err) {
      console.error('Error fetching user actions:', err);
    }
  };

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await authAPI.unfollowUser(userId);
      } else {
        await authAPI.followUser(userId);
      }
      setIsFollowing(!isFollowing);
      fetchUserProfile();
    } catch (err) {
      setError('Failed to update follow status');
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  // --- Points Analytics Logic ---
  const fetchPointsAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      // Use user-specific analytics endpoint if available, else fallback to generic
      const response = await api.get(`/progress/points-analytics/${userId}`);
      setAnalytics(response.data);
      setAnalyticsError(null);
    } catch (err) {
      // fallback: try old endpoint (for self)
      try {
        if (userId === user.id) {
          const response = await api.get('/progress/points-analytics');
          setAnalytics(response.data);
          setAnalyticsError(null);
        } else {
          setAnalyticsError('Failed to load analytics data');
        }
      } catch (err2) {
        setAnalyticsError('Failed to load analytics data');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !profileUser) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">

      <div className="profile-content">
        {profileUser && (
          <div className="profile-card" key={profileUser._id}>
            {profileUser.banner && (
              <div className="profile-banner">
                <img src={profileUser.banner} alt="Banner" />
              </div>
            )}
            <div className="profile-avatar-large">
              {profileUser.avatar && !profileUser.avatar.includes('placeholder') ? (
                <img src={profileUser.avatar} alt="Avatar" />
              ) : (
                profileUser.username.charAt(0).toUpperCase()
              )}
            </div>
            <h2>{profileUser.username}</h2>
            <p className="email">{profileUser.email}</p>
            {profileUser.bio && <p className="bio">{profileUser.bio}</p>}
            {profileUser.pronouns && <p className="pronouns">{profileUser.pronouns}</p>}
            {profileUser.location && <p className="location">📍 {profileUser.location}</p>}
            {profileUser.website && (
              <p className="website">
                <a href={profileUser.website} target="_blank" rel="noopener noreferrer">
                  🔗 {profileUser.website}
                </a>
              </p>
            )}

            <div className="profile-stats">
              <div className="stat">
                <div className="stat-number">{userActions.length}</div>
                <div className="stat-label">Actions</div>
              </div>
              <div className="stat clickable" onClick={() => navigate(`/profile/${profileUser._id || profileUser.id}/followers`)}>
                <div className="stat-number">{profileUser.followers?.length || 0}</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="stat clickable" onClick={() => navigate(`/profile/${profileUser._id || profileUser.id}/following`)}>
                <div className="stat-number">{profileUser.following?.length || 0}</div>
                <div className="stat-label">Following</div>
              </div>
            </div>


            {userId === user.id && (
              <div className="profile-actions">
                <button
                  className="action-button"
                  onClick={() => navigate('/profile/edit')}
                >
                  Edit Profile
                </button>
                <button
                  className="action-button secondary"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}

            {userId !== user.id && (
              <div className="profile-actions">
                <button
                  className={`action-button ${isFollowing ? 'secondary' : ''}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- Points Analytics Section --- */}
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          {analyticsLoading ? (
            <div className="points-analytics-page">
              <div className="loading">Loading analytics...</div>
            </div>
          ) : analyticsError ? (
            <div className="points-analytics-page">
              <div className="error">{analyticsError}</div>
            </div>
          ) : analytics ? (
            <div className="points-analytics-page" style={{ background: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
              {/* Analytics Top Row: Points Distribution, Hobby Space, Additional Stats */}
              <div className="analytics-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {/* Points Distribution */}
                <div className="analytics-card breakdown-card">
                  <h2>Points Distribution</h2>
                  <div className="stats-list">
                    {analytics.pointsByType && Object.entries(analytics.pointsByType).map(([type, points]) => (
                      <div key={type} className="stat-item">
                        <span className="stat-label" style={{ textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</span>
                        <span className="stat-value">{points} pts</span>
                      </div>
                    ))}
                    {(!analytics.pointsByType || Object.keys(analytics.pointsByType).length === 0) && (
                      <div className="no-data">No point distribution data yet</div>
                    )}
                  </div>
                </div>
                {/* Points by Hobby Space */}
                <div className="analytics-card breakdown-card">
                  <h2>Hobby Focus</h2>
                  <div className="hobby-space-breakdown">
                    {(() => {
                      const breakdown = analytics.hobbySpaceBreakdown || [];
                      const items = breakdown.slice(0, 3);
                      while (items.length < 3) {
                        items.push(null);
                      }
                      return items.map((space, index) => (
                        space ? (
                          <div key={space.hobbySpaceId || index} className="hobby-space-item">
                            <div className="hobby-space-rank">#{index + 1}</div>
                            <div className="hobby-space-info">
                              <div className="hobby-space-name">{space.hobbySpaceName}</div>
                              <div className="hobby-space-bar">
                                <div
                                  className="hobby-space-bar-fill"
                                  style={{ width: `${(space.points / (analytics.totalPoints || 1)) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="hobby-space-points">{space.points} pts</div>
                          </div>
                        ) : (
                          <div key={"placeholder-" + index} className="hobby-space-item" style={{ opacity: 0.4 }}>
                            <div className="hobby-space-rank">#{index + 1}</div>
                            <div className="hobby-space-info">
                              <div className="hobby-space-name" style={{ color: '#aaa' }}>No Data</div>
                              <div className="hobby-space-bar">
                                <div className="hobby-space-bar-fill" style={{ width: '0%' }}></div>
                              </div>
                            </div>
                            <div className="hobby-space-points">--</div>
                          </div>
                        )
                      ));
                    })()}
                  </div>
                </div>
                {/* Achievements Card */}
                <div className="analytics-card stats-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ margin: 0 }}>Achievements</h2>
                    <button
                      className="action-button"
                      style={{ fontSize: 12, padding: '6px 16px', borderRadius: 8, fontWeight: 700 }}
                      onClick={() => navigate('/achievements')}
                    >
                      View All
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 16 }}>
                    {(() => {
                      // Define all possible achievements (id, label, SVG, color)
                      const allAchievements = [
                        {
                          id: 'streak7',
                          label: '7-Day Streak',
                          svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8c25d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>,
                        },
                        {
                          id: 'community',
                          label: 'Community Builder',
                          svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#95d1d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="8" r="3"></circle><circle cx="17" cy="8" r="3"></circle><circle cx="12" cy="17" r="3"></circle><path d="M7 11v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-2"></path></svg>,
                        },
                        {
                          id: 'trend',
                          label: 'Trend Setter',
                          svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec6281" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
                        },
                        {
                          id: 'master',
                          label: 'Master',
                          svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bfc8c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
                        },
                      ];
                      // Get unlocked badge ids from analytics (if available)
                      const unlocked = (analytics && analytics.badges) ? analytics.badges.map(b => (b.badgeId && b.badgeId.code) || b.badgeId || b.code || b.id) : [];
                      return allAchievements.map((ach, idx) => {
                        const isUnlocked = unlocked.includes(ach.id);
                        return (
                          <div
                            key={ach.id}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              borderRadius: 14,
                              padding: 16,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              minHeight: 90,
                              opacity: isUnlocked ? 1 : 0.4,
                              filter: isUnlocked ? 'none' : 'grayscale(1)',
                              boxShadow: isUnlocked ? '0 2px 12px 0 rgba(0,0,0,0.10)' : 'none',
                              transition: 'box-shadow 0.2s',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>{ach.svg}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{ach.label}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              {/* The rest of analytics (summary cards, chart, recent actions) */}
              <div style={{ height: 32 }} />
              <div className="analytics-grid">
                {/* Summary Cards */}
                <div className="analytics-card summary-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.totalPoints?.toLocaleString?.() ?? 0}</div>
                    <div className="card-label">Total Points</div>
                  </div>
                </div>
                <div className="analytics-card summary-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.currentStreak ?? 0}</div>
                    <div className="card-label">Day Streak</div>
                  </div>
                </div>
                <div className="analytics-card summary-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.thisWeekTotal ?? 0}</div>
                    <div className="card-label">This Week</div>
                  </div>
                </div>
                <div className="analytics-card summary-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.thisMonthTotal ?? 0}</div>
                    <div className="card-label">This Month</div>
                  </div>
                </div>
                <div className="analytics-card summary-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.highestDayThisMonth ?? 0}</div>
                    <div className="card-label">Best Day This Month</div>
                  </div>
                </div>
                <div className="analytics-card summary-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.averagePointsPerAction ?? 0}</div>
                    <div className="card-label">Avg Points/Action</div>
                  </div>
                </div>



                {/* Points by Hobby Space (again, for full analytics view) */}
                {/* <div className="analytics-card breakdown-card"> ... </div> */}

                {/* Additional Stats (again, for full analytics view) */}
                {/* <div className="analytics-card stats-card"> ... </div> */}

                {/* Points Distribution (again, for full analytics view) */}
                {/* <div className="analytics-card breakdown-card"> ... </div> */}

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
          ) : null}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-actions-section">
          <h3>Actions in Hobby Spaces</h3>
          {userActions.length === 0 ? (
            <div className="empty-state">
              <h2>No actions yet</h2>
              <p>This user hasn't created any actions yet</p>
            </div>
          ) : (
            <div className="actions-list">
              {userActions.map((action) => {
                const hobbySpace = action.hobbySpace;
                return (
                  <div key={action._id} className="action-card glass">
                    <div className="action-header">
                      <button
                        className="action-user"
                        onClick={() => hobbySpace?._id && navigate(`/hobby-space/${hobbySpace._id}`)}
                        disabled={!hobbySpace?._id}
                      >
                        {hobbySpace?.name || 'Unknown Space'}
                      </button>
                      <div className="action-header-right">
                        <span className="effort-score">Effort: {Math.round(action.effortScore || 0)}</span>
                        {action.isRevision && (
                          <span className="revision-tag">Revision</span>
                        )}
                      </div>
                    </div>

                    <p className="action-content">{action.content || 'No content provided'}</p>

                    {action.mediaUrls && action.mediaUrls.length > 0 && (
                      <div className="action-media">
                        <div className="media-grid">
                          {action.mediaUrls.map((url, idx) => (
                            <div key={idx} className="media-item">
                              {url.includes('/video/') ? (
                                <video src={url} controls style={{ width: '100%', borderRadius: '4px' }} />
                              ) : (
                                <img src={url} alt={`Media ${idx + 1}`} style={{ width: '100%', borderRadius: '4px' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="action-footer">
                      <span className="action-type">{action.actionType}</span>
                      <span className="points">{Math.round(action.pointsAwarded || 0)} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
