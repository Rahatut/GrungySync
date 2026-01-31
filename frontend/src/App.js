import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import ProfileEditPage from './pages/ProfileEditPage';
import PostCreatePage from './pages/PostCreatePage';
import ActionCreatePage from './pages/ActionCreatePage';
import HobbySpaceListPage from './pages/HobbySpaceListPage';
import HobbySpaceDetailPage from './pages/HobbySpaceDetailPage';
import CreateHobbySpace from './pages/CreateHobbySpace';
import EditHobbySpace from './pages/EditHobbySpace';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
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

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={isAuthenticated ? (
            <HomePage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/search"
          element={isAuthenticated ? (
            <SearchPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/profile/edit"
          element={isAuthenticated ? (
            <ProfileEditPage user={user} onUpdateProfile={handleUpdateProfile} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/profile/:userId"
          element={isAuthenticated ? (
            <ProfilePage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/post/create"
          element={isAuthenticated ? (
            <PostCreatePage user={user} onPostCreated={handlePostCreated} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/hobby-spaces"
          element={isAuthenticated ? (
            <HobbySpaceListPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/hobby-space/create"
          element={isAuthenticated ? (
            <CreateHobbySpace user={user} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/hobby-space/:spaceId"
          element={isAuthenticated ? (
            <HobbySpaceDetailPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/hobby-space/:spaceId/edit"
          element={isAuthenticated ? (
            <EditHobbySpace user={user} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
        <Route
          path="/action/create"
          element={isAuthenticated ? (
            <ActionCreatePage user={user} />
          ) : (
            <Navigate to="/auth" />
          )}
        />
      </Routes>
    </Router>
  );
}

export default App;
