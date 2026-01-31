import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { actionsAPI } from '../services/api';
import '../styles/SettingsMenu.css';
import '../styles/HomePage.css';

function HomePage({ user, onLogout }) {
  const [feedActions, setFeedActions] = useState([]);
  const [myHobbySpaces, setMyHobbySpaces] = useState([]);
  const [spaceSummaries, setSpaceSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('hobby-spaces'); // hobby-spaces | feed
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (view === 'feed') {
      fetchFeed();
    }
  }, [view]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Fetch user's hobby spaces with latest post summary
      const summaryResponse = await api.get('/hobby-spaces/user/my-spaces-summary');
      setSpaceSummaries(summaryResponse.data || []);
      setMyHobbySpaces((summaryResponse.data || []).map((s) => s.space));
      setLoading(false);
    } catch (err) {
      setError('Failed to load hobby spaces');
      console.error(err);
      setLoading(false);
    }
  };

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await actionsAPI.getFeed();
      const actions = response.data?.actions || response.data || [];
      setFeedActions(actions);
      setError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load feed';
      setError(message);
      console.error('Feed load error:', err.response?.status, err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSettings = () => setShowSettings((s) => !s);

  const handleViewHobbySpace = (spaceId) => {
    navigate(`/hobby-space/${spaceId}`);
  };

  const handleReactAction = async (actionId) => {
    try {
      const response = await actionsAPI.reactAction(actionId);
      const updated = response.data.action || response.data;
      setFeedActions((prev) => prev.map((a) => (a._id === actionId ? updated : a)));
    } catch (err) {
      console.error('Error reacting to action:', err);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="gradient-header">Grungy</h1>
        <div className="header-actions-right">
          <div className="nav-buttons">
            <button
              className="nav-button"
              onClick={() => navigate('/search')}
            >
              Search
            </button>
            <button
              className="nav-button"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
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
                <div className="settings-item logout" onClick={onLogout}>
                  <div className="settings-title">Logout</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="home-content">
        <div className="view-switcher">
          <button
            className={`switcher-btn ${view === 'hobby-spaces' ? 'active' : ''}`}
            onClick={() => setView('hobby-spaces')}
          >
            My Hobby Spaces
            {myHobbySpaces.length > 0 && <span className="badge">{myHobbySpaces.length}</span>}
          </button>
          <button
            className={`switcher-btn ${view === 'feed' ? 'active' : ''}`}
            onClick={() => setView('feed')}
          >
            My Feed
          </button>
        </div>

        {view === 'hobby-spaces' && myHobbySpaces.length > 0 && (
          <div className="hobby-space-quick-actions">
            <button className="primary-btn" onClick={() => navigate('/hobby-spaces')}>
              Explore Spaces
            </button>
          </div>
        )}

        {view === 'hobby-spaces' ? (
          <>
            {myHobbySpaces.length === 0 ? (
              <div className="empty-state">
                <h2>No hobby spaces yet</h2>
                <p>Explore and join hobby spaces to start tracking your growth!</p>
                <div className="empty-actions">
                  <button 
                    className="primary-btn"
                    onClick={() => navigate('/hobby-spaces')}
                  >
                    Explore Spaces
                  </button>
                  <button 
                    className="secondary-btn"
                    onClick={() => navigate('/hobby-space/create')}
                  >
                    Create New Space
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="post-form-container composer-cta"
                  onClick={() => navigate('/hobby-space/create')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/hobby-space/create')}
                >
                  <div className="cta-text">
                    <h2>✨ Create New Space</h2>
                    <p>Start a new community around a hobby you're passionate about</p>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                {loading ? (
                  <div className="loading-spinner">Loading your spaces...</div>
                ) : spaceSummaries.length === 0 ? (
                  <div className="empty-state">
                    <h2>No spaces joined yet</h2>
                    <p>Join or create a space to get started.</p>
                  </div>
                ) : (
                  <div className="actions-list">
                    {spaceSummaries.map(({ space, latestAction }) => (
                      <div
                        key={space._id}
                        className="action-card"
                        onClick={() => handleViewHobbySpace(space._id)}
                      >
                        <div className="action-header">
                          <div className="action-space-badge">
                            <span className="space-name">{space.name}</span>
                            {latestAction ? (
                              <span className="action-type">{latestAction.actionType}</span>
                            ) : (
                              <span className="action-type">no activity</span>
                            )}
                          </div>
                          {latestAction && (
                            <span className="action-effort">Effort: {latestAction.effortScore}</span>
                          )}
                        </div>

                        {latestAction ? (
                          <>
                            <div className="action-content">{latestAction.content}</div>
                            <div className="action-footer">
                              <span className="user">
                                {latestAction.user?.username}
                              </span>
                              <span className="points">{latestAction.pointsAwarded} points</span>
                            </div>
                          </>
                        ) : (
                          <div className="action-content">Tap to open this space</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            {loading ? (
              <div className="loading-spinner">Loading feed...</div>
            ) : feedActions.length === 0 ? (
              <div className="empty-state">
                <h2>No feed items yet</h2>
                <p>Follow people to see their actions here.</p>
              </div>
            ) : (
              <div className="actions-list">
                {feedActions.map((action) => {
                  const author = action.user || {};
                  const hobbySpace = action.hobbySpace;
                  const authorName = author.username || 'Anonymous';

                  return (
                    <div key={action._id} className="action-card glass">
                      <div className="action-header">
                        <button
                          className="action-user"
                          onClick={() => author._id && navigate(`/profile/${author._id}`)}
                          disabled={!author._id}
                        >
                          {authorName}
                        </button>
                        <div className="action-header-right">
                          <span className="effort-score">Effort: {Math.round(action.effortScore || 0)}</span>
                          {hobbySpace && (
                            <span
                              className="space-name"
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/hobby-space/${hobbySpace._id}`);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  navigate(`/hobby-space/${hobbySpace._id}`);
                                }
                              }}
                            >
                              {hobbySpace.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="action-content">{action.content || 'No content provided'}</p>

                      <div className="action-footer">
                        <span className="action-type">{action.actionType}</span>
                        {hobbySpace && <span className="user">{hobbySpace.name}</span>}
                        <span className="points">{Math.round(action.pointsAwarded || 0)} pts</span>
                      </div>

                      {action.feedbackReceived?.length > 0 && (
                        <div className="feedback-indicator">
                          <span className="feedback-badge">{action.feedbackReceived.length} feedbacks</span>
                        </div>
                      )}

                      <button
                        className={`react-btn react-floating ${action.reactedBy?.includes(user.id) ? 'reacted' : ''}`}
                        onClick={() => handleReactAction(action._id)}
                        title="React"
                      >
                        ❤️ {action.reactions || 0}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
