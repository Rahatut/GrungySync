import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import '../styles/HobbySpaceListPage.css';
import api from '../services/api';

export default function HobbySpaceListPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [hobbySpaces, setHobbySpaces] = useState([]);
  const [mySpaces, setMySpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | joined | explore
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHobbySpaces();
    fetchMySpaces();
  }, []);

  const fetchHobbySpaces = async () => {
    try {
      const response = await api.get('/hobby-spaces');
      setHobbySpaces(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hobby spaces:', error);
      setLoading(false);
    }
  };

  const fetchMySpaces = async () => {
    try {
      const response = await api.get('/hobby-spaces/user/my-spaces');
      setMySpaces(response.data);
    } catch (error) {
      console.error('Error fetching my spaces:', error);
    }
  };

  const handleJoinSpace = async (spaceId) => {
    try {
      await api.post(`/hobby-spaces/${spaceId}/join`);
      fetchMySpaces();
      fetchHobbySpaces();
    } catch (error) {
      console.error('Error joining space:', error);
    }
  };

  const handleLeaveSpace = async (spaceId) => {
    try {
      await api.post(`/hobby-spaces/${spaceId}/leave`);
      fetchMySpaces();
      fetchHobbySpaces();
    } catch (error) {
      console.error('Error leaving space:', error);
    }
  };

  const handleCreateSpace = () => {
    navigate('/hobby-space/create');
  };

  const handleSpaceClick = (spaceId) => {
    navigate(`/hobby-space/${spaceId}`);
  };

  // Filter spaces
  const mySpaceIds = new Set(mySpaces.map((s) => s._id));
  let filteredSpaces = hobbySpaces.filter((space) =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filter === 'joined') {
    filteredSpaces = filteredSpaces.filter((space) => mySpaceIds.has(space._id));
  } else if (filter === 'explore') {
    filteredSpaces = filteredSpaces.filter((space) => !mySpaceIds.has(space._id));
  }

  if (loading) {
    return <div className="loading">Loading hobby spaces...</div>;
  }

  return (
    <div className="hobby-space-list-container">
      <HeaderBar user={user} onLogout={onLogout} />
      <div className="hobby-space-header">
        <div className="header-content">
          <h1 className="gradient-text">Hobby Spaces</h1>
          <p>Join communities, track progress, and grow together</p>
        </div>
        <button className="create-space-btn" onClick={handleCreateSpace}>
          + Create Space
        </button>
      </div>

      <div className="hobby-space-controls">
        <input
          type="text"
          placeholder="Search hobby spaces..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Spaces ({hobbySpaces.length})
          </button>
          <button
            className={`filter-tab ${filter === 'joined' ? 'active' : ''}`}
            onClick={() => setFilter('joined')}
          >
            My Spaces ({mySpaces.length})
          </button>
          <button
            className={`filter-tab ${filter === 'explore' ? 'active' : ''}`}
            onClick={() => setFilter('explore')}
          >
            Explore ({hobbySpaces.length - mySpaces.length})
          </button>
        </div>
      </div>

      {filteredSpaces.length === 0 ? (
        <div className="empty-state">
          <h3>No hobby spaces found</h3>
          <p>
            {filter === 'joined'
              ? 'You haven\'t joined any spaces yet. Explore and join one!'
              : 'Create the first one or check back later.'}
          </p>
        </div>
      ) : (
        <div className="hobby-spaces-grid">
          {filteredSpaces.map((space) => (
            <div key={space._id} className="hobby-space-card glass">
              <div className="card-header" onClick={() => handleSpaceClick(space._id)}>
                <h3>{space.name}</h3>
                {space.slug && <span className="slug">#{space.slug}</span>}
              </div>

              <p className="description">{space.description || 'No description'}</p>

              <div className="space-stats">
                <div className="stat">
                  <span className="stat-label">Members</span>
                  <span className="stat-value">{space.members?.length || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Actions</span>
                  <span className="stat-value">{space.totalActions || 0}</span>
                </div>
              </div>

              <div className="action-config">
                <div className="config-item">
                  <span className="config-label">Min Effort</span>
                  <span className="config-value">{space.actionConfig?.minEffortThreshold || 0}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Daily Cap</span>
                  <span className="config-value">{space.actionConfig?.dailyPointCap || 50} pts</span>
                </div>
              </div>

              <div className="card-footer">
                {mySpaceIds.has(space._id) ? (
                  <>
                    <button className="view-btn" onClick={() => handleSpaceClick(space._id)}>
                      View Space
                    </button>
                    <button className="leave-btn" onClick={() => handleLeaveSpace(space._id)}>
                      Leave
                    </button>
                  </>
                ) : (
                  <button className="join-btn" onClick={() => handleJoinSpace(space._id)}>
                    + Join Space
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
