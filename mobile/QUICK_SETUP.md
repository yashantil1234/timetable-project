# 🔧 Quick Setup Instructions

## Step 1: Find Your Local IP Address

Run this in PowerShell or Command Prompt:
```bash
ipconfig
```

Look for "IPv4 Address" under your active network adapter (usually something like `192.168.1.XXX` or `10.0.0.XXX`)

## Step 2: Update API URL

1. Open: `mobile/src/utils/constants.js`
2. Replace the IP address in line 2:
   ```javascript
   export const API_BASE_URL = __DEV__ 
     ? 'http://YOUR_IP_HERE:5000'  // ← Replace YOUR_IP_HERE with your actual IP
     : 'https://your-production-api.com';
   ```

   Example:
   ```javascript
   export const API_BASE_URL = __DEV__ 
     ? 'http://192.168.1.105:5000'  
     : 'https://your-production-api.com';
   ```

## Step 3: Start the Backend

In the `backend` directory:
```bash
python app.py
```

The API should be running at `http://localhost:5000` (or the IP you configured)

## Step 4: Start the Mobile App

In the `mobile` directory:
```bash
npm start
```

A QR code will appear in your terminal.

## Step 5: Test on Your Device

1. Download "Expo Go" app from:
   - Google Play Store (Android)
   - App Store (iOS)

2. Scan the QR code:
   - **Android**: Open Expo Go and tap "Scan QR Code"
   - **iOS**: Open Camera app and point at QR code

3. Make sure your phone and computer are on the **same WiFi network**

## Step 6: Login

Use these test credentials:

**Student:**
- Username: `student1`
- Password: `password123`

**Teacher:**
- Username: `teacher1`  
- Password: `password123`

**Admin:**
- Username: `admin`
- Password: `password123`

## Troubleshooting

### "Network error - please check your connection"
- ✅ Make sure backend is running (`python app.py`)
- ✅ Verify you updated the IP in `constants.js`
- ✅ Check phone and computer are on same WiFi
- ✅ Try disabling firewall temporarily

### "Cannot connect to Metro bundler"
- ✅ Run `npm start --clear` to clear cache
- ✅ Make sure port 8081 is not blocked

### App crashes immediately
```bash
cd mobile
rm -rf node_modules
npm install
npm start
```

## Next Steps

Once the app is running:
1. ✅ Test login with all three user roles
2. ✅ Verify dashboard loads for each role
3. ✅ Check that API calls work
4. ✅ Test navigation between screens

Happy coding! 🚀
