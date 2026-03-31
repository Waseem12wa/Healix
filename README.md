# Healix

Healix is a full-stack healthcare platform that combines appointment workflows, medicine safety tools, medication reminders, profile management, notifications, payments, and AI-assisted clinical utilities in one system.

The project includes:
- A React + TypeScript frontend (Vite)
- A Node.js + Express API backend (MongoDB)
- Multiple Python microservices for AI/ML health features

## Highlights

- Role-based access for patient, doctor, provider, and admin workflows
- Drug interaction checks (drug-drug)
- Drug-food interaction checks
- Medicine alternative recommendations
- Side-effect prediction
- AI Health Assistant with intent routing and action buttons
- Medical record summarization (PDF, DOCX, TXT, images, scanned PDFs)
- Medication reminders + email reminder jobs
- Medicine shop, checkout, and order history
- Profile image upload and serving via uploads proxy

## Architecture

### Frontend
- Stack: React 19, TypeScript, Vite, MUI, Framer Motion, React Router
- Location: src
- Dev server: http://localhost:5173
- Proxies (configured in vite.config.ts):
  - /api -> http://localhost:5000
  - /uploads -> http://localhost:5000

### Backend API
- Stack: Node.js, Express, Mongoose, JWT auth
- Location: server
- API base: http://localhost:5000/api
- Serves uploaded files from /uploads
- Starts immediately and checks microservice readiness asynchronously

### Python Microservices
Default ports:
- DDI service: 5001
- DFI service: 5002
- Alternatives service: 5003
- Side effects service: 5004
- Medical record summarization service: 5005
- Health assistant router service: 5006

## Monorepo Structure

- src: Frontend app
- server: Backend API and Python services
- server/routes: REST API routes
- server/models: MongoDB models
- server/services: Python and payment-related services
- server/utils: API clients and utility modules
- Models: ML model assets

## Route Map (Frontend)

Public:
- /
- /about
- /contact
- /login
- /signup
- /forgot-password
- /reset-password

Protected:
- /dashboard
- /doctor-dashboard
- /provider-dashboard
- /admin
- /tools/ai-chatbot
- /tools/health-summary
- /tools/medication-reminder
- /tools/drug-interactions
- /tools/drug-food-interactions
- /tools/drug-alternatives
- /tools/side-effects
- /tools/appointments
- /tools/notifications
- /tools/profile
- /shop/medicines
- /shop/checkout
- /shop/orders

## AI Assistant Flow

The assistant supports intent-based routing and action-button navigation.

Typical intents:
- side-effects
- drug-interaction
- food-interaction
- alternatives
- doctor-search
- medical-summary
- reminder
- general-health

Behavior:
- User asks a natural-language question.
- Health assistant service detects intent and routes to the proper feature service.
- Chat response includes formatted clinical output.
- UI can render action buttons (for example: Open Side Effects, Open Drug Interactions, Find Doctors).
- Navigation includes query parameters so target pages auto-prefill and auto-run checks when appropriate.

## Medical Record Summarization

Supported file types include:
- PDF
- DOCX
- TXT
- Common images (OCR path)

Capabilities:
- OCR extraction for images
- OCR fallback for scanned PDFs
- Medical relevance validation (non-medical uploads are rejected)
- Chunk-safe summarization to avoid model length/index overflow
- Structured output sections (conditions, medications, actions, recommendations)

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- MongoDB (local or cloud)

For OCR quality in medical summarization service:
- Tesseract OCR installed and available in PATH
- Poppler utilities installed and available in PATH (required by pdf2image)

## Installation

### 1. Install root dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install Python dependencies

From server:

```bash
py -m pip install -r requirements.txt
```

If your environment uses python command instead:

```bash
python -m pip install -r requirements.txt
```

## Running The App

From repository root:

```bash
npm run dev
```

This launches frontend only:
- Frontend (Vite) on 5173

Run backend stack in a separate terminal:

```bash
npm run start:backend
```

Or launch both frontend and backend from one command:

```bash
npm run dev:fullstack
```

Useful commands:

```bash
npm run build
npm run preview
npm run start:backend
```

Backend-only from server folder:

```bash
npm start
```

## Environment Variables

Create a .env file in server folder. Start with the minimal set and add optional integrations as needed.

### Core Required (recommended)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healix
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Optional Microservice/Runtime Controls

