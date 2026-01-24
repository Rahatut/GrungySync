import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  searchUsers: (query) => api.get('/auth/search', { params: { query } }),
  getUserById: (userId) => api.get(`/auth/${userId}`),
  followUser: (userId) => api.post(`/auth/${userId}/follow`),
  unfollowUser: (userId) => api.post(`/auth/${userId}/unfollow`),
};

// Posts endpoints
export const postsAPI = {
  getAllPosts: () => api.get('/posts'),
  createPost: (data) => api.post('/posts', data),
  getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
  reactPost: (postId) => api.post(`/posts/${postId}/react`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
};

export default api;
