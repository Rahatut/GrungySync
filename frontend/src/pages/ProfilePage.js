import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI, actionsAPI } from '../services/api';
import HeaderBar from '../components/HeaderBar';
import '../styles/ProfilePage.css';
import '../styles/SettingsMenu.css';

function ProfilePage({ user, onLogout }) {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [userActions, setUserActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      onLogout();
      navigate('/login');
    }
  };

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  const handleProfileUpdated = () => {
    fetchUserProfile();
  };

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
      setIsFollowing(currentUserRes.data.following.includes(userId));
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

  if (loading && !profileUser) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <HeaderBar user={user} onLogout={onLogout} />

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
              {userActions.map((action) => (
                <div key={action._id} className="action-card">
                  <div className="action-header-profile">
                    <span className="action-type">{action.actionType}</span>
                    <span className="hobby-space">{action.hobbySpace?.name}</span>
                    <span className="effort-score">Effort: {action.effortScore}</span>
                    <span className="points">{action.pointsAwarded} pts</span>
                  </div>
                  <p className="action-content">{action.content}</p>
                  <p className="action-date">{new Date(action.createdAt).toLocaleDateString()}</p>
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
