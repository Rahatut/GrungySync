import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
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
  const [revisingAction, setRevisingAction] = useState(null);
  const revisionId = params.get('revisionOf');
  const fileInputRef = useRef(null);
  
  // For Polls
  const [pollOptions, setPollOptions] = useState(['', '']);
  // For QnA
  const [question, setQuestion] = useState('');

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

    // Fetch original action if revision
    const fetchOriginalAction = async () => {
      try {
        if (!revisionId) return;
        const res = await api.get(`/actions/action/${revisionId}`);
        setRevisingAction(res.data);
        // Pre-fill some fields based on original if desired
        if (res.data.actionType) setActionType(res.data.actionType);
      } catch (e) {
        console.error('Error fetching action for revision:', e);
      }
    };
    fetchOriginalAction();

    // Set type from URL if provided
    const requestedType = params.get('type');
    if (requestedType) setActionType(requestedType);
  }, [hobbySpaceId, revisionId]);

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
    if (actionType === 'poll' && (pollOptions.filter(o => o.trim()).length < 2)) {
      setError('A poll must have at least 2 options');
      return;
    }
    if (actionType === 'qna' && !question.trim()) {
      setError('Please enter a question for your QnA');
      return;
    }
    if (actionType !== 'poll' && actionType !== 'qna' && !content.trim() && mediaFiles.length === 0) {
      setError('Add some text or attach media');
      return;
    }

    setLoading(true);
    try {
      // Use FormData to send both text and files
      const formData = new FormData();
      formData.append('hobbySpaceId', hobbySpaceId);
      formData.append('actionType', actionType);
      
      if (actionType === 'poll') {
        formData.append('pollOptions', JSON.stringify(pollOptions.filter(o => o.trim())));
      } else if (actionType === 'qna') {
        formData.append('question', question);
        formData.append('content', content); // optional explanation
      } else {
        formData.append('content', content);
      }
      formData.append('visibility', 'public');
      
      // Add media files
      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      if (revisionId) {
        formData.append('isRevision', 'true');
        formData.append('revisionOf', revisionId);
      }

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
      <div className="action-create-header">
        <h1>Create Action {spaceName ? `in ${spaceName}` : ''}</h1>
        <button className="create-cancel-btn" onClick={() => navigate(-1)} disabled={loading}>
          Cancel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {revisingAction && (
        <div className="revising-context-banner glass">
          <div className="banner-badge">Revision</div>
          <div className="banner-content">
            <p className="revising-label">Working on improvement of:</p>
            <p className="original-preview">"{revisingAction.content?.substring(0, 120)}..."</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="action-create-form">
        <div className="action-type-selector">
          {actionType !== 'poll' && actionType !== 'qna' && ['post', 'log', 'upload', 'reflect'].map((type) => (
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
          {(actionType === 'poll' || actionType === 'qna') && (
            <div className="special-type-indicator">
              {actionType.toUpperCase()}
            </div>
          )}
        </div>

        {actionType === 'poll' ? (
          <div className="form-group poll-setup">
            <label>Poll Options (Max 5)</label>
            <div className="poll-options-inputs">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="poll-option-row">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[idx] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${idx + 1}...`}
                    className="poll-option-input"
                    maxLength="50"
                  />
                  {pollOptions.length > 2 && (
                    <button 
                      type="button" 
                      className="remove-opt-btn"
                      onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <button 
                  type="button" 
                  className="add-opt-btn"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                >
                  + Add Option
                </button>
              )}
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Add some context for this poll (optional)..."
              className="action-content-input"
              rows="3"
            />
          </div>
        ) : actionType === 'qna' ? (
          <div className="form-group qna-setup">
            <label>Your Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are you wondering about?"
              className="qna-question-input"
              maxLength="150"
            />
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Add more details or context here..."
              className="action-content-input"
              rows="4"
            />
          </div>
        ) : (
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
        )}

        <div className="form-actions">
          {actionType !== 'poll' && (
            <button
              type="button"
              className="add-media-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || mediaFiles.length >= 10}
            >
              📎 Add Media {actionType === 'qna' ? '' : '(counted)'}
            </button>
          )}
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
