# 🤝 SkillSwap

[![React](https://img.shields.io/badge/React-18-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind--CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?logo=socketdotio&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SkillSwap** is a full-stack, real-time barter platform designed to solve the double-coincidence problem of knowledge exchange. By matching users based on reciprocal "teach" and "learn" subjects, the application facilitates seamless knowledge trade without monetary transactions.

---

## 🔗 Live Deployment

*   **Frontend Web App:** [skillswap-dev.vercel.app](https://skillswap-dev.vercel.app/)
*   **Backend REST/WS API:** [skillswap-1-1iic.onrender.com](https://skillswap-1-1iic.onrender.com)
*   **GitHub Repository:** [github.com/avinashyadav5/SKILLSWAP](https://github.com/avinashyadav5/SKILLSWAP)

---

## ✨ Core Features

*   **Reciprocal Matching Algorithm:** An database-driven query engine that computes overlaps between users' `teach_normalized` and `learn_normalized` arrays using PostgreSQL GIN indexing.
*   **Real-Time Communications:** Multi-channel Socket.IO implementation managing direct text messages, media attachment notifications, user status indicators, and active typing status.
*   **P2P Video & Audio Calling:** Direct WebRTC calling brokered by the server signaling mediator, supporting mute, camera toggling, and peer disconnects.
*   **Sleek Dark Glassmorphism Design:** Modern UI designed with responsive grid systems, framer-motion micro-interactions, and visual glow backdrops.
*   **AI Study Buddy Integration:** Context-aware study partner powered by Groq's Llama 3 models, strictly restricted to answering questions related to the user's registered learning subjects.
*   **Admin Analytics Hub:** Unified administration board displaying user counts, total match rates, average ratings, and direct toggle promotions for administrator privileges.

---

## 🛠 Technology Stack

### Frontend Client
*   **Core:** React (Vite-powered SPA framework)
*   **Styling:** Tailwind CSS, Framer Motion, react-icons
*   **Networking:** Axios client, Socket.IO client, WebRTC peer connection wrappers
*   **Graphics:** Vanta.js Net (Three.js WebGL canvas animations)

### Backend API & Services
*   **Runtime:** Node.js, ExpressJS application server
*   **Database:** PostgreSQL (Neon serverless instance), Sequelize ORM
*   **Security:** JSON Web Tokens (JWT), Bcrypt password hashing (10 salt rounds)
*   **Media Handling:** Multer file parsing (uploads bounded to local storage paths)
*   **AI & NLP:** Gemini API (subject tag normalization) & Groq Cloud API (Llama 3.3 study buddy inference)

---

## 📁 Repository Directory Structure

```bash
SKILLSWAP/
├── client/                     # React Single-Page Application (Vite)
│   ├── public/                 # Static assets, favicons, redirects config
│   ├── src/
│   │   ├── components/         # Modular UI (VideoCall, StudyBuddy, Matches, etc.)
│   │   ├── pages/              # Views (Dashboard, Chat, Login, Register, Profile)
│   │   ├── utils/              # Socket connections & WebRTC peer helpers
│   │   ├── App.jsx             # React router configuration
│   │   ├── index.css           # Tailwind base styles and custom utilities
│   │   └── main.jsx            # DOM mount point
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # ExpressJS REST & WebSocket API
│   ├── config/                 # Sequelize pool setup
│   ├── controllers/            # Route handler business logic
│   ├── middleware/             # Authorization, uploading & rate limit filters
│   ├── models/                 # Database schema models (User, Message, Rating, etc.)
│   ├── routes/                 # Express router files
│   ├── services/               # LLM integration scripts (Gemini, Groq)
│   ├── uploads/                # Local uploads path (avatars & message attachments)
│   ├── server.js               # Application bootstrap entrypoint
│   └── package.json
│
├── README.md
└── package.json
```

---

## ⚙️ Development Environment Setup

### 1. Prerequisite Installations
*   Ensure Node.js (v18+) is installed on your machine.
*   Prepare a PostgreSQL instance (such as a free [Neon](https://neon.tech) serverless database).

---

### 2. Backend Server Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` folder:
```env
PORT=5000
DATABASE_URL=postgres://<username>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=your_jwt_signing_key_secret
GROQ_API_KEY=your_groq_api_token
GEMINI_API_KEY=your_gemini_api_token
```

Start the development server:
```bash
npm run dev
# Or run direct startup
npm start
```
*The server will boot on `http://localhost:5000` and automatically run database sync operations (`sequelize.sync({ alter: true })`).*

---

### 3. Frontend Client Setup
Navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

Create a `.env` file inside the `client/` folder:
```env
VITE_API_URL=http://localhost:5000
```

Start the Vite development web app:
```bash
npm run dev
```
*Open `http://localhost:5173` in your browser to view the application.*

---

## 🛰 Core API Router Index

| Endpoint | Method | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `/api/user/register` | `POST` | `None` | Sign up a user. AI normalizes input skills. |
| `/api/user/login` | `POST` | `authLimiter` | Login validation. Returns signed 1h JWT. |
| `/api/user/:id` | `PUT` | `jwtAuth` | Update bio, name, and social handles. |
| `/api/user/avatar/:id`| `POST` | `jwtAuth, upload` | Multi-form avatar upload. |
| `/api/match/:userId` | `GET` | `jwtAuth` | Returns matching peer accounts. |
| `/api/messages` | `POST` | `jwtAuth` | Saves Direct Message. Supports attachments. |
| `/api/messages/:u1/:u2`| `GET` | `jwtAuth` | Fetches DM chat history between two users. |
| `/api/study-buddy` | `POST` | `jwtAuth, geminiLimiter` | Topic-validated LLM query response. |
| `/api/rating` | `POST` | `jwtAuth` | Submits star reviews for matched users. |
| `/api/progress` | `POST` | `jwtAuth` | Upserts status indicators for subject paths. |
| `/api/admin/users` | `GET` | `jwtAuth, adminCheck` | Returns full user profile registry. |

---

## 🚀 Cloud Deployment Guide

### Backend Service (Render Deployment)
1.  Connect your repository to [Render.com](https://render.com).
2.  Select **Web Service** and choose the base subdirectory as `server`.
3.  Configure variables matching your `.env` structure.
4.  Configure the build settings:
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
5.  Set `FRONTEND_ORIGINS` to `https://skillswap-dev.vercel.app`.

### Frontend Service (Vercel Deployment)
1.  Import your repository into [Vercel](https://vercel.com).
2.  Choose the root directory of the project, select the `client` directory.
3.  Add the environment variable `VITE_API_URL` pointing to your deployed Render URL.
4.  Deploy the project.

---

## 📄 License & Credits
*   Licensed under the **MIT License**. Feel free to use, modify, and distribute the project.
*   Created by [Avinash Yadav](https://github.com/avinashyadav5).
