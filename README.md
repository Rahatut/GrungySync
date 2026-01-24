# Grungy - MERN Social Media Web App

A classic-aesthetic social media platform built with MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

```
grungy/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Post.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── postRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── postController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── package.json
│   ├── server.js
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── HomePage.js
    │   │   └── ProfilePage.js
    │   ├── styles/
    │   │   ├── LoginPage.css
    │   │   ├── HomePage.css
    │   │   └── ProfilePage.css
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── public/
    │   └── index.html
    └── package.json
```

## Features

### Backend
- **Authentication**: JWT-based auth with PassportJS
- **User Management**: Create accounts, profiles, bios
- **Posts**: Create, read, delete posts
- **Reactions**: Like/react to posts (heart emoji)
- **MongoDB Integration**: Persistent data storage

### Frontend
- **Classic Aesthetic**: Retro design with cursive fonts (Playfair Display)
- **Authentication UI**: Sign In/Sign Up with minimal design
- **Home Feed**: Post creation and display
- **User Profile**: View user stats and their posts
- **Responsive Design**: Works on mobile and desktop

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas cloud)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URI and JWT secret:
```
MONGODB_URI=mongodb://localhost:27017/grungy
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

5. Start the backend server:
```bash
npm start        # Production
npm run dev      # Development with nodemon
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Auth Routes (`/api/auth`)
- `POST /signup` - Create new user account
- `POST /login` - Login user
- `GET /profile` - Get current user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)

### Post Routes (`/api/posts`)
- `GET /` - Get all posts
- `POST /` - Create new post (requires auth)
- `GET /user/:userId` - Get user's posts
- `POST /:postId/react` - Like/react to post (requires auth)
- `DELETE /:postId` - Delete post (requires auth)

## Technologies Used

### Backend
- Express.js - Web framework
- MongoDB & Mongoose - Database
- PassportJS - Authentication
- JWT - Token-based auth
- bcryptjs - Password hashing
- CORS - Cross-origin requests
- express-validator - Input validation

### Frontend
- React 18 - UI framework
- React Router - Navigation
- Axios - HTTP client
- CSS3 - Styling
- Google Fonts (Playfair Display, Poppins) - Typography

## Design Features

- **Classic Aesthetic**: Dark background (#0f0f0f) with gold accents (#d4a574)
- **Cursive Typography**: Playfair Display for headings, Poppins for body text
- **Card-based Layout**: Clean, organized card components
- **Smooth Transitions**: Hover effects and animations
- **Responsive Design**: Mobile-friendly interface

## User Authentication Flow

1. User signs up/in on LoginPage
2. Backend validates credentials and returns JWT token
3. Token stored in localStorage
4. Token sent in Authorization header for protected routes
5. Auth middleware validates token on backend
6. User logged in, can create posts and interact with content

## Next Steps (Future Features)

- Follow/Unfollow users
- Comment on posts
- Direct messaging
- User search
- Post hashtags
- User notifications
- Image uploads
- Edit posts
- User recommendations

## Development Notes

- Backend uses MVC architecture (Models, Controllers, Routes)
- Frontend uses component-based React structure
- All API requests include JWT token automatically via axios interceptor
- Password hashing done with bcryptjs before saving to DB
- Token expiration set to 7 days

---

Built with ❤️ for the grungy aesthetic community
