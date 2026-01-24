import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/SearchPage.css';

function SearchPage({ user, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authAPI.searchUsers(searchQuery);
      setSearchResults(response.data);
      setHasSearched(true);
    } catch (err) {
      setError('Failed to search users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/auth');
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Grungy</h1>
        <div className="nav-buttons">
          <button className="nav-button" onClick={() => navigate('/')}>
            Home
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

      <div className="search-content">
        <div className="search-form-container">
          <h2>Find Users</h2>
          <form onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-button" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>

        {hasSearched && (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div className="empty-state">
                <h2>No users found</h2>
                <p>Try searching for a different username</p>
              </div>
            ) : (
              <div className="users-list">
                {searchResults.map((u) => (
                  <div key={u._id} className="user-card">
                    <div className="user-header">
                      <div className="user-avatar">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <h3>{u.username}</h3>
                        {u.bio && <p className="user-bio">{u.bio}</p>}
                      </div>
                    </div>

                    <div className="user-stats">
                      <div className="stat">
                        <span className="stat-number">
                          {u.followers?.length || 0}
                        </span>
                        <span className="stat-label">Followers</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">
                          {u.following?.length || 0}
                        </span>
                        <span className="stat-label">Following</span>
                      </div>
                    </div>

                    <button
                      className="view-profile-btn"
                      onClick={() => navigate(`/profile/${u._id}`)}
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
