# 🔌 Frontend Connection Guide

## ✅ Backend Status: WORKING

The backend is running successfully and all endpoints are functional!

---

## 📡 Backend Information

**Server URL:** `http://localhost:5000`  
**Database:** MongoDB (Local) - Connected ✅  
**Port:** 5000

---

## 🔗 API Endpoints

### Authentication
```
POST http://localhost:5000/api/users/register
POST http://localhost:5000/api/users/login
POST http://localhost:5000/api/users/verify-otp
POST http://localhost:5000/api/users/forgotpassword
PUT  http://localhost:5000/api/users/resetpassword
```

### Restaurants
```
GET  http://localhost:5000/api/restaurants/live?latitude=9.9312&longitude=76.2673
GET  http://localhost:5000/api/restaurants/:id
GET  http://localhost:5000/api/restaurants/:id/menu
POST http://localhost:5000/api/restaurants/setup
POST http://localhost:5000/api/restaurants/:id/menu
```

### Orders
```
POST http://localhost:5000/api/orders
GET  http://localhost:5000/api/orders/customer/:customerId
GET  http://localhost:5000/api/orders/:id
GET  http://localhost:5000/api/orders/restaurant/:id
```

### Delivery
```
POST  http://localhost:5000/api/delivery/update-location
GET   http://localhost:5000/api/delivery/online-drivers
GET   http://localhost:5000/api/delivery/track/:orderId
PATCH http://localhost:5000/api/delivery/toggle-status/:agentId
```

---

## 🐛 Troubleshooting "Network Error"

### 1. Check if Backend is Running
```bash
# In backend folder
npm start
```
You should see:
```
🚀 Server running on port: 5000
✅ MongoDB Connected Successfully!
```

### 2. Test Backend Connection
Open browser and go to: `http://localhost:5000`  
You should see: "Seedha Order Backend is running successfully! 🚀"

### 3. Frontend Configuration

#### For React Native / Expo:

**If testing on Android Emulator:**
```javascript
const API_URL = 'http://10.0.2.2:5000/api';
```

**If testing on iOS Simulator:**
```javascript
const API_URL = 'http://localhost:5000/api';
```

**If testing on Physical Device:**
```javascript
// Use your computer's IP address
const API_URL = 'http://192.168.x.x:5000/api';
```

To find your IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

#### Example Signup Request:
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Adjust based on above

const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role: userData.role || 'customer'
    });
    
    console.log('Signup successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error.response?.data || error.message);
    throw error;
  }
};
```

### 4. CORS Issues

The backend already has CORS enabled:
```javascript
app.use(cors());
```

If you still face CORS issues, you can specify origins:
```javascript
app.use(cors({
  origin: '*', // Allow all origins (development only)
  credentials: true
}));
```

### 5. Firewall/Network Issues

**Windows Firewall:**
- Allow Node.js through Windows Firewall
- Or temporarily disable firewall for testing

**Network:**
- Make sure frontend and backend are on same network (if using physical device)
- Check if any VPN is blocking local connections

### 6. Port Already in Use

If port 5000 is taken:
```bash
# Change PORT in backend/.env
PORT=3000
```

Then update frontend API_URL accordingly.

---

## 📱 Testing with Expo

### For Expo Development:

1. **Start Backend:**
```bash
cd backend
npm start
```

2. **Find Your IP Address:**
```bash
ipconfig  # Windows
ifconfig  # Mac/Linux
```

3. **Update Frontend API URL:**
```javascript
// In your frontend config/constants
const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';
// Example: 'http://192.168.1.100:5000/api'
```

4. **Start Expo:**
```bash
cd frontend
npm start
```

5. **Test on Same Network:**
- Make sure your phone and computer are on the same WiFi network
- Scan QR code with Expo Go app

---

## ✅ Verification Checklist

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] MongoDB is connected (check server logs)
- [ ] Can access `http://localhost:5000` in browser
- [ ] Frontend API_URL is correctly configured
- [ ] Using correct IP address for physical device testing
- [ ] Firewall allows Node.js connections
- [ ] Same network for phone and computer (if using physical device)

---

## 🧪 Quick Test

Run this in backend folder to verify everything works:
```bash
node test-signup.js
```

You should see:
```
✅ Server is running
✅ Signup successful!
✅ All tests passed!
```

---

## 📞 Common Error Messages

### "Network Error" or "Network Request Failed"
- Backend not running
- Wrong API URL
- Firewall blocking connection
- Different networks (phone vs computer)

### "Cannot connect to localhost"
- Use `10.0.2.2` for Android Emulator
- Use computer's IP for physical device

### "CORS Error"
- Already handled in backend
- Check browser console for details

---

## 🎯 Ready to Connect!

Your backend is fully functional and ready for frontend integration. Just make sure to use the correct API URL based on your testing environment!