```env
REQUIRED_MICROSERVICES=DDI,DFI,ALT,SIDE,HEALTH
HEALTH_ASSISTANT_SERVICE_URL=http://localhost:5006
MEDICAL_RECORD_SERVICE_URL=http://localhost:5005
DDI_SERVICE_URL=http://localhost:5001
DFI_SERVICE_URL=http://localhost:5002
ALTERNATIVE_SERVICE_URL=http://localhost:5003
SIDE_EFFECT_SERVICE_URL=http://localhost:5004
```

### Optional Email

```env
USE_RESEND=true
RESEND_API_KEY=your_resend_api_key

# or SMTP style
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_DEV_MODE=false
```

### Optional Payments

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BACKEND_URL=http://localhost:5000
NAYAPAY_SUCCESS_URL=https://healix.vercel.app/shop/orders
NAYAPAY_FAILURE_URL=https://healix.vercel.app/shop/checkout?status=failed
```

### Optional Object Storage

```env
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_ACCESS_KEY_ID=
OBJECT_STORAGE_SECRET_ACCESS_KEY=
OBJECT_STORAGE_PUBLIC_BASE_URL=
```

### Frontend Environment

Create .env in root when needed:

```env
VITE_API_BASE_URL=/api/assistant
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Data Seeding And Indexing

From project root:

```bash
npm run seed:medicines
npm run seed:medicines:million
npm run seed:medicines:csv
npm run seed:medicines:pk:strict
npm run seed:drug-food:million
npm run db:indexes
```

From server directory:

```bash
npm run seed:doctors
npm run seed:medicines
npm run db:indexes
```

## API Overview

Backend route prefixes:
- /api/auth
- /api/password
- /api/doctors
- /api/appointments
- /api/notifications
- /api/ddi
- /api/dfi
- /api/alternative
- /api/side-effects
- /api/reminders
- /api/assistant
- /api/medical-record
- /api/payments

## Deployment (Render Backend + Vercel Frontend)

This repository is prepared for split deployment:
- Backend on Render
- Frontend on Vercel

### Added deployment files

- `render.yaml` (Render Blueprint for backend service in `server`)
- `vercel.json` (SPA fallback + API/uploads rewrites)
- `server/.env.example` (backend environment template)
- `.env.example` (frontend environment template)

### 1) Prepare secrets and environment variables

- Copy `server/.env.example` into Render environment variables (do not commit real secrets).
- Set `ALLOWED_ORIGINS` to your Vercel domain(s), comma-separated.
- Set `MONGODB_URI`, `JWT_SECRET`, `RESEND_API_KEY`, payment keys, and storage credentials.

Frontend (Vercel):
- Add `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel project settings.
- Keep `VITE_MEDICAL_RECORD_API_BASE_URL=/api/medical-record`.

### 2) Configure Vercel rewrite target

Update `vercel.json` and replace:
- `https://your-backend.onrender.com`

with your real Render backend URL.

### 3) Deploy backend on Render

Use Blueprint from repository root:
- Render reads `render.yaml`
- Build command installs Node dependencies and Python requirements
- Start command runs API + Python microservices (`npm run start:render`)

### 4) Deploy frontend on Vercel

- Import the same GitHub repository in Vercel
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

### 5) Post-deploy verification checklist

- Backend root health: `https://<render-url>/`
- Frontend loads and routes refresh correctly
- Login/signup works
- `/api/*` calls succeed from Vercel frontend
- `/uploads/*` image links resolve through Vercel rewrite
- Medical record summarization works through `/api/medical-record/*`

## Troubleshooting

### 401 errors in protected pages
- Verify token exists and is not expired.
- Login again to refresh session.
- Confirm frontend and backend are both running.

### Assistant unavailable
- Check Python services are running on expected ports.
- Confirm backend route /api/assistant responds.
- Verify REQUIRED_MICROSERVICES does not require services you intentionally disabled.

### Medical summarization OCR issues
- Ensure Tesseract is installed and available from command line.
- Ensure Poppler utilities are installed for pdf2image.
- Restart backend stack after dependency changes.

### Profile images not loading
- Confirm backend serves /uploads and Vite proxy includes /uploads.
- Ensure uploaded path is persisted in user profile payload.

### Build failures
- Run root build first, then backend checks.
- Verify Node and Python versions meet prerequisites.

## Security Notes

- Replace default JWT secrets in production.
- Restrict CORS origins for deployment.
- Do not commit real API keys or payment secrets.
- Review medical data handling and storage policy before production use.

## Development Notes

- Backend now starts API immediately and performs microservice readiness checks in background.
- Some features can still fail if their dependent microservice is not ready yet.
- Reminder email cron starts only when MongoDB is connected.

## License

ISC (backend package), plus dependencies under their own licenses.
