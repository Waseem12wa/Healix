# 💊 Healix – AI Powered Healthcare Assistant

Healix is a web-based healthcare application designed to enhance **patient safety, medication management, and clinical decision support** using **AI-powered tools**.  
It provides features like **drug–drug interactions, drug–food interactions, drug reminders, AI chatbot for health queries, personalized drug alternatives, and automatic health record summarization**.  

---

## 🚀 Features

- 🔹 **Drug–Drug Interaction Checker** – Detects harmful interactions between prescribed medicines.  
- 🔹 **Drug–Food Interaction Checker** – Warns patients about foods that may interact with medications.  
- 🔹 **Drug Alternatives** – Suggests safe and effective alternative medicines.  
- 🔹 **Medication Reminder** – Sends reminders for taking medicines on time.  
- 🔹 **AI Chatbot** – Answers patient health queries in natural language (Urdu + English).  
- 🔹 **AI Health Record Summarization** – Summarizes long patient health reports for quick understanding.  
- 🔹 **Multi-Channel Notifications** – Email, SMS, and WhatsApp reminders (configurable).  
- 🔹 **Secure Patient Records** – Stores and manages patient information safely.  

---

## 🏗️ System Architecture (Simplified)

1. **Frontend (Web App)** – Built with React + TailwindCSS for a responsive and modern UI.  
2. **Backend (API Layer)** – FastAPI (Python) provides REST APIs for drug data, chatbot, reminders, etc.  
3. **Database** – PostgreSQL/MySQL for structured medical records.  
4. **AI/NLP Layer** –  
   - Drug interaction knowledge base.  
   - AI models for summarization & chatbot.  
   - Speech-to-text and text-to-speech (optional).  
5. **Notification Services** – SMS, WhatsApp, and Email APIs for reminders.  

---

## 🛠️ Tech Stack

**Frontend**  
- React.js  
- TailwindCSS  

**Backend**  
- FastAPI (Python)  
- PostgreSQL / MySQL  
- Redis (for scheduling reminders & queues)  

**AI & NLP**  
- Transformers (Hugging Face) for summarization & chatbot  
- Vosk (Speech-to-Text, Urdu + English)  
- Coqui TTS (Text-to-Speech)  

**Deployment**  
- Dockerized (portable & secure)  
- Hosting: DigitalOcean / Hetzner / On-Prem Server  

---

## 📸 Screenshots

*(Add screenshots here once UI is ready)*  
- Patient Dashboard  
- Drug Interaction Checker  
- AI Chatbot Conversation  
- Reminder Notifications  

---

## ⚙️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/healix.git
cd healix

# Backend Setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend Setup
cd frontend
npm install
npm start
