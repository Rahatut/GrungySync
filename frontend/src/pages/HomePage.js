import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import '../styles/HomePage.css';

function HomePage({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getAllPosts();
      setPosts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      await postsAPI.createPost({ content: postContent });
      setPostContent('');
      fetchPosts();
    } catch (err) {
      setError('Failed to create post');
      console.error(err);
    }
  };

  const handleReact = async (postId, isReacted) => {
    try {
      await postsAPI.reactPost(postId);
      fetchPosts();
    } catch (err) {
      setError('Failed to react to post');
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(postId);
        fetchPosts();
      } catch (err) {
        setError('Failed to delete post');
        console.error(err);
      }
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/auth');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Grungy</h1>
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
          <button className="nav-button" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </div>

      <div className="home-content">
        <div className="post-form-container">
          <h2>What's on your mind?</h2>
          <form onSubmit={handlePostSubmit}>
            <div className="post-input-group">
              <textarea
                className="post-input"
                placeholder="Share your thoughts..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                maxLength={500}
              />
              <button type="submit" className="post-submit-btn">
                Post
              </button>
            </div>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-spinner">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h2>No posts yet</h2>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <div
                    className="post-author"
                    onClick={() => navigate(`/profile/${post.author._id}`)}
                  >
                    <div className="post-avatar">
                      {post.author.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="post-author-info">
                      <h3>{post.author.username}</h3>
                      <p>{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {user.id === post.author._id && (
                    <button
                      className="post-delete-btn"
                      onClick={() => handleDeletePost(post._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="post-content">{post.content}</div>

                <div className="post-footer">
                  <div
                    className={`post-action ${
                      post.reactedBy.includes(user.id) ? 'reacted' : ''
                    }`}
                    onClick={() =>
                      handleReact(post._id, post.reactedBy.includes(user.id))
                    }
                  >
                    <span>❤️</span>
                    <span>{post.reactions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
