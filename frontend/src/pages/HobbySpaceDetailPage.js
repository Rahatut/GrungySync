import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/HobbySpaceDetailPage.css';
import api from '../services/api';
import { actionsAPI } from '../services/api';


export default function HobbySpaceDetailPage({ user, onLogout }) {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [feedbackText, setFeedbackText] = useState({});
  const [submittingFeedback, setSubmittingFeedback] = useState({});
  const [expandedFeedback, setExpandedFeedback] = useState({});
  const [expandedForm, setExpandedForm] = useState({});
  const [space, setSpace] = useState(null);
  const [actions, setActions] = useState([]);
  const [actionsError, setActionsError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' or 'mine'
  const menuRef = useRef();

  useEffect(() => {
    fetchSpaceDetails();
    fetchSpaceActions();
    fetchAnalytics();
    // eslint-disable-next-line
  }, [spaceId]);



  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const fetchSpaceDetails = async () => {
    try {
      const response = await api.get(`/hobby-spaces/${spaceId}`);
      setSpace(response.data);
      checkMembership(response.data);
    } catch (error) {
      console.error('Error fetching space details:', error);
    }
  };

  const fetchSpaceActions = async () => {
    try {
      const response = await api.get(`/actions/${spaceId}`);
      setActions(response.data.actions || []);
      setActionsError('');
      setLoading(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load actions';
      setActionsError(message);
      console.error('Error fetching actions:', error.response?.status, error.response?.data || error.message);
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/progress/hobby-space/${spaceId}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const checkMembership = async (spaceData) => {
    try {
      const mySpaces = await api.get('/hobby-spaces/user/my-spaces');
      const isMember = mySpaces.data.some((s) => s._id === spaceId);
      setIsMember(isMember);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const handleJoin = async () => {
    try {
      await api.post(`/hobby-spaces/${spaceId}/join`);
      setIsMember(true);
      fetchAnalytics();
    } catch (error) {
      console.error('Error joining space:', error);
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/hobby-spaces/${spaceId}/leave`);
      setIsMember(false);
      navigate('/hobby-spaces');
    } catch (error) {
      console.error('Error leaving space:', error);
    }
  };

  const handleCreateAction = () => {
    navigate(`/action/create?hobbySpace=${spaceId}`);
  };

  const handleDeleteAction = async (actionId) => {
    if (!window.confirm('Delete this action?')) return;
    try {
      await actionsAPI.deleteAction(actionId);
      setActions((prev) => prev.filter((a) => a._id !== actionId));
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const handleGiveFeedback = async (actionId) => {
    if (!feedbackText[actionId] || feedbackText[actionId].length < 20) {
      alert('Feedback must be at least 20 characters.');
      return;
    }

    try {
      setSubmittingFeedback(prev => ({ ...prev, [actionId]: true }));
      const response = await actionsAPI.giveFeedback(actionId, feedbackText[actionId]);
      
      // Update local state to show message or refresh
      alert('Feedback given! You earned +5 points for this.');
      setFeedbackText(prev => ({ ...prev, [actionId]: '' }));
      setExpandedForm(prev => ({ ...prev, [actionId]: false }));
      fetchSpaceActions(); // Refresh to show new feedback
    } catch (err) {
      console.error('Error giving feedback:', err);
      alert(err.response?.data?.message || 'Failed to give feedback');
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const handleReviseAction = (actionId) => {
    navigate(`/action/create?hobbySpace=${spaceId}&revisionOf=${actionId}`);
  };

  const handleReactAction = async (actionId) => {
    try {
      const response = await actionsAPI.reactAction(actionId);
      const updated = response.data.action || response.data;
      setActions((prev) => prev.map((a) => (a._id === actionId ? updated : a)));
    } catch (error) {
      console.error('Error reacting to action:', error);
    }
  };

  const handleVote = async (actionId, optionIndex) => {
    try {
      await actionsAPI.voteInPoll(actionId, optionIndex);
      fetchSpaceActions();
    } catch (err) {
      console.error('Error voting:', err);
      alert(err.response?.data?.message || 'Failed to vote');
    }
  };

  const handleMyActivity = () => {
    setFeedFilter((prev) => (prev === 'mine' ? 'all' : 'mine'));
  };

  const filteredActions = feedFilter === 'mine' 
    ? actions.filter(a => a.user?._id === user.id)
    : actions;



  if (loading || !space) {
    return <div className="loading">Loading hobby space...</div>;
  }

  return (
    <div className="hobby-space-detail-container">
      <div className="space-header glass" style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2.5rem'}}>
        <div className="header-content">
          <h1 className="gradient-text">{space.name}</h1>
          <p className="slug">#{space.slug}</p>
          {space.description && <p className="description">{space.description}</p>}
        </div>
        <div className="header-actions-vertical">
          {isMember ? (
            <>
              <button className="create-action-btn" onClick={handleCreateAction}>
                + Create Action
              </button>
              <button className="leave-btn" onClick={handleLeave}>
                Leave Space
              </button>
              {space.createdBy?._id === user.id && (
                <button className="edit-space-btn" onClick={() => navigate(`/hobby-space/${spaceId}/edit`)}>
                  ✏️ Edit Space
                </button>
              )}
            </>
          ) : (
            <button className="join-btn" onClick={handleJoin}>
              + Join Space
            </button>
          )}
        </div>
      </div>

      <div className="space-content">
        <div className="space-sidebar">
          <div className="sidebar-card glass">
            <h3>Space Stats</h3>
            <div className="stats-list">
              <div className="stat-item">
                <span className="label">Members</span>
                <span className="value">{space.members?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="label">Total Actions</span>
                <span className="value">{actions.length}</span>
              </div>
              {analytics && (
                <>
                  <div className="stat-item">
                    <span className="label">Total Effort</span>
                    <span className="value">{analytics.totalEffort}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Avg Per Action</span>
                    <span className="value">{analytics.averageEffort}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="sidebar-card glass">
            <h3>Action Config</h3>
            <div className="config-list">
              <div className="config-item">
                <span className="label">Min Effort Required</span>
                <span className="value">{space.actionConfig?.minEffortThreshold || 0} chars</span>
              </div>
              <div className="config-item">
                <span className="label">Daily Point Cap</span>
                <span className="value">{space.actionConfig?.dailyPointCap || 50} pts</span>
              </div>
              <div className="config-item">
                <span className="label">Weekly Point Cap</span>
                <span className="value">{space.actionConfig?.weeklyPointCap || 300} pts</span>
              </div>
              <div className="config-item">
                <span className="label">Consistency Window</span>
                <span className="value">{space.actionConfig?.consistencyWindow || 7} days</span>
              </div>

              <div className="valid-actions">
                <span className="label">Valid Action Types</span>
                <div className="action-tags">
                  {space.actionConfig?.validActions?.map((type) => (
                    <span key={type} className="action-tag">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-main">
          <div className="space-main-header">
            <h2>{feedFilter === 'mine' ? 'My Activity' : 'Recent Activity'}</h2>
            <div className="feed-actions">
              <button 
                className={`my-activity-btn ${feedFilter === 'mine' ? 'active' : ''}`} 
                onClick={handleMyActivity}
              >
                {feedFilter === 'mine' ? 'Show All' : 'My Activity'}
              </button>
              <div className="more-actions-container">
                <button 
                  className="more-btn" 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                  •••
                </button>
                {showMoreMenu && (
                  <div className="more-dropdown glass">
                    <button className="dropdown-item" onClick={() => { navigate(`/action/create?hobbySpace=${spaceId}&type=poll`); setShowMoreMenu(false); }}>Polls</button>
                    <button className="dropdown-item" onClick={() => { navigate(`/action/create?hobbySpace=${spaceId}&type=qna`); setShowMoreMenu(false); }}>QnA</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredActions.length === 0 ? (
            <div className="empty-state glass">
              <p>
                {feedFilter === 'mine' 
                  ? "You haven't posted any activity here yet."
                  : "No actions yet. Be the first to create one!"}
              </p>
            </div>
          ) : (
            <div className="actions-feed">
              {filteredActions.map((action) => (
                <div id={action._id} key={action._id} className="action-card glass">
                  <div className="action-header">
                    <button 
                      className="action-user"
                      onClick={() => navigate(`/profile/${action.user?._id}`)}
                      disabled={!action.user?._id}
                    >
                      {action.user?.username || 'Anonymous'}
                    </button>
                    <div className="action-header-right">
                      {action.actionType !== 'poll' && action.actionType !== 'qna' && (
                        <span className="effort-score">Effort: {action.effortScore}</span>
                      )}
                      {action.isRevision && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="revision-tag">Revision</span>
                          {action.revisionOf && (
                            <button 
                              className="view-original-btn"
                              onClick={() => {
                                const element = document.getElementById(action.revisionOf);
                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              (View Original)
                            </button>
                          )}
                        </div>
                      )}
                      {action.user && action.user._id === user.id && (
                        <>
                          {action.actionType !== 'poll' && action.actionType !== 'qna' && (
                            <button
                              className="action-revise-btn"
                              onClick={() => handleReviseAction(action._id)}
                            >
                              Revise
                            </button>
                          )}
                          <button
                            className="action-delete-btn"
                            onClick={() => handleDeleteAction(action._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="action-content">
                    {action.actionType === 'poll' ? (
                      <div className="poll-display">
                        {action.content && <p className="poll-context">{action.content}</p>}
                        <div className="poll-options-grid">
                          {action.pollOptions?.map((opt, idx) => {
                            const totalVotes = action.pollOptions.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                            const percent = totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;
                            const hasVoted = action.pollOptions.some(o => o.votes?.some(v => v === user.id || v._id === user.id));

                            return (
                              <button 
                                key={idx} 
                                className={`poll-option-btn ${hasVoted ? 'voted' : ''}`}
                                onClick={() => !hasVoted && handleVote(action._id, idx)}
                                disabled={hasVoted}
                              >
                                <div className="opt-bg" style={{ width: `${percent}%` }}></div>
                                <span className="opt-label">{opt.option}</span>
                                <span className="opt-results">{percent}% ({opt.votes?.length || 0})</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="poll-footer">
                          {action.pollOptions?.reduce((sum, o) => sum + (o.votes?.length || 0), 0)} total votes
                        </div>
                      </div>
                    ) : action.actionType === 'qna' ? (
                      <div className="qna-display">
                        <div className="qna-question-card">
                          <span className="qna-q-badge">Question</span>
                          <h3>{action.question}</h3>
                        </div>
                        {action.content && <p className="qna-details">{action.content}</p>}
                        {action.answer && (
                          <div className="qna-answer-card">
                            <span className="qna-a-badge">Answer</span>
                            <p>{action.answer}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>{action.content}</p>
                    )}
                  </div>

                  <div className="action-footer">
                    <span className="action-type">{action.actionType}</span>
                    {action.pointsAwarded > 0 && (
                      <span className="points">{action.pointsAwarded} pts</span>
                    )}
                  </div>

                  {action.mediaUrls && action.mediaUrls.length > 0 && (
                    <div className="action-media">
                      <div className="media-grid">
                        {action.mediaUrls.map((url, idx) => (
                          <div key={idx} className="media-item">
                            {url.includes('/video/') ? (
                              <video src={url} controls style={{ width: '100%', borderRadius: '4px' }} />
                            ) : (
                              <img src={url} alt={`Action media ${idx + 1}`} style={{ width: '100%', borderRadius: '4px' }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="action-footer-controls">
                    <button
                      className={`react-btn ${action.reactedBy?.includes(user.id) ? 'reacted' : ''}`}
                      onClick={() => handleReactAction(action._id)}
                      title="React"
                    >
                      ❤️ {action.reactions || 0}
                    </button>
                    
                    {action.feedbackReceived?.length > 0 && (
                      <button 
                        className="toggle-feedback-list-btn"
                        onClick={() => setExpandedFeedback(prev => ({ ...prev, [action._id]: !prev[action._id] }))}
                      >
                        {expandedFeedback[action._id] ? 'Hide' : 'Show'} Feedback ({action.feedbackReceived.length})
                      </button>
                    )}

                    {action.user?._id !== user.id && !expandedForm[action._id] && (
                      <button 
                        className="initiate-feedback-btn"
                        onClick={() => setExpandedForm(prev => ({ ...prev, [action._id]: true }))}
                      >
                        Give Feedback
                      </button>
                    )}
                  </div>

                  {action.feedbackReceived?.length > 0 && expandedFeedback[action._id] && (
                    <div className="feedback-list">
                      <h4>Community Feedback</h4>
                      {action.feedbackReceived.map((f, i) => (
                        <div key={i} className="feedback-item-comment glass">
                          <div className="comment-header">
                            <div className="comment-user">
                              <div className="comment-avatar">
                                {f.from?.avatar ? (
                                  <img src={f.from.avatar} alt={f.from.username} />
                                ) : (
                                  (f.from?.username || '?').charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="comment-username">{f.from?.username || 'Anonymous'}</span>
                            </div>
                            <span className="comment-date">
                              {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <div className="comment-body">
                            <p>{f.feedback}</p>
                          </div>
                          <span className="feedback-meta">
                            +{f.pointsForFeedback} pts awarded
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {action.user?._id !== user.id && expandedForm[action._id] && (
                    <div className="give-feedback-section expanded">
                      <textarea
                        className="feedback-input"
                        placeholder="Give constructive feedback (min 20 chars)..."
                        value={feedbackText[action._id] || ''}
                        onChange={(e) => setFeedbackText(prev => ({ ...prev, [action._id]: e.target.value }))}
                      />
                      <div className="feedback-form-actions">
                        <button 
                          className="cancel-feedback-btn"
                          onClick={() => setExpandedForm(prev => ({ ...prev, [action._id]: false }))}
                        >
                          Cancel
                        </button>
                        <button 
                          className="submit-feedback-btn"
                          onClick={() => handleGiveFeedback(action._id)}
                          disabled={submittingFeedback[action._id]}
                        >
                          {submittingFeedback[action._id] ? 'Sending...' : 'Send Feedback'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Heart reaction removed from here (now in control bar) */}
                </div>
              ))}
            </div>
          )}
          {actionsError && <div className="error-message">{actionsError}</div>}
        </div>
      </div>
    </div>
  );
}
