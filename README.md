# Personal Budget Tracker

A production-ready personal budget tracker built as a full-stack portfolio application using Node.js, Express, and a dark-themed responsive frontend.

## Features

- Secure registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Dashboard metrics: total balance, income, and expenses
- Transaction creation, listing, and deletion
- SQLite fallback for local development
- PostgreSQL-ready configuration for production deployment
- Single-port deployment with frontend served from Express

## Tech Stack

- Frontend: HTML5, Tailwind CSS via CDN, vanilla JavaScript
- Backend: Node.js + Express.js
- Database: SQLite3 locally, PostgreSQL-ready via `DATABASE_URL`
- Auth: JWT + bcryptjs

## Project Structure

- `backend/` — API routes, middleware, and database logic
- `frontend/` — static HTML/CSS/JS assets
- `.env` — environment variables
- `package.json` — scripts and dependencies

## Local Setup

1. Install dependencies:
   npm install
2. Start the app:
   npm start
3. Open the app in a browser:
   http://localhost:3000

## Environment Variables

Create a `.env` file with:

PORT=3000
JWT_SECRET=your_secure_secret_here
DATABASE_URL=postgres://user:password@host:5432/dbname

The app automatically uses PostgreSQL when `DATABASE_URL` is set; otherwise it falls back to local SQLite.

## Deployment Notes

This app is prepared for Render-style deployment. For production, connect a GitHub repository, create a PostgreSQL database, add the `DATABASE_URL` and `JWT_SECRET` environment variables in the hosting platform, then deploy the app.
