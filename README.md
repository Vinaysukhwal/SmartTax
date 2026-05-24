# SmartTax — Free Indian Income Tax Filing Platform

SmartTax is a full-stack web application for Indian income tax filing, built as a learning project. It features guided ITR filing wizards, tax calculators, deduction tracking, document management, and an AI-powered tax chatbot.

> ⚠️ **Disclaimer**: This is an educational project. It does not provide professional tax advice. Always consult a Chartered Accountant for actual tax filing.

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS v3   |
| Backend   | Node.js + Express.js                |
| Database  | MongoDB + Mongoose                  |
| Auth      | JWT (JSON Web Tokens)               |
| AI Chatbot| Google Gemini API (free tier)        |
| PDF       | jsPDF (client-side PDF generation)  |

---

## 📁 Project Structure

```
/smarttax
  /client                  → React frontend (Vite)
    /src
      /components           → Navbar, Footer, ChatBot, ProtectedRoute
      /context              → AuthContext (global auth state)
      /config               → API configuration (Axios)
      /pages                → All page components
      /utils                → Tax calculation utilities
  /server                  → Express backend
    /config                → Database connection
    /middleware             → JWT auth middleware
    /models                → Mongoose schemas (User, ItrFiling, etc.)
    /routes                → API route handlers
  README.md               → This file
```

---

## 🛠️ How to Run Locally

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB** — [Free MongoDB Atlas cluster](https://www.mongodb.com/atlas) OR local MongoDB
- **Gemini API Key** — [Get free key](https://aistudio.google.com/apikey)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd smarttax
```

### 2. Set up the backend
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Gemini API key
npm install
npm run dev
```

The server will start on `http://localhost:5000`.

### 3. Set up the frontend
```bash
cd client
npm install
npm run dev
```

The client will start on `http://localhost:5173`.

### 4. Open in browser
Navigate to `http://localhost:5173` to use SmartTax.

---

## 🔑 Environment Variables

Create a `.env` file in the `/server` directory:

```env
# MongoDB connection string (use Atlas free tier)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smarttax

# Secret key for JWT tokens (any random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Server port
PORT=5000
```

### How to get a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

---

## 📡 API Documentation

### Auth
| Method | Endpoint            | Description          | Auth |
|--------|--------------------|-----------------------|------|
| POST   | `/api/auth/register` | Register new user   | ❌   |
| POST   | `/api/auth/login`    | Login, get JWT       | ❌   |

### User Profile
| Method | Endpoint           | Description         | Auth |
|--------|-------------------|----------------------|------|
| GET    | `/api/user/profile` | Get profile data    | ✅   |
| PUT    | `/api/user/profile` | Update profile      | ✅   |

### ITR Filing
| Method | Endpoint             | Description              | Auth |
|--------|---------------------|--------------------------|------|
| POST   | `/api/itr/save`      | Save/update ITR filing   | ✅   |
| GET    | `/api/itr/get/:userId` | Get latest filing      | ✅   |

### Documents
| Method | Endpoint               | Description           | Auth |
|--------|------------------------|-----------------------|------|
| POST   | `/api/documents/upload` | Upload document (base64)| ✅ |
| GET    | `/api/documents/list`   | List documents         | ✅   |
| GET    | `/api/documents/:id`    | Get document (download)| ✅   |
| DELETE | `/api/documents/:id`    | Delete document        | ✅   |

### Deductions
| Method | Endpoint              | Description        | Auth |
|--------|-----------------------|--------------------|------|
| GET    | `/api/deductions`      | List deductions    | ✅   |
| POST   | `/api/deductions`      | Add deduction      | ✅   |
| PUT    | `/api/deductions/:id`  | Update deduction   | ✅   |
| DELETE | `/api/deductions/:id`  | Delete deduction   | ✅   |

### Notices
| Method | Endpoint           | Description       | Auth |
|--------|-------------------|--------------------|------|
| GET    | `/api/notices`     | List notices       | ✅   |
| POST   | `/api/notices`     | Add notice         | ✅   |
| PUT    | `/api/notices/:id` | Update status      | ✅   |
| DELETE | `/api/notices/:id` | Delete notice      | ✅   |

### Challan
| Method | Endpoint              | Description         | Auth |
|--------|-----------------------|---------------------|------|
| POST   | `/api/challan/generate`| Generate challan    | ✅   |
| GET    | `/api/challan`         | List challans       | ✅   |

### AI Chatbot
| Method | Endpoint     | Description                   | Auth |
|--------|-------------|-------------------------------|------|
| POST   | `/api/chat`  | Send message to AI chatbot    | ❌   |

---

## ✨ Features

1. **Authentication** — Register/login with email, password, PAN
2. **ITR Recommender** — 5-question quiz to find the right ITR form
3. **ITR Filing Wizard** — 4-step guided filing for ITR-1 to ITR-4
4. **Tax Calculators** — Income tax (old vs new), HRA, capital gains
5. **Deductions Tracker** — Track 80C, 80D, 80CCD, 80E, 80G with progress bars
6. **Document Vault** — Upload and store Form 16, 26AS (PDF/images)
7. **Dashboard** — Filing status, deadlines, deduction summary
8. **AI Chatbot** — Gemini-powered tax assistant
9. **Notice Tracker** — Track IT department notices
10. **Challan Generator** — Generate Challan 280 with PDF download

---

## 🎨 Design

- Primary Color: `#1a56db` (Blue)
- Font: [Inter](https://fonts.google.com/specimen/Inter)
- Responsive: Mobile-first design
- Animations: Smooth fade-in and slide-up transitions

---

## 📦 Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Set root directory to `client`
4. Build command: `npm run build`
5. Output directory: `dist`

### Backend (Render)
1. Connect the repo to [Render](https://render.com)
2. Set root directory to `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add environment variables in Render dashboard

---

## 📝 License

This project is open source and free to use for learning purposes.

Built with ❤️ for learning web development.
