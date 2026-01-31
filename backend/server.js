require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/database');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const hobbySpaceRoutes = require('./routes/hobbySpaceRoutes');
const actionRoutes = require('./routes/actionRoutes');
const progressRoutes = require('./routes/progressRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/hobby-spaces', hobbySpaceRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/progress', progressRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
