# 🧪 Creator Content Bridge - Testing Guide

This guide shows you exactly how to run and test the Creator Content Bridge application.

## 🚀 **Quick Start - 3 Ways to Test**

### **Method 1: Test Server (Simplest)**

```bash
# Navigate to project directory
cd /workspace/creator-bridge

# Run the test server (no dependencies needed)
node test-server.js
```

**Then test the endpoints:**
```bash
# In a new terminal window:
curl http://localhost:5000/
curl http://localhost:5000/api/health
curl http://localhost:5000/api/platforms/
curl http://localhost:5000/api/content/
```

### **Method 2: Full Backend (Production-like)**

```bash
# Navigate to backend
cd /workspace/creator-bridge/backend

# Install dependencies
npm install

# Start the server
npm start
# OR for development with auto-reload:
npm run dev
```

**Test the backend:**
```bash
curl http://localhost:5000/
```

### **Method 3: Frontend + Backend (Complete Experience)**

**Terminal 1 - Backend:**
```bash
cd /workspace/creator-bridge/backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/creator-bridge/frontend
npm install
npm start
```

Access the app at: `http://localhost:3000`

---

## 📋 **API Testing Checklist**

### **1. Health Check Endpoints**
```bash
# Basic health
curl -X GET http://localhost:5000/

# Detailed health info
curl -X GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Creator Bridge API is running!",
  "timestamp": "2024-07-21T21:30:00.000Z",
  "version": "1.0.0"
}
```

### **2. Authentication Endpoints**
```bash
# Simulate user registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Simulate user login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **3. Platform Connection Endpoints**
```bash
# Get connected platforms
curl -X GET http://localhost:5000/api/platforms/connections

# Start Instagram OAuth (returns auth URL)
curl -X GET http://localhost:5000/api/platforms/instagram/connect

# Start TikTok OAuth (returns auth URL)
curl -X GET http://localhost:5000/api/platforms/tiktok/connect
```

### **4. Content Management Endpoints**
```bash
# List user content
curl -X GET http://localhost:5000/api/content/

# Browse Instagram content
curl -X GET http://localhost:5000/api/content/browse/instagram/connectionId

# Content import simulation
curl -X POST http://localhost:5000/api/content/import \
  -H "Content-Type: application/json" \
  -d '{
    "videos": [
      {
        "platform": "instagram",
        "connectionId": "123",
        "videoId": "abc123"
      }
    ]
  }'
```

---

## 🎯 **Feature Testing Scenarios**

### **Scenario 1: User Registration & Login Flow**
1. ✅ Register a new user account
2. ✅ Login with credentials
3. ✅ Get user profile
4. ✅ Update profile information

### **Scenario 2: Platform Connection Flow**
1. ✅ Connect Instagram account (OAuth simulation)
2. ✅ Connect TikTok account (OAuth simulation)
3. ✅ View connected platforms
4. ✅ Test platform connections
5. ✅ Disconnect platforms

### **Scenario 3: Content Import & Management Flow**
1. ✅ Browse Instagram Reels library
2. ✅ Browse TikTok videos library
3. ✅ Select videos for import
4. ✅ Import videos with metadata
5. ✅ View imported content queue
6. ✅ Edit video metadata
7. ✅ Process content status

### **Scenario 4: CMS Integration Flow**
1. ✅ Connect JW Player account
2. ✅ Sync video to JW Player
3. ✅ Monitor sync status
4. ✅ Handle sync errors
5. ✅ View sync history

---

## 🛠️ **Development Testing**

### **Environment Setup**
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit with your API keys
nano backend/.env
```

### **Database Testing (Optional)**
```bash
# If using MongoDB locally
mongod --dbpath ./data

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### **API Integration Testing**

**Instagram API Testing:**
```bash
# Test Instagram connection (requires real API keys)
curl -X GET "http://localhost:5000/api/platforms/instagram/connect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**TikTok API Testing:**
```bash
# Test TikTok connection (requires real API keys)
curl -X GET "http://localhost:5000/api/platforms/tiktok/connect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JW Player API Testing:**
```bash
# Test JW Player upload (requires API keys)
curl -X POST "http://localhost:5000/api/destinations/jwplayer/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://example.com/video.mp4"}'
```

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

**1. Server won't start:**
```bash
# Check if port 5000 is available
lsof -i :5000

# Kill existing processes
killall node

# Try different port
PORT=3001 node server.js
```

**2. Dependencies issues:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**3. CORS errors:**
```bash
# Test with CORS headers
curl -X OPTIONS http://localhost:5000/api/content/ \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type"
```

**4. API endpoint not found:**
```bash
# Check available routes
curl http://localhost:5000/nonexistent-route
# Should return 404 with available routes
```

### **Debug Mode**
```bash
# Run with debug output
DEBUG=* node server.js

# Or with NODE_ENV
NODE_ENV=development node server.js
```

---

## 📊 **Performance Testing**

### **Load Testing with curl**
```bash
# Simple load test
for i in {1..10}; do
  curl -s http://localhost:5000/ &
done
wait
```

### **API Response Time Testing**
```bash
# Test response times
curl -w "Time: %{time_total}s\n" -s http://localhost:5000/api/health
```

---

## 🎨 **Frontend Testing**

### **React Development Server**
```bash
cd frontend
npm start
```

**Test Features:**
- ✅ User registration/login forms
- ✅ Platform connection buttons
- ✅ Content browsing interface
- ✅ Metadata editing forms
- ✅ Sync status dashboard
- ✅ Responsive design

### **Build Testing**
```bash
cd frontend
npm run build
serve -s build
```

---

## 🚀 **Production Testing**

### **Docker Testing**
```bash
# Build backend image
docker build -t creator-bridge-backend ./backend

# Run backend container
docker run -p 5000:5000 creator-bridge-backend

# Build frontend image
docker build -t creator-bridge-frontend ./frontend

# Run frontend container
docker run -p 3000:3000 creator-bridge-frontend
```

### **Environment Variables Testing**
```bash
# Test with production-like environment
NODE_ENV=production \
MONGODB_URI=mongodb://localhost:27017/creator-bridge-prod \
JWT_SECRET=super-secret-production-key \
node server.js
```

---

## ✅ **Testing Checklist**

### **Backend API Testing**
- [ ] Health endpoints respond correctly
- [ ] Authentication flow works
- [ ] Platform OAuth redirects work
- [ ] Content CRUD operations work
- [ ] File upload handling works
- [ ] Error handling is robust
- [ ] Rate limiting functions
- [ ] CORS is configured properly

### **Frontend Testing**
- [ ] Login/register forms work
- [ ] Navigation is smooth
- [ ] API integration works
- [ ] Real-time updates work
- [ ] Responsive design works
- [ ] Error states are handled
- [ ] Loading states are shown

### **Integration Testing**
- [ ] Frontend ↔ Backend communication
- [ ] OAuth flows work end-to-end
- [ ] File uploads work
- [ ] Real-time status updates
- [ ] Error propagation works

---

## 📞 **Getting Help**

If you encounter issues:

1. **Check the logs:**
   ```bash
   # Backend logs
   tail -f backend/logs/app.log
   
   # Frontend logs
   # Check browser console
   ```

2. **Verify environment setup:**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be recent
   ```

3. **Test basic connectivity:**
   ```bash
   curl -I http://localhost:5000/
   ```

4. **Check file structure:**
   ```bash
   tree creator-bridge/ -I node_modules
   ```

---

**Happy Testing! 🎉**

The Creator Content Bridge is ready for development and testing. Start with the test server for quick validation, then move to the full stack for complete functionality testing.