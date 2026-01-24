# Quick Start Guide - Grungy

## One-time Setup

### 1. Backend Setup
```bash
cd backend
npm install
copy .env.example .env
# Edit .env and add your MongoDB URI
npm run dev
```

### 2. Frontend Setup (in a new terminal)
```bash
cd frontend
npm install
npm start
```

## That's it!

- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:3000`

## Default Workflow

1. Open `http://localhost:3000` in your browser
2. Sign up for a new account
3. Create posts on the home page
4. React (like) other posts
5. Visit your profile to see all your posts

## MongoDB Setup

### Local MongoDB
If using MongoDB locally:
```bash
# Make sure MongoDB is running
mongod
# Default URI in .env: mongodb://localhost:27017/grungy
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in `.env`

## Environment Variables

**Backend (.env)**
```
MONGODB_URI=mongodb://localhost:27017/grungy
JWT_SECRET=your_secret_key_change_this
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## API Testing

Use Postman or curl to test endpoints:

```bash
# Sign Up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Create Post (requires token)
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "This is my first post!"
  }'
```

## Troubleshooting

**Port already in use?**
- Change PORT in backend `.env`
- Change port in frontend (update proxy in package.json if needed)

**MongoDB connection error?**
- Check MongoDB is running
- Verify MONGODB_URI is correct
- Check network connectivity

**CORS errors?**
- Make sure FRONTEND_URL matches your frontend URL
- Backend CORS is configured for the frontend URL

**Token issues?**
- Clear browser localStorage
- Sign out and sign in again
- Check JWT_SECRET in `.env`

## Project Architecture

```
Backend (Node.js + Express)
├── Routes: /api/auth, /api/posts
├── Controllers: Handle business logic
├── Models: User, Post (MongoDB)
├── Middleware: Authentication, validation
└── Config: Database, Passport setup

Frontend (React)
├── Pages: Login, Home, Profile
├── Services: API calls
├── Styles: CSS with cursive fonts
└── Components: Reusable UI pieces
```

## What's Included

✅ User Authentication (JWT + PassportJS)
✅ Post Creation & Management
✅ Post Reactions (Likes)
✅ User Profiles
✅ Classic Aesthetic Design
✅ Cursive Typography
✅ Responsive UI
✅ Input Validation
✅ Error Handling

## Next Steps

Ready to add features? Start with:
1. Comments on posts
2. Follow/Unfollow users
3. User search
4. Notifications
5. Direct messaging
6. Image uploads

Happy coding! 🎨
