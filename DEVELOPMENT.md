# 🏥 Healix - Local Development & Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** 18+ (check: `node -v`)
- **Python** 3.9+ (check: `python --version`)
- **MongoDB Atlas** account (free tier: mongodb.com/cloud/atlas)
- **Git** for version control

### 1️⃣ Setup MongoDB Atlas
1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/healix?retryWrites=true&w=majority`
3. Keep it safe - you'll need it for `.env`

### 2️⃣ Clone & Install Dependencies
```bash
git clone <your-repo>
cd Healix

# Install frontend dependencies
npm install

# Install backend & microservice dependencies
cd server
npm install
pip install -r requirements.txt
cd ..
```

### 3️⃣ Configure Environment
```bash
# Copy example env file
cp server/.env.example server/.env

# Edit server/.env
nano server/.env
# Or in Windows: notepad server\.env
```

**Key settings for LOCAL DEVELOPMENT:**
```
NODE_ENV=development          # ← This auto-allows localhost CORS
MONGODB_URI=<your-atlas-uri>  # ← Update with your Atlas connection
JWT_SECRET=dev-secret-key-min-32-chars-here
```

### 4️⃣ Start Local Development
```bash
# From root directory (Healix/)
npm run dev

# What starts:
# ✅ Vite dev server (http://localhost:5173)
# ✅ Node.js backend (http://localhost:5000)
# ✅ DDI service (port 5001)
# ✅ DFI service (port 5002)
# ✅ ALT service (port 5003)
# ✅ SIDE service (port 5004)
# ✅ MEDREC service (port 5005)
# ✅ HEALTH service (port 5006)
```

### 5️⃣ View API Logs
Watch the backend logs for all API calls:
```
✅ [200] GET /api/payments/medicines (+245ms)
✅ [200] POST /api/auth/login (+381ms)
❌ [404] GET /api/invalid-endpoint (+12ms)
```

If you see `❌ CORS blocked for origin`, make sure `NODE_ENV=development` is set.

---

## 🌍 Production Deployment (Render + Vercel)

### Architecture
```
┌─────────────────────────────────────────┐
│         Vercel (Frontend)               │
│   https://healix-rg6p.vercel.app        │
│                                         │
│  Rewrites /api/* to Render backend      │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│       Render (Backend + Services)       │
│   https://healix-5vvu.onrender.com      │
│                                         │
│  - Node.js API (port 5000)              │
│  - 6 Python Microservices (5001-5006)   │
│  - MongoDB Atlas (external)             │
└─────────────────────────────────────────┘
```

### 1️⃣ Prepare Render Environment Variables
Set these in Render dashboard under **Environment**:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...@cluster.mongodb.net/healix
JWT_SECRET=<generate-random-32-char-string>
ALLOWED_ORIGINS=https://healix-rg6p.vercel.app
FRONTEND_URL=https://healix-rg6p.vercel.app
```

### 2️⃣ Deploy Backend to Render
1. Connect GitHub repo to Render
2. Create new Web Service from repository
3. Build command: `cd server && npm install && npm run build` (or leave empty)
4. Start command: `cd server && npm run start:render`
5. Set environment variables
6. Deploy!

### 3️⃣ Deploy Frontend to Vercel
1. Connect GitHub repo to Vercel
2. Framework: `Other` or `Vite`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Ensure `vercel.json` has correct Render URL
6. Deploy!

### 4️⃣ Verify Deployment
```bash
# Test backend
curl https://healix-5vvu.onrender.com/

# Test medicines endpoint
curl https://healix-5vvu.onrender.com/api/payments/medicines?limit=1

# Test frontend
Visit https://healix-rg6p.vercel.app
```

---

## 🐛 Troubleshooting

### CORS Error: "CORS blocked for origin"
**Local Development:**
- Make sure `NODE_ENV=development` in `server/.env`
- Backend will auto-allow all localhost origins

**Production:**
- Check that `ALLOWED_ORIGINS` in Render matches your Vercel domain
- Must include `https://` prefix

### API returning 502/503
**Likely cause:** Microservices not starting
- Check logs: `[API] ✅ All required microservices are ready!`
- Render free tier may take 1-2 minutes to start

### MongoDB Connection Fails
- Verify connection string in `MONGODB_URI`
- Check IP whitelist in Atlas (should allow all: `0.0.0.0/0`)
- Test locally first: `npm run dev`

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

---

## 📊 API Endpoints Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User signup
- `POST /api/auth/logout` - User logout

### Medicines Shop
- `GET /api/payments/medicines` - List medicines
- `POST /api/payments/create-order` - Create order
- `GET /api/payments/medicines/filters` - Get categories

### Health Tools
- `POST /api/ddi/predict` - Drug-drug interactions
- `POST /api/dfi/predict` - Drug-food interactions
- `POST /api/alternative/get` - Medicine alternatives
- `POST /api/side-effects/predict` - Side effect prediction

### Medical Records
- `POST /api/medical-record/summarize` - Summarize records
- `GET /api/medical-record/history` - Get history

---

## 🔧 Development Workflow

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes (both frontend and backend)
3. Test locally: `npm run dev`
4. Check API logs for errors
5. Commit: `git commit -m "feat: describe change"`
6. Push: `git push origin feature/my-feature`
7. Create Pull Request

### Common Commands
```bash
# Local development
npm run dev              # Start everything locally

# Backend only
cd server
npm run dev             # Dev mode with nodemon
npm start               # Production start
npm run seed:medicines  # Populate test data

# Frontend only
npm run dev             # Vite dev server
npm run build           # Build for production

# Debugging
NODE_ENV=development npm run dev  # Force dev mode
DEBUG=* npm start                 # Show debug logs
```

---

## 📝 Environment Comparison

| Setting | Local Dev | Production |
|---------|-----------|-----------|
| `NODE_ENV` | `development` | `production` |
| `MONGODB_URI` | Atlas URI | Same Atlas URI |
| `ALLOWED_ORIGINS` | Auto-allow localhost | Must match FRONTEND_URL |
| `FRONTEND_URL` | `http://localhost:5173` | `https://healix-rg6p.vercel.app` |
| API Logs | Verbose | Only errors |
| CORS | Permissive | Strict |

---

## 🆘 Getting Help

Check logs in order:
1. **Browser Console** (F12) - Frontend errors
2. **Terminal Output** - Backend logs
3. **Render Dashboard** - Production logs
4. **MongoDB Atlas** - Database issues

Happy developing! 🚀
