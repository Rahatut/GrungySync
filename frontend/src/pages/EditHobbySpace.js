import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/CreateHobbySpace.css';
import api from '../services/api';
import HeaderBar from '../components/HeaderBar';

export default function EditHobbySpace({ user, onLogout }) {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'Other',
    minEffortThreshold: 50,
    dailyPointCap: 50,
    weeklyPointCap: 300,
    consistencyWindow: 7,
    validActions: ['post', 'log', 'upload', 'reflect'],
  });

  const categories = ['Art', 'Music', 'Fitness', 'Writing', 'Tech', 'Learning', 'Crafts', 'Other'];

  useEffect(() => {
    fetchSpaceData();
  }, [spaceId]);

  const fetchSpaceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/hobby-spaces/${spaceId}`);
      const space = response.data;

      // Check if user is the creator
      if (space.createdBy?._id !== user.id && space.createdBy !== user.id) {
        setError('You do not have permission to edit this space');
        setTimeout(() => navigate(`/hobby-space/${spaceId}`), 2000);
        return;
      }

      setFormData({
        name: space.name,
        slug: space.slug,
        description: space.description,
        category: space.category,
        minEffortThreshold: space.actionConfig?.minEffortThreshold || 50,
        dailyPointCap: space.actionConfig?.dailyPointCap || 50,
        weeklyPointCap: space.actionConfig?.weeklyPointCap || 300,
        consistencyWindow: space.actionConfig?.consistencyWindow || 7,
        validActions: space.actionConfig?.validActions || ['post', 'log', 'upload', 'reflect'],
      });
    } catch (err) {
      setError('Failed to load space: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Cap') || name.includes('Window') || name === 'minEffortThreshold'
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleActionTypeToggle = (actionType) => {
    setFormData((prev) => ({
      ...prev,
      validActions: prev.validActions.includes(actionType)
        ? prev.validActions.filter((a) => a !== actionType)
        : [...prev.validActions, actionType],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.put(`/hobby-spaces/${spaceId}`, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        actionConfig: {
          validActions: formData.validActions,
          minEffortThreshold: formData.minEffortThreshold,
          dailyPointCap: formData.dailyPointCap,
          weeklyPointCap: formData.weeklyPointCap,
          consistencyWindow: formData.consistencyWindow,
        },
      });

      navigate(`/hobby-space/${spaceId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating hobby space');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const response = await api.delete(`/hobby-spaces/${spaceId}`);
      console.log('Delete response:', response);
      navigate('/hobby-spaces');
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error deleting hobby space';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="create-hobby-space-container">
        <div className="loading-spinner">Loading space...</div>
      </div>
    );
  }

  return (
    <div className="create-hobby-space-container">
      <HeaderBar user={user} onLogout={onLogout} />
      <div className="create-form-card glass">
        <h1 className="gradient-text">Edit Hobby Space</h1>
        <p className="subtitle">Update your community settings</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid two-col">
            <div className="form-group">
              <label htmlFor="name">Space Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Digital Photography"
                required
                maxLength="100"
                disabled={loading}
              />
              <span className="helper-text">Give it a memorable title people can find.</span>
            </div>

            <div className="form-group">
              <label htmlFor="slug">URL Slug *</label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g., digital-photography"
                required
                maxLength="50"
                disabled={loading}
              />
              <span className="helper-text">Used in the link — keep it short and lowercase.</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What's this space about?"
              rows="4"
              maxLength="500"
              required
              disabled={loading}
            />
            <span className="helper-text">Share who this is for and what members should expect.</span>
          </div>

          <div className="form-grid two-col">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <div className="category-grid">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`category-btn ${formData.category === c ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, category: c }))}
                    disabled={loading}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group inline-note">
              <label htmlFor="minEffortThreshold">Min Effort (chars)</label>
              <input
                type="number"
                id="minEffortThreshold"
                name="minEffortThreshold"
                value={formData.minEffortThreshold}
                onChange={handleChange}
                min="0"
                max="500"
                disabled={loading}
              />
              <span className="helper-text">Minimum text required unless media is attached.</span>
            </div>
          </div>

          <div className="config-section">
            <h3>Action Configuration</h3>

            <div className="form-group">
              <label>Valid Action Types</label>
              <div className="action-types-grid">
                {['post', 'log', 'upload', 'reflect'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`action-type-btn ${formData.validActions.includes(type) ? 'active' : ''}`}
                    onClick={() => handleActionTypeToggle(type)}
                    disabled={loading}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <span className="helper-text">Choose what members can post here.</span>
            </div>

            <div className="config-grid">
              <div className="form-group">
                <label htmlFor="dailyPointCap">Daily Point Cap</label>
                <input
                  type="number"
                  id="dailyPointCap"
                  name="dailyPointCap"
                  value={formData.dailyPointCap}
                  onChange={handleChange}
                  min="10"
                  max="500"
                  disabled={loading}
                />
                <span className="helper-text">Stops one day from earning everything.</span>
              </div>

              <div className="form-group">
                <label htmlFor="weeklyPointCap">Weekly Point Cap</label>
                <input
                  type="number"
                  id="weeklyPointCap"
                  name="weeklyPointCap"
                  value={formData.weeklyPointCap}
                  onChange={handleChange}
                  min="50"
                  max="2000"
                  disabled={loading}
                />
                <span className="helper-text">Keeps pacing across the week.</span>
              </div>

              <div className="form-group">
                <label htmlFor="consistencyWindow">Consistency Window (days)</label>
                <input
                  type="number"
                  id="consistencyWindow"
                  name="consistencyWindow"
                  value={formData.consistencyWindow}
                  onChange={handleChange}
                  min="1"
                  max="30"
                  disabled={loading}
                />
                <span className="helper-text">Used for streaks/consistency calculations.</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate(`/hobby-space/${spaceId}`)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="form-delete-section">
            <button type="button" className="delete-btn" onClick={handleDelete} disabled={loading}>
              Delete Space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
