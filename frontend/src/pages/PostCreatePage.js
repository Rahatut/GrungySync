import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import HeaderBar from '../components/HeaderBar';
import '../styles/PostCreate.css';

function PostCreatePage({ user, onPostCreated, onLogout }) {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);

    // Limit to 10 files
    if (mediaFiles.length + files.length > 10) {
      setError('Maximum 10 files allowed per post');
      return;
    }

    setMediaFiles((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreviews((prev) => [...prev, { url: reader.result, type: 'image' }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreviews((prev) => [...prev, { url: reader.result, type: 'video' }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!content.trim() && mediaFiles.length === 0) {
      setError('Please add content or media to your post');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);

      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      const response = await postsAPI.createPost(formData);
      if (onPostCreated) {
        onPostCreated(response.data.post);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-create-container">
      <HeaderBar user={user} onLogout={onLogout} />
      <div className="post-create-header">
        <h1>Create a Post</h1>
        <button
          className="create-cancel-btn"
          onClick={() => navigate('/')}
          disabled={loading}
        >
          Cancel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="post-create-form">
        <div className="post-create-user">
          {user && (
            <>
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="user-avatar" />
              ) : (
                <div className="user-avatar-fallback">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="user-info">
                <h3>{user.username}</h3>
                <p>@{user.username}</p>
              </div>
            </>
          )}
        </div>

        <div className="form-group">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="What's happening?!"
            className="post-content-input"
            rows="6"
            disabled={loading}
            maxLength="500"
          />
          <small className="char-count">
            {content.length}/500
          </small>
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
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="add-media-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || mediaFiles.length >= 10}
          >
            📎 Add Media
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
            className="submit-post-btn"
            disabled={loading || (!content.trim() && mediaFiles.length === 0)}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostCreatePage;
