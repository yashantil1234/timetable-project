import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
// Import functions from your service file
import { getUserRole, logout, loginUser } from './services/api'; 
import LoginPage from './pages/Login/LoginPage'; // Make sure this path is correct
import StudentDashboard from './pages/Studentdashboard/studentdashboard'; // Make sure this path is correct

// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = getUserRole();
    const token = localStorage.getItem('token');
    
    if (token && role) {
      setUserRole(role);
      setCurrentView(getDashboardView(role));
    } else {
      setCurrentView('login');
    }
  }, []);

  const getDashboardView = (role) => {
    switch(role) {
      case 'student': return 'student-dashboard';
      case 'teacher': return 'teacher-dashboard';
      case 'admin': return 'admin-dashboard';
      default: return 'login';
    }
  };

  const handleLogin = (role) => {
    setUserRole(role);
    setCurrentView(getDashboardView(role));
  };

  const handleLogout = () => {
    logout();
    setUserRole(null);
    setCurrentView('login');
  };

  switch(currentView) {
    case 'login':
      return <LoginPage onLogin={handleLogin} />;
    
    case 'student-dashboard':
      return <StudentDashboard onLogout={handleLogout} />;
    
    case 'teacher-dashboard':
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="shadow-xl max-w-md">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
              <p className="text-gray-600 mb-4">Under Construction</p>
              <Button onClick={handleLogout}>Logout</Button>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'admin-dashboard':
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="shadow-xl max-w-md">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <p className="text-gray-600 mb-4">Under Construction</p>
              <Button onClick={handleLogout}>Logout</Button>
            </CardContent>
          </Card>
        </div>
      );
    
    default:
      return <LoginPage onLogin={handleLogin} />;
  }
}
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.token = localStorage.getItem('token');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token'); // Get fresh token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`; // Use Bearer token
    }
    return headers;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = { ...options, headers: this.getHeaders() };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async login(username, password) {
    const data = await this.makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' } // No auth header for login
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_role', data.role);
      localStorage.setItem('user_id', data.user_id);
    }
    return data;
  }

  // --- Student Specific ---
  async getStudentTimetable() {
    return this.makeRequest('/student/timetable');
  }
  
  // --- Teacher Specific ---
  async getTeacherTimetable() {
    return this.makeRequest('/teacher/timetable'); // Added for completeness
  }

  // --- Admin Specific ---
  async getAdminDashboardStats() {
    return this.makeRequest('/admin/dashboard-stats'); // Example admin route
  }

  // --- General ---
  async getAnnouncements() {
    return this.makeRequest('/api/announcements');
  }

  getUserRole() {
    return localStorage.getItem('user_role');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
  }
}

const apiService = new ApiService();

// ====================================================================
// Components (Each should be in its own file)
// ====================================================================

function LoginComponent({ onLogin }) {
  // ... LoginComponent code is unchanged
  return <div>Login Component Placeholder</div>;
}

function StudentDashboard({ onLogout }) {
  // ... StudentDashboard code is unchanged
  return <div>Student Dashboard Placeholder</div>;
}


// ====================================================================
// Main App Component
// ====================================================================

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = apiService.getUserRole();
    const token = localStorage.getItem('token');
    
    if (token && role) {
      setUserRole(role);
      setCurrentView(getDashboardView(role));
    } else {
      setCurrentView('login');
    }
  }, []);

  const getDashboardView = (role) => {
    switch(role) {
      case 'student': return 'student-dashboard';
      case 'teacher': return 'teacher-dashboard';
      case 'admin': return 'admin-dashboard';
      default: return 'login';
    }
  };

  const handleLogin = (role) => {
    setUserRole(role);
    setCurrentView(getDashboardView(role));
  };

  const handleLogout = () => {
    apiService.logout();
    setUserRole(null);
    setCurrentView('login');
  };

  switch(currentView) {
    case 'login':
      return <LoginComponent onLogin={handleLogin} />;
    
    case 'student-dashboard':
      return <StudentDashboard onLogout={handleLogout} />;
    
    case 'teacher-dashboard':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
          <Card className="shadow-xl max-w-md">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
              <p className="text-gray-600 mb-4">This dashboard is under construction.</p>
              <Button onClick={handleLogout}>Logout</Button>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'admin-dashboard':
      // This is where you would place your Admin Dashboard component
      // For now, it's a placeholder
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-violet-50">
          <Card className="shadow-xl max-w-md">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
              <p className="text-gray-600 mb-4">Welcome, Admin! This dashboard is under construction.</p>
              <Button onClick={handleLogout}>Logout</Button>
            </CardContent>
          </Card>
        </div>
      );
    
    default:
      return <LoginComponent onLogin={handleLogin} />;
  }
}