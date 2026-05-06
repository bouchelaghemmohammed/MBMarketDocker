# BMMarket

A full-stack marketplace application built with Node.js, Express, MongoDB, and Angular.

## Features
- JWT Authentication
- Real-time updates with Socket.io
- Premium, dynamic UI with glassmorphism
- Full CRUD operations for Products and Orders
- CI/CD with GitHub Actions
- Ready for deployment on Render

## Setup Instructions

### Backend Setup
1. Navigate to the `backend` directory.
2. Run `npm install` to install dependencies.
3. Create a `.env` file (see `.env.example` or below for required variables).
4. Run `node server.js` to start the server on port 5000.

**Backend `.env` variables:**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/bmmarket
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Run `npm install` to install dependencies.
3. Run `npx ng serve` to start the Angular development server.
4. Navigate to `http://localhost:4200` in your browser.


