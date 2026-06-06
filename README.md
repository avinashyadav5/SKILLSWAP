# SkillSwap

**SkillSwap** is a full-stack web application that enables users to connect, match, and exchange skills in real time. It features user authentication, intelligent skill matching, live chat, real-time notifications, and an admin dashboard for analytics and moderation.

---

## 🔗 Live Demo

- **Frontend:** [skillswap-nine-beta.vercel.app](https://skillswap-nine-beta.vercel.app/)
- **Backend:** [skillswap-1-1iic.onrender.com](https://skillswap-1-1iic.onrender.com)
- **GitHub Repo:** [github.com/avinashyadav5/SKILLSWAP](https://github.com/avinashyadav5/SKILLSWAP)

---

## ✨ Features

- ✅ User Registration & JWT Authentication  
- 🔍 Skill Matching Algorithm – find compatible learners and teachers  
- 💬 Real-time Chat using Socket.IO  
- 🔔 Real-time Notifications Panel  
- 📊 Admin Dashboard with Analytics and Moderation Tools  
- 👤 Profile Management with Avatar Uploads  
- 🎨 Tailwind CSS Styling with Responsive UI  
- 🗄️ PostgreSQL Database hosted on Neon  

---

## 🛠 Tech Stack

### Frontend

- React (Vite)  
- Tailwind CSS  
- Socket.IO Client  
- React Router DOM  

### Backend

- Node.js & Express  
- Sequelize ORM  
- PostgreSQL (Neon Database)  
- Socket.IO (Real-time communication)  
- JWT Authentication  
- Multer (File uploads)  

### Hosting

- Frontend: Vercel  
- Backend: Render  
- Database: Neon PostgreSQL  

---

## 📁 Folder Structure

<details>
<summary>Click to view</summary>

```bash
SKILLSWAP/
├── backend/                # Express + Sequelize + Socket.IO API
│   ├── config/             # DB connection & Sequelize setup
│   ├── models/             # Sequelize models (User, Match, Chat, etc.)
│   ├── middleware
│   ├── routes/             # Express route definitions
│   ├── controllers/        # Business logic for routes
│   ├── uploads/            # User uploaded files (avatars)
│   ├── server.js           # Entry point for backend server
│   └── package.json
│
├── frontend/               # Vite + React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Pages (Login, Register, Chat, Dashboard)
│   │   ├── utils/        # Auth & socket contexts
│   │   ├── assets/         # Images and icons
│   │   └── App.jsx
│   ├── public/             # Favicon & index.html
│   └── package.json
│
└── README.md
```
</details>
## ⚙️ Environment Setup

### 🔧 Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `/backend` with the following:

```env
PORT=5000
DATABASE_URL=postgres://<your_neon_db_connection_string>
JWT_SECRET=your_secret_key
CORS_ORIGIN=https://your-frontend-domain.com
```

Start the backend:

```bash
npm start
```

---

### 🌐 Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file inside `/frontend` with:

```env
VITE_API_URL=<your_backend_api_url>
```

Start the frontend:

```bash
npm run dev
```

---

## 🚀 Deployment Instructions

### 🟣 Backend – Render

1. Push backend code to GitHub  
2. Go to [render.com](https://render.com)  
3. Create a new **Web Service** and connect your backend repo  
4. Add required environment variables from `.env`  
5. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

---

### 🟢 Frontend – Vercel

1. Go to [vercel.com](https://vercel.com)  
2. Import the frontend folder from GitHub  
3. Add environment variable:

   ```env
   VITE_API_URL=<your_backend_api_url>
   ```

4. Click **Deploy**

---

## 👮‍♂️ Admin Access

To log in as an **admin**, use credentials manually created in the database or seeded via a script.

### Admin Privileges

- Manage users  
- View analytics  
- Moderate platform activity  

---

## 🤝 Contributing

We welcome contributions! Follow the steps below:

1. Fork the repository  
2. Create a new branch:

   ```bash
   git checkout -b feature-name
   ```

3. Commit your changes:

   ```bash
   git commit -m "Added new feature"
   ```

4. Push to your branch:

   ```bash
   git push origin feature-name
   ```

5. Submit a **Pull Request** 🎉

---

## 📄 License

This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute this project.

---

## 🙌 Credits

**Developed by:** [Avinash Yadav](https://github.com/avinashyadav5)  
_Made with ❤️ using React, Node.js, and PostgreSQL_

---

