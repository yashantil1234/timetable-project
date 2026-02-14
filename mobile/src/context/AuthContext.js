// Authentication Context Provider
import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from '../services/api';
import storageService from '../services/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status on app load
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await storageService.getToken();
            const userData = await storageService.getUserData();

            if (token && userData) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username, password, userType) => {
        try {
            let response;

            if (userType === 'admin') {
                response = await apiService.adminLogin(username, password);
            } else {
                response = await apiService.login(username, password);
            }

            if (response && response.token) {
                const userData = {
                    role: response.role,
                    user_id: response.user_id,
                    full_name: response.full_name || '',
                    department: response.department || ''
                };

                // Verify role matches selected user type
                if (userType === 'admin' && response.role !== 'admin') {
                    throw new Error('Invalid admin credentials');
                }
                if (userType === 'student' && response.role !== 'student') {
                    throw new Error('You are not registered as a student');
                }
                if (userType === 'teacher' && response.role !== 'teacher') {
                    throw new Error('You are not registered as a teacher');
                }

                setUser(userData);
                setIsAuthenticated(true);
                return { success: true, user: userData };
            } else {
                throw new Error(response?.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
