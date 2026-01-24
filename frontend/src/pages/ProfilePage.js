import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI, postsAPI } from '../services/api';
import '../styles/ProfilePage.css';

function ProfilePage({ user, onLogout }) {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getUserById(userId);
      setProfileUser(response.data);
      // Check if current user is following this user
      const currentUserRes = await authAPI.getProfile();
      setIsFollowing(currentUserRes.data.following.includes(userId));
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getUserPosts(userId);
      setUserPosts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleReact = async (postId) => {
    try {
      await postsAPI.reactPost(postId);
      fetchUserPosts();
    } catch (err) {
      setError('Failed to react to post');
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(postId);
        fetchUserPosts();
      } catch (err) {
        setError('Failed to delete post');
        console.error(err);
      }
    }
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
      <div className="profile-header">
        <h1>Grungy</h1>
        <div className="header-buttons">
          <button className="back-button" onClick={() => navigate('/')}>
            Back to Home
          </button>
          <button className="back-button" onClick={() => navigate('/search')}>
            Search
          </button>
        </div>
      </div>

      <div className="profile-content">
        {profileUser && (
          <div className="profile-card">
            <div className="profile-avatar-large">
              {profileUser.username.charAt(0).toUpperCase()}
            </div>
            <h2>{profileUser.username}</h2>
            <p className="email">{profileUser.email}</p>
            {profileUser.bio && <p className="bio">{profileUser.bio}</p>}

            <div className="profile-stats">
              <div className="stat">
                <div className="stat-number">{userPosts.length}</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat">
                <div className="stat-number">{profileUser.followers?.length || 0}</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="stat">
                <div className="stat-number">{profileUser.following?.length || 0}</div>
                <div className="stat-label">Following</div>
              </div>
            </div>

            {userId === user.id && (
              <div className="profile-actions">
                <button
                  className="action-button"
                  onClick={() => navigate('/')}
                >
                  Edit Profile
                </button>
                <button
                  className="action-button secondary"
                  onClick={() => {
                    onLogout();
                    navigate('/auth');
                  }}
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

        {error && <div className="error-message">{error}</div>}

        <div className="profile-posts">
          <h3>Posts by {profileUser?.username}</h3>
          {userPosts.length === 0 ? (
            <div className="empty-state">
              <h2>No posts yet</h2>
              <p>This user hasn't shared anything yet</p>
            </div>
          ) : (
            <div className="posts-list">
              {userPosts.map((post) => (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <div className="post-author-info">
                      <h3>{post.author.username}</h3>
                      <p>{new Date(post.createdAt).toLocaleDateString()}</p>
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
                      onClick={() => handleReact(post._id)}
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
    </div>
  );
}

export default ProfilePage;
