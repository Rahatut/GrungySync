import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/ProfileEditPage.css';

function ProfileEditPage({ user, onUpdateProfile }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    location: '',
    website: '',
    pronouns: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        displayName: user.displayName || '',
        location: user.location || '',
        website: user.website || '',
        pronouns: user.pronouns || '',
      });
      setAvatarPreview(user.avatar);
      setBannerPreview(user.banner);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      form.append('username', formData.username);
      form.append('displayName', formData.displayName);
      form.append('location', formData.location);
      form.append('website', formData.website);
      form.append('pronouns', formData.pronouns);

      if (avatar) {
        form.append('avatar', avatar);
      }
      if (banner) {
        form.append('banner', banner);
      }

      const response = await authAPI.updateProfile(form);
      const updatedUser = response.data.user;
      setSuccess('Profile updated successfully!');
      if (onUpdateProfile) {
        onUpdateProfile(updatedUser);
      }
      setTimeout(() => {
        const userId = updatedUser._id || updatedUser.id || user._id || user.id;
        navigate(`/profile/${userId}`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-header">
        <h1>Edit Profile</h1>
        <div className="header-actions">
          <button
            className="pill-btn"
            type="button"
            onClick={() => navigate(`/profile/${user.id}`)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="pill-btn primary"
            type="submit"
            form="profile-edit-form"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Save' }
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form id="profile-edit-form" onSubmit={handleSubmit} className="profile-edit-form">
        <div className="form-section">
          <h2>Profile Pictures</h2>

          <div className="image-upload-group">
            <div className="image-upload-field">
              <label>Banner Image</label>
              <div className="image-preview-container">
                {bannerPreview && (
                  <img src={bannerPreview} alt="Banner preview" className="banner-preview" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                disabled={loading}
              />
              <small>Recommended size: 1500x500px</small>
            </div>

            <div className="image-upload-field">
              <label>Avatar Image</label>
              <div className="image-preview-container">
                {avatarPreview && (
                  <img src={avatarPreview} alt="Avatar preview" className="avatar-preview" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={loading}
              />
              <small>Recommended size: 400x400px</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Your username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              rows="4"
              disabled={loading}
              maxLength="500"
            />
            <small>{formData.bio?.length || 0}/500</small>
          </div>

          <div className="form-group">
            <label htmlFor="pronouns">Pronouns</label>
            <input
              type="text"
              id="pronouns"
              name="pronouns"
              value={formData.pronouns}
              onChange={handleInputChange}
              placeholder="e.g., they/them"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Where are you from?"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://yourwebsite.com"
              disabled={loading}
            />
          </div>
        </div>

      </form>
    </div>
  );
}

export default ProfileEditPage;
