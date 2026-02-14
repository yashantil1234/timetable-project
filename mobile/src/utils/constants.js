// Constants used throughout the app
// IMPORTANT: Update the production URL after deploying your backend
// Replace 'https://your-backend.onrender.com' with your actual deployed backend URL
export const API_BASE_URL = __DEV__
    ? 'http://192.168.101.3:5000'  // Development: Your computer's local IP with backend port
    : 'https://your-backend.onrender.com';  // Production: Replace with your deployed backend URL

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TIME_SLOTS = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM'
];

export const COLORS = {
    primary: '#3498db',
    secondary: '#2ecc71',
    danger: '#e74c3c',
    warning: '#f39c12',
    dark: '#2c3e50',
    light: '#ecf0f1',
    white: '#ffffff',
    gray: '#95a5a6'
};

export const USER_ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin'
};
