import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/HobbySpaceDetailPage.css';
import api from '../services/api';
import { actionsAPI } from '../services/api';
import HeaderBar from '../components/HeaderBar';

export default function HobbySpaceDetailPage({ user, onLogout }) {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [actions, setActions] = useState([]);
  const [actionsError, setActionsError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchSpaceDetails();
    fetchSpaceActions();
    fetchAnalytics();
  }, [spaceId]);

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

  const handleReactAction = async (actionId) => {
    try {
      const response = await actionsAPI.reactAction(actionId);
      const updated = response.data.action || response.data;
      setActions((prev) => prev.map((a) => (a._id === actionId ? updated : a)));
    } catch (error) {
      console.error('Error reacting to action:', error);
    }
  };

  if (loading || !space) {
    return <div className="loading">Loading hobby space...</div>;
  }

  return (
    <div className="hobby-space-detail-container">
      <HeaderBar user={user} onLogout={onLogout} />
      <div className="space-header glass">
        <div className="header-content">
          <h1 className="gradient-text">{space.name}</h1>
          <p className="slug">#{space.slug}</p>
          {space.description && <p className="description">{space.description}</p>}
        </div>

        <div className="header-actions">
          {space.createdBy?._id === user.id && (
            <button className="edit-space-btn" onClick={() => navigate(`/hobby-space/${spaceId}/edit`)}>
              ✏️ Edit Space
            </button>
          )}
          {isMember ? (
            <>
              <button className="create-action-btn" onClick={handleCreateAction}>
                + Create Action
              </button>
              <button className="leave-btn" onClick={handleLeave}>
                Leave Space
              </button>
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
          <h2>Recent Activity</h2>
          {actions.length === 0 ? (
            <div className="empty-state glass">
              <p>No actions yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="actions-feed">
              {actions.map((action) => (
                <div key={action._id} className="action-card glass">
                  <div className="action-header">
                    <button 
                      className="action-user"
                      onClick={() => navigate(`/profile/${action.user?._id}`)}
                      disabled={!action.user?._id}
                    >
                      {action.user?.username || 'Anonymous'}
                    </button>
                    <div className="action-header-right">
                      <span className="effort-score">Effort: {action.effortScore}</span>
                      {action.user && action.user._id === user.id && (
                        <button
                          className="action-delete-btn"
                          onClick={() => handleDeleteAction(action._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="action-content">{action.content}</p>

                  <div className="action-footer">
                    <span className="action-type">{action.actionType}</span>
                    <span className="points">{action.pointsAwarded} pts</span>
                  </div>

                  {action.feedbackReceived?.length > 0 && (
                    <div className="feedback-preview">
                      <span className="feedback-count">{action.feedbackReceived.length} feedbacks</span>
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
              ))}
            </div>
          )}
          {actionsError && <div className="error-message">{actionsError}</div>}
        </div>
      </div>
    </div>
  );
}
