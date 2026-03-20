import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { communityAPI } from '../services/api';
import '../styles/LeaderboardPage.css';

function LeaderboardPage({ user }) {
    // Community stats
    const [totalCommunityPoints, setTotalCommunityPoints] = useState(null);
    const [trendingSpaces, setTrendingSpaces] = useState([]);

    // Fetch total community points
    useEffect(() => {
      communityAPI.getTotalCommunityPoints()
        .then(res => setTotalCommunityPoints(res.data.totalPoints))
        .catch(() => setTotalCommunityPoints(null));
    }, []);

    // Fetch trending spaces (sort by memberCount desc)
    useEffect(() => {
      communityAPI.getTrendingSpaces()
        .then(res => {
          const sorted = (res.data || []).slice().sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
          setTrendingSpaces(sorted.slice(0, 4));
        })
        .catch(() => setTrendingSpaces([]));
    }, []);
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [scope, setScope] = useState('global'); // 'global', 'following', 'hobbyspace'
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly', 'monthly', 'allTime'
  
  const [mySpaces, setMySpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');

  // Initial load of user spaces
  useEffect(() => {
    async function fetchMySpaces() {
      try {
        const response = await api.get('/hobby-spaces/user/my-spaces');
        setMySpaces(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedSpaceId(response.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch spaces', err);
      }
    }
    fetchMySpaces();
  }, []);

  // Fetch leaderboard data when filters change
  useEffect(() => {
    let debounceTimeout;
    function fetchLeaderboard() {
      setLoading(true);
      setError('');
      let endpoint = `/progress/leaderboard?scope=${scope}&timeframe=${timeframe}`;
      if (scope === 'hobbyspace' && selectedSpaceId) {
        endpoint += `&hobbySpaceId=${selectedSpaceId}`;
      }
      api.get(endpoint)
        .then(response => {
          setLeaderboard(response.data.leaderboard || []);
        })
        .catch(err => {
          let msg = 'Failed to load leaderboard data.';
          if (err.response && err.response.data && err.response.data.message) {
            msg += ' ' + err.response.data.message;
          }
          setError(msg);
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // Only fetch if safe: if scope is hobbyspace, we need a selectedSpaceId
    if (scope === 'hobbyspace' && !selectedSpaceId) {
      if (mySpaces.length === 0 && !loading) {
        setLoading(false); // Can't fetch hobbyspace leaderboard without spaces
      }
      return;
    }

    debounceTimeout = setTimeout(fetchLeaderboard, 400);
    return () => clearTimeout(debounceTimeout);
  }, [scope, timeframe, selectedSpaceId, mySpaces.length]);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
      </div>

      {/* Community Stats Row */}
      <div className="community-stats-row">
        <div className="community-card total-points">
          <div className="card-label">Total Community Points</div>
          <div className="card-value">{totalCommunityPoints !== null ? totalCommunityPoints.toLocaleString() : '—'}</div>
        </div>
        {/* Daily Champion: top leaderboard entry */}
        {leaderboard.length > 0 && (
          <div className="community-card daily-champion">
            <div className="card-label">Daily Champion</div>
            <div className="champion-info">
              <div className="champion-avatar">
                {leaderboard[0].user?.avatar ? (
                  <img src={leaderboard[0].user.avatar} alt="champion" />
                ) : (
                  leaderboard[0].user?.username ? leaderboard[0].user.username.charAt(0).toUpperCase() : '?' 
                )}
              </div>
              <div>
                <div className="champion-name">@{leaderboard[0].user?.username || 'Anonymous'}</div>
                <div className="champion-role">{leaderboard[0].user?.displayName || ''}</div>
                <div className="champion-points">{leaderboard[0].points || 0} pts</div>
              </div>
            </div>
          </div>
        )}
        {/* Trending Spaces */}
        <div className="community-card trending-spaces">
          <div className="card-label">Trending Spaces</div>
          <div className="trending-list">
            {trendingSpaces.map((space, idx) => (
              <div className="trending-space" key={space._id || idx}>
                <span className="trending-rank">#{idx + 1}</span>
                <span className="trending-name">{space.name}</span>
                <span className="trending-members">{space.memberCount} members</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="leaderboard-controls">
        <div className="filter-group">
          <span className="filter-label">Scope:</span>
          <button 
            className={`control-btn ${scope === 'global' ? 'active' : ''}`}
            onClick={() => setScope('global')}
          >
            Global
          </button>
          <button 
            className={`control-btn ${scope === 'following' ? 'active' : ''}`}
            onClick={() => setScope('following')}
          >
            Following
          </button>
          <button 
            className={`control-btn ${scope === 'hobbyspace' ? 'active' : ''}`}
            onClick={() => setScope('hobbyspace')}
            disabled={mySpaces.length === 0}
            title={mySpaces.length === 0 ? "Join a hobby space first" : ""}
          >
            Hobby Space
          </button>
          
          {scope === 'hobbyspace' && mySpaces.length > 0 && (
            <select 
              className="space-selector"
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
            >
              {mySpaces.map(space => (
                <option key={space._id} value={space._id}>{space.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="filter-group">
          <span className="filter-label">Timeframe:</span>
          <button 
            className={`control-btn ${timeframe === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeframe('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`control-btn ${timeframe === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeframe('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`control-btn ${timeframe === 'allTime' ? 'active' : ''}`}
            onClick={() => setTimeframe('allTime')}
          >
            All Time
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-leaderboard">Loading rankings...</div>
      ) : error ? (
        <div className="empty-leaderboard">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-leaderboard">
          No activity found for this filter. Start posting to claim the #1 spot!
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry, idx) => {
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const player = entry.user || {};
            const isCurrentUser = player._id === user?.id;

            return (
              <div 
                key={player._id || idx} 
                className={`leaderboard-card ${rankClass}`}
                onClick={() => navigate(`/profile/${player._id}`)}
                style={{ border: isCurrentUser ? '1px solid #00eaff' : undefined }}
              >
                <div className="rank-number">
                  #{rank}
                </div>
                <div className="player-info">
                  <div className="player-avatar">
                    {player.avatar && !player.avatar.includes('via.placeholder.com') ? (
                      <img src={player.avatar} alt="avatar" />
                    ) : (
                      player.username ? player.username.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <p className="player-name">
                    {player.username || 'Anonymous'}
                    {isCurrentUser && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#00eaff' }}>(You)</span>}
                  </p>
                </div>
                <div className="player-stats">
                  <div className="stat-box">
                    <span className="stat-val">{entry.points || 0}</span>
                    <span className="stat-lbl">Points</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">{entry.actions || 0}</span>
                    <span className="stat-lbl">Actions</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
