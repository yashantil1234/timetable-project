import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    // If no token is found, redirect the user to the login page
    return <Navigate to="/login" />;
  }

  // If a token exists, render the child component (e.g., Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;