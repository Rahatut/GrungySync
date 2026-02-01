import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import HeaderBar from '../components/HeaderBar';
import '../styles/ActionCreate.css';

function ActionCreatePage({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const hobbySpaceId = params.get('hobbySpace');

  const [actionType, setActionType] = useState('post');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch space name for context
    const fetchSpace = async () => {
      try {
        if (!hobbySpaceId) return;
        const res = await api.get(`/hobby-spaces/${hobbySpaceId}`);
        setSpaceName(res.data?.name || '');
      } catch (e) {
        // ignore
      }
    };
    fetchSpace();
  }, [hobbySpaceId]);

  const handleContentChange = (e) => setContent(e.target.value);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);

    if (mediaFiles.length + files.length > 10) {
      setError('Maximum 10 files allowed');
      return;
    }

    setMediaFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews((prev) => [
          ...prev,
          { url: reader.result, type: file.type.startsWith('video/') ? 'video' : 'image' },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hobbySpaceId) {
      setError('Missing hobby space');
      return;
    }

    // Validate minimal content or media for 'post'
    if (!content.trim() && mediaFiles.length === 0) {
      setError('Add some text or attach media');
      return;
    }

    setLoading(true);
    try {
      // Use FormData to send both text and files
      const formData = new FormData();
      formData.append('hobbySpaceId', hobbySpaceId);
      formData.append('actionType', actionType);
      formData.append('content', content);
      formData.append('visibility', 'public');
      
      // Add media files
      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      console.log('Submitting action with FormData:', {
        hobbySpaceId,
        actionType,
        contentLength: content.length,
        mediaCount: mediaFiles.length,
        formDataEntries: Array.from(formData.entries()).map(([k, v]) => [k, v.name || v]),
      });

      await api.post('/actions', formData);

      console.log('Action created successfully');
      // Navigate back to space
      navigate(`/hobby-space/${hobbySpaceId}`);
    } catch (err) {
      console.error('Error creating action:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="action-create-container">
      <HeaderBar user={user} onLogout={onLogout} />
      <div className="action-create-header">
        <h1>Create Action {spaceName ? `in ${spaceName}` : ''}</h1>
        <button className="create-cancel-btn" onClick={() => navigate(-1)} disabled={loading}>
          Cancel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="action-create-form">
        <div className="action-type-selector">
          {['post', 'log', 'upload', 'reflect'].map((type) => (
            <button
              key={type}
              type="button"
              className={`type-btn ${actionType === type ? 'active' : ''}`}
              onClick={() => setActionType(type)}
              disabled={loading}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="form-group">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder={
              actionType === 'reflect'
                ? 'Share reflections and learning points...'
                : 'Write your update...'
            }
            className="action-content-input"
            rows="6"
            disabled={loading}
            maxLength="1000"
          />
          <small className="char-count">{content.length}/1000</small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="add-media-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || mediaFiles.length >= 10}
          >
            📎 Add Media (counted)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaChange}
            style={{ display: 'none' }}
            disabled={loading}
          />
          <button
            type="submit"
            className="submit-action-btn"
            disabled={loading || (!content.trim() && mediaFiles.length === 0)}
          >
            {loading ? 'Creating...' : 'Create Action'}
          </button>
        </div>

        {mediaPreviews.length > 0 && (
          <div className="media-previews">
            <h3>Attachments ({mediaPreviews.length})</h3>
            <div className="media-grid">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="media-preview-item">
                  {preview.type === 'image' ? (
                    <img src={preview.url} alt={`Preview ${index}`} />
                  ) : (
                    <video src={preview.url} controls />
                  )}
                  <button
                    type="button"
                    className="remove-media-btn"
                    onClick={() => removeMedia(index)}
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="media-note">Attachments are counted for effort but not stored.</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default ActionCreatePage;
