# Quick Start Guide

## 🚀 Fast Setup (2 Terminals)

### Terminal 1 - Backend
```bash
cd backend
pip install -r ../requirements.txt
python app.py
```

### Terminal 2 - Frontend  
```bash
cd frontend
npm install
npm run dev
```

## ✅ Verify It's Working

1. **Backend**: Open http://127.0.0.1:5000 in browser
   - Should see JSON with API information

2. **Frontend**: Open http://localhost:5173 in browser
   - Should see the timetable application

## 🔑 Default Login Credentials

- **Admin**: `admin` / `password123`
- **Teacher**: `teacher1` / `password123`  
- **Student**: `student1` / `password123`

## ⚠️ Common Issues

**Backend won't start?**
- Check Python version: `python --version` (need 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check for port conflicts (port 5000)

**Frontend won't start?**
- Check Node version: `node --version` (need 16+)
- Install dependencies: `npm install`
- Check for port conflicts (port 5173)

**CORS errors?**
- Make sure backend is running first
- Check backend console for errors

## 📝 Full Instructions

See `HOW_TO_RUN.md` for detailed setup instructions.
