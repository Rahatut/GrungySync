import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import HeaderBar from '../components/HeaderBar';
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

  return (
    <div className="search-container">
      <HeaderBar user={user} onLogout={onLogout} hideSettingsLogout />

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
              <button type="submit" className="search-button" disabled={loading} aria-label="Search">
              {loading ? 'Searching...' : (
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              )}
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
