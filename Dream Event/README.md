# Subh Event - Setup Guide

## Project Structure
```
Subh Event/
├── Backend/
│   ├── config/db.js        # MongoDB connection
│   ├── models/User.js      # User model
│   ├── models/Feedback.js  # Feedback model
│   ├── routes/auth.js      # Login & Signup API routes
│   ├── server.js           # Main server
│   ├── .env                # Environment variables
│   └── package.json
└── Frontend/
    ├── index.html          # Homepage
    ├── login.html          # Login page ✅ FIXED
    ├── signup.html         # Signup page ✅ FIXED
    └── css/
        ├── style.css       # Main styles
        └── auth.css        # Auth page styles
```

## Setup Instructions

### Step 1: MongoDB Atlas Setup
1. Go to https://cloud.mongodb.com
2. Click **Network Access** → **Add IP Address** → **Allow Access From Anywhere** (0.0.0.0/0)
3. Wait 2 minutes for changes to apply

### Step 2: Install Backend Dependencies
```bash
cd Backend
npm install
```

### Step 3: Start the Server
```bash
npm start
```
Server runs on: http://localhost:5001

### Step 4: Open the App
- **Homepage:** Open `Frontend/index.html` in browser, OR go to http://localhost:5001
- **Login:** http://localhost:5001/login
- **Signup:** http://localhost:5001/signup

## API Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/feedback | Submit feedback |

## What Was Fixed
- ✅ Created missing `server.js` main file
- ✅ Created Auth API routes (`/api/auth/login`, `/api/auth/signup`)
- ✅ Password hashing with bcryptjs
- ✅ JWT token generation on login/signup
- ✅ Full login page with validation and error handling
- ✅ Full signup page with password strength meter
- ✅ Frontend properly connects to backend API
- ✅ User session stored in localStorage after login
- ✅ Navbar shows logged-in user name with logout button
