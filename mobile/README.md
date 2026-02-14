# Timetable Management - Mobile App

React Native mobile application for the Timetable Management System, built with Expo.

## 📱 Features

- **Cross-Platform**: Works on both iOS and Android
- **Role-Based Access**: Separate dashboards for Students, Teachers, and Administrators
- **Real-time Sync**: Connects to the same backend API as the web app
- **Offline Support**: Basic offline capabilities with AsyncStorage
- **Modern UI**: Clean, intuitive interface optimized for mobile devices

## 🚀 Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo Go app on your mobile device (for testing)
- Backend API running (see ../backend/README.md)

## 📦 Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies (already done if following setup):
   ```bash
   npm install
   ```

3. Configure API URL:
   - Open `src/utils/constants.js`
   - Update `API_BASE_URL` with your computer's local IP address:
     ```javascript
     export const API_BASE_URL = 'http://192.168.1.XXX:5000';
     ```
   - To find your local IP:
     - **Windows**: Run `ipconfig` in CMD, look for IPv4 Address
     - **Mac/Linux**: Run `ifconfig` or `ip addr`, look for inet address

## 🏃 Running the App

1. Start the backend server (in the backend directory):
   ```bash
   python app.py
   ```

2. Start Expo development server (in the mobile directory):
   ```bash
   npm start
   ```

3. Scan the QR code:
   - **Android**: Use Expo Go app
   - **iOS**: Use Camera app or Expo Go app
   - Make sure your phone and computer are on the same WiFi network

## 📱 Building for Production

### Android (APK)
```bash
npm run build:android
```

### iOS (requires Mac)
```bash
npm run build:ios
```

## 👤 Test Credentials

### Student
- Username: `student1`
- Password: `password123`

### Teacher
- Username: `teacher1`
- Password: `password123`

### Admin
- Username: `admin`
- Password: `password123`

## 📁 Project Structure

```
mobile/
├── App.js                 # Main app entry point
├── src/
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # All app screens
│   │   ├── auth/          # Login screen
│   │   ├── student/       # Student screens
│   │   ├── teacher/       # Teacher screens
│   │   └── admin/         # Admin screens
│   ├── components/        # Reusable components
│   ├── services/          # API and storage services
│   ├── context/           # React context providers
│   └── utils/             # Utility functions and constants
└── assets/               # Images and other assets
```

## 🔧 Troubleshooting

### Cannot connect to backend
- Verify backend is running on `http://localhost:5000`
- Update `API_BASE_URL` in `src/utils/constants.js` with correct local IP
- Ensure phone and computer are on same WiFi network
- Check if firewall is blocking port 5000

### App won't start
```bash
# Clear cache and restart
npm start --clear
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 🌟 Features by Role

### Student
- ✅ View personal timetable
- ✅ View profile information
- ✅ Submit leave requests
- ✅ Check class schedule

### Teacher
- ✅ View personal teaching schedule
- ✅ Check room occupancy status
- ✅ Create swap requests
- ✅ Submit leave requests
- ✅ Manage class swaps

### Admin
- ✅ View system overview
- ✅ Manage swap requests (approve/reject)
- ✅ Manage leave requests (approve/reject)
- ✅ View all timetables
- ⚠️ Advanced features (CSV uploads, timetable generation) available on web only

## 📝 Notes

- The mobile app is optimized for viewing and basic operations
- Complex administrative tasks should be performed on the web dashboard
- First launch may take longer as assets are loaded
- Logout will clear all stored credentials

## 🐛 Known Issues

- None currently

## 📄 License

Part of the Timetable Management System project.

## 🤝 Support

For issues or questions, please refer to the main project documentation.
