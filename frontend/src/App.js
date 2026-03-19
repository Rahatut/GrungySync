import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

import ProfileEditPage from './pages/ProfileEditPage';
import PostCreatePage from './pages/PostCreatePage';
import ActionCreatePage from './pages/ActionCreatePage';
import PointsAnalyticsPage from './pages/PointsAnalyticsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AchievementsPage from './pages/AchievementsPage';
import PointSystemPage from './pages/PointSystemPage';


import FollowersListPage from './pages/FollowersListPage';
import FollowingListPage from './pages/FollowingListPage';
import AppLayout from './components/AppLayout';
import HobbySpaceListPage from './pages/HobbySpaceListPage';
import CreateHobbySpace from './pages/CreateHobbySpace';
import HobbySpaceDetailPage from './pages/HobbySpaceDetailPage';
import EditHobbySpace from './pages/EditHobbySpace';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token) {
          // Verify token is still valid by fetching current profile
          try {
            const response = await fetch('http://localhost:5000/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const profileData = await response.json();
              // Normalize user data: convert _id to id for consistency
              const normalizedUser = {
                ...profileData,
                id: profileData._id || profileData.id
              };
              setUser(normalizedUser);
              localStorage.setItem('user', JSON.stringify(normalizedUser));
              setIsAuthenticated(true);
            } else {
              // Token is invalid, clear auth data
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            console.error('Error validating token:', error);
            // On error, keep user logged in if we have cached data (for offline support)
            if (userData) {
              const parsedUser = JSON.parse(userData);
              // Ensure id field exists (normalize _id to id if needed)
              const normalizedUser = {
                ...parsedUser,
                id: parsedUser.id || parsedUser._id
              };
              setUser(normalizedUser);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    restoreAuthState();
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handlePostCreated = (post) => {
    console.log('New post created:', post);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Helper: wrap authenticated page in two-column AppLayout
  const protect = (element) =>
    isAuthenticated ? (
      <AppLayout user={user} onLogout={handleLogout}>
        {element}
      </AppLayout>
    ) : (
      <Navigate to="/auth" />
    );

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        <Route path="/" element={protect(<HomePage user={user} onLogout={handleLogout} />)} />
        <Route path="/search" element={protect(<SearchPage user={user} onLogout={handleLogout} />)} />
        <Route path="/profile/edit" element={protect(<ProfileEditPage user={user} onUpdateProfile={handleUpdateProfile} />)} />
        <Route path="/profile/:userId" element={protect(<ProfilePage user={user} onLogout={handleLogout} />)} />
        <Route path="/profile/:userId/followers" element={protect(<FollowersListPage />)} />
        <Route path="/profile/:userId/following" element={protect(<FollowingListPage />)} />
        <Route path="/post/create" element={protect(<PostCreatePage user={user} onPostCreated={handlePostCreated} />)} />
        <Route path="/hobby-spaces" element={protect(<HobbySpaceListPage user={user} onLogout={handleLogout} />)} />
        <Route path="/hobby-space/create" element={protect(<CreateHobbySpace user={user} />)} />
        <Route path="/hobby-space/:spaceId" element={protect(<HobbySpaceDetailPage user={user} onLogout={handleLogout} />)} />
        <Route path="/hobby-space/:spaceId/edit" element={protect(<EditHobbySpace user={user} />)} />
        <Route path="/action/create" element={protect(<ActionCreatePage user={user} />)} />
        <Route path="/points-analytics" element={protect(<PointsAnalyticsPage user={user} onLogout={handleLogout} />)} />
        <Route path="/leaderboard" element={protect(<LeaderboardPage user={user} />)} />
        <Route path="/achievements" element={protect(<AchievementsPage />)} />
        <Route path="/point-system" element={protect(<PointSystemPage />)} />
      </Routes>
    </Router>
  );
}

export default App;
