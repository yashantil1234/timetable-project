# How to Run the Timetable Management System

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- Git (optional, for cloning)

## Step 1: Backend Setup

### 1.1 Navigate to backend directory
```bash
cd backend
```

### 1.2 Create a virtual environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 1.3 Install Python dependencies
```bash
# From project root
pip install -r requirements.txt

# Or if you're in backend directory
pip install -r ../requirements.txt
```

### 1.4 Set up environment variables (Optional)
Create a `.env` file in the `backend` directory:
```
SECRET_KEY=YourSecretKeyHere
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

### 1.5 Run the backend server
```bash
# From backend directory
python app.py

# Or from project root
cd backend
python app.py
```

The backend will start on `http://127.0.0.1:5000`

**Expected output:**
```
Starting Enhanced Flask server...
API will be available at: http://127.0.0.1:5000

=== MODULAR ARCHITECTURE ===
✅ Models: Separate database models
✅ Routes: Organized API endpoints
✅ Services: Business logic layer
✅ Utils: Helper functions and decorators
===============================
 * Running on http://0.0.0.0:5000
```

## Step 2: Frontend Setup

### 2.1 Open a new terminal and navigate to frontend
```bash
cd frontend
```

### 2.2 Install dependencies (if not already installed)
```bash
npm install
```

### 2.3 Run the frontend development server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 3: Access the Application

1. **Backend API**: http://127.0.0.1:5000
   - Test endpoint: http://127.0.0.1:5000/
   - API documentation: Check the home route response

2. **Frontend Application**: http://localhost:5173
   - Open this URL in your browser
   - The frontend will communicate with the backend API

## Quick Start (Both Servers)

### Windows (PowerShell)
```powershell
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend (new PowerShell window)
cd frontend
npm run dev
```

### Linux/Mac
```bash
# Terminal 1 - Backend
cd backend
python3 app.py

# Terminal 2 - Frontend (new terminal)
cd frontend
npm run dev
```

## Troubleshooting

### Backend Issues

1. **Import Errors**
   - Make sure you're in the backend directory or have PYTHONPATH set
   - Check that all dependencies are installed: `pip list`

2. **Database Errors**
   - The database will be created automatically on first run
   - If issues occur, delete `timetable_enhanced.db` and restart

3. **Port Already in Use**
   - Change port in `app.py`: `app.run(debug=True, host='0.0.0.0', port=5001)`
   - Or kill the process using port 5000

### Frontend Issues

1. **CORS Errors**
   - Make sure backend is running
   - Check `config.py` and `extensions.py` for CORS settings

2. **Module Not Found**
   - Run `npm install` again
   - Delete `node_modules` and `package-lock.json`, then `npm install`

3. **Port Already in Use**
   - Vite will automatically use the next available port
   - Or specify port: `npm run dev -- --port 5174`

## Default Credentials

After first run, sample data is created with:
- **Admin**: username: `admin`, password: `password123`
- **Teacher**: username: `teacher1`, password: `password123`
- **Student**: username: `student1`, password: `password123`

## API Endpoints

- `GET /` - API information
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/admin/login` - Admin login
- `GET /admin/*` - Admin endpoints
- `GET /teacher/*` - Teacher endpoints
- `GET /student/*` - Student endpoints
- `POST /generate_timetable` - Generate timetable
- And many more...

## Development Mode

Both servers run in development mode with:
- **Backend**: Debug mode enabled, auto-reload on code changes
- **Frontend**: Hot module replacement (HMR), fast refresh

## Production Deployment

For production:
1. Set `FLASK_ENV=production` or use `ProductionConfig`
2. Use a production WSGI server (gunicorn, uwsgi)
3. Build frontend: `npm run build`
4. Serve frontend with a web server (nginx, Apache)

## Need Help?

- Check `backend/REVIEW_REPORT.md` for architecture details
- Check console/terminal for error messages
- Verify all dependencies are installed correctly
