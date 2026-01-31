// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/Login/Loginpage';
import Dashboard from './pages/dashboard/dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Courses from './pages/Courses/Course';
import Teachers from './pages/Teachers/teachers';
import Rooms from './pages/rooms/Rooms';
import Timetable from './pages/Timetable/timetable';
import Layout from './Layout/Layout';
import ApiService from './services/api';

// Inner component that has access to useLocation
function AppRoutes() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check authentication status
  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      
      if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
    setLoading(false);
  }, [checkAuth]);

  // Check authentication when route changes (e.g., after login)
  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  const handleLogout = () => {
    ApiService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
          <Navigate to={`/${userRole}`} replace /> : 
          <LoginPage />
        } 
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          isAuthenticated && userRole === 'admin' ?
          <Layout onLogout={handleLogout}>
            <Dashboard />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/courses"
        element={
          isAuthenticated && userRole === 'admin' ?
          <Layout onLogout={handleLogout}>
            <Courses />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/faculty"
        element={
          isAuthenticated && userRole === 'admin' ?
          <Layout onLogout={handleLogout}>
            <Teachers />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/rooms"
        element={
          isAuthenticated && userRole === 'admin' ?
          <Layout onLogout={handleLogout}>
            <Rooms />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/timetable"
        element={
          isAuthenticated && userRole === 'admin' ?
          <Layout onLogout={handleLogout}>
            <Timetable />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/admin/*"
        element={
          isAuthenticated && userRole === 'admin' ?
          <Layout onLogout={handleLogout}>
            <Dashboard />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      
      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          isAuthenticated && userRole === 'teacher' ?
          <TeacherDashboard onLogout={handleLogout} /> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/timetable"
        element={
          isAuthenticated && userRole === 'teacher' ?
          <Layout onLogout={handleLogout}>
            <Timetable />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/teacher/*"
        element={
          isAuthenticated && userRole === 'teacher' ?
          <Layout onLogout={handleLogout}>
            <Dashboard />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      
      {/* Student Routes */}
      <Route
        path="/student"
        element={
          isAuthenticated && userRole === 'student' ?
          <StudentDashboard onLogout={handleLogout} /> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/timetable"
        element={
          isAuthenticated && userRole === 'student' ?
          <Layout onLogout={handleLogout}>
            <Timetable />
          </Layout> :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/student/*"
        element={
          isAuthenticated && userRole === 'student' ?
          <StudentDashboard onLogout={handleLogout} /> :
          <Navigate to="/login" replace />
        }
      />
      
      {/* Default Route - Redirect to login or dashboard based on auth */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
          <Navigate to={`/${userRole}`} replace /> : 
          <Navigate to="/login" replace />
        } 
      />

      {/* Catch all other routes */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? `/${userRole}` : "/login"} replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;