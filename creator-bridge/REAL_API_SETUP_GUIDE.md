# 🔥 Real API Integration Setup Guide

## 🎯 **Transform to REAL Data Pipeline**

This guide will help you connect Creator Content Bridge to **actual Instagram accounts** and **real JW Player** for live content migration. No more demo data - this is the real deal!

---

## 📋 **Prerequisites**

- **Instagram Business/Creator Account** (required for API access)
- **JW Player Account** (with Management API access)
- **Facebook Developer Account** (for Instagram API)
- **Node.js** and **npm** installed
- **Webhook-accessible domain** (for production OAuth callbacks)

---

## 🔧 **Step 1: Instagram Basic Display API Setup**

### **1.1 Create Facebook App**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Create App"** → **"Consumer"** → **"Next"**
3. Enter App Name: `Creator Content Bridge`
4. Enter Contact Email
5. Click **"Create App"**

### **1.2 Add Instagram Basic Display Product**
1. In your app dashboard, click **"Add Product"**
2. Find **"Instagram Basic Display"** → Click **"Set Up"**
3. Click **"Create New App ID"** if prompted

### **1.3 Configure Instagram Basic Display**
1. Go to **Products** → **Instagram Basic Display** → **Basic Display**
2. Click **"Create New App"**
3. **Valid OAuth Redirect URIs**: Add `http://localhost:5000/auth/instagram/callback`
4. Click **"Save Changes"**

### **1.4 Get Credentials**
1. Go to **Instagram Basic Display** → **Basic Display**
2. Copy **Instagram App ID** and **Instagram App Secret**
3. Save these for your `.env` file

### **1.5 Add Test User**
1. In **Instagram Basic Display** → **Basic Display**
2. Scroll to **"User Token Generator"**
3. Click **"Add or Remove Instagram Testers"**
4. Add the Instagram account you want to test with
5. The Instagram user must accept the invitation

---

## 🎬 **Step 2: JW Player Management API Setup**

### **2.1 Access JW Player Dashboard**
1. Log in to [JW Player Dashboard](https://dashboard.jwplayer.com/)
2. Go to **"Account"** → **"API Credentials"**
3. Or navigate to: `https://dashboard.jwplayer.com/p/integration`

### **2.2 Generate API Credentials**
1. Click **"Show Credentials"** or **"Generate New Key"**
2. Copy the **API Key** and **API Secret**
3. Note your **Site ID** (visible in the URL or dashboard)

### **2.3 Configure Permissions**
Ensure your JW Player account has:
- ✅ **Media Management** permissions
- ✅ **Upload** permissions  
- ✅ **Analytics** access (optional)

---

## ⚙️ **Step 3: Configure Environment Variables**

### **3.1 Create `.env` File**
```bash
cd backend
cp .env.example .env
```

### **3.2 Fill in Your Real Credentials**
```bash
# =============================================================================
# REAL API CREDENTIALS - FILL THESE IN!
# =============================================================================

# Instagram Basic Display API
INSTAGRAM_APP_ID=your-real-instagram-app-id
INSTAGRAM_APP_SECRET=your-real-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:5000/auth/instagram/callback

# JW Player Management API  
JW_PLAYER_API_KEY=your-real-jw-player-api-key
JW_PLAYER_API_SECRET=your-real-jw-player-api-secret
JW_PLAYER_SITE_ID=your-real-jw-player-site-id

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# File Processing
TEMP_DIR=./temp
PROCESSED_DIR=./processed
CONCURRENT_DOWNLOADS=3
CONCURRENT_UPLOADS=2
```

---

## 🚀 **Step 4: Install Real Dependencies**

### **4.1 Install New Packages**
```bash
cd backend
npm install
```

### **4.2 Verify Installation**
The following packages are now included:
- `axios` - HTTP requests to APIs
- `fs-extra` - File system operations
- `uuid` - Unique file naming
- `form-data` - File uploads to JW Player
- `sharp` - Image processing (optional)

---

## 🎮 **Step 5: Test Real API Connections**

### **5.1 Start the Backend**
```bash
cd backend
node server.js
```

**Expected Output:**
```
🚀 Creator Bridge API Server is running on port 5000
📸 Instagram OAuth: http://localhost:5000/auth/instagram  
✨ Ready for real Instagram → JW Player content migration!
```

### **5.2 Test API Configuration**
```bash
# Test if APIs are configured correctly
curl -X POST http://localhost:5000/api/test/connections
```

**Expected Response:**
```json
{
  "success": true,
  "connections": {
    "instagram": {
      "configured": true,
      "authUrl": "https://api.instagram.com/oauth/authorize?...",
      "message": "Instagram API credentials configured"
    },
    "jwplayer": {
      "success": true,
      "account": { ... },
      "message": "Successfully connected to JW Player"
    }
  }
}
```

### **5.3 Start the Frontend**
```bash
cd frontend
npm start
```

---

## 🔗 **Step 6: Connect Real Instagram Account**

### **6.1 Initiate OAuth Flow**
1. Visit: `http://localhost:3000`
2. Click **"Platforms"** tab
3. Click **"Connect"** next to Instagram
4. **OR** visit directly: `http://localhost:5000/auth/instagram`

### **6.2 Authorize Your Account**
1. You'll be redirected to Instagram
2. Log in with your test Instagram account
3. Click **"Authorize"** to grant permissions
4. You'll be redirected back to the app

### **6.3 Verify Connection**
- ✅ Dashboard shows Instagram as "Connected"
- ✅ Username appears as `@your-instagram-username`
- ✅ Platform stats update

---

## 📥 **Step 7: Import Real Instagram Content**

### **7.1 Import Videos**
1. Go to **"Platforms"** tab
2. Click **"Import Now"** next to connected Instagram
3. **Watch**: Real videos download from your Instagram account!

### **7.2 What Happens**
- ✅ **Fetches actual videos** from your Instagram account
- ✅ **Downloads video files** to local temp directory
- ✅ **Extracts real metadata** (captions, hashtags, stats)
- ✅ **Processes thumbnails** and video information
- ✅ **Shows in Content tab** with real data

---

## 🚀 **Step 8: Sync to Real JW Player**

### **8.1 Upload to JW Player**
1. Go to **"Content"** tab
2. Find an imported Instagram video
3. Click **"Sync to CMS"**
4. **Watch**: Video uploads to your actual JW Player account!

### **8.2 What Happens**
- ✅ **Uploads video file** to JW Player using Management API
- ✅ **Sets metadata** (title, description, tags)
- ✅ **Generates embed codes** and player URLs
- ✅ **Updates status** to "synced"
- ✅ **Cleans up** temporary files

### **8.3 Verify in JW Player**
1. Visit your [JW Player Dashboard](https://dashboard.jwplayer.com/)
2. Go to **"Content"** → **"Videos"**
3. **See your Instagram video** uploaded with proper metadata!

---

## 🎯 **Step 9: Real Workflow Demo**

### **Complete Instagram → JW Player Pipeline:**

1. **Connect Instagram** → Real OAuth authorization
2. **Import Content** → Downloads actual Instagram videos  
3. **Edit Metadata** → Optimize titles/descriptions for SEO
4. **Sync to JW Player** → Uploads to your video platform
5. **Monitor Progress** → Real-time status updates
6. **View Results** → Videos live in JW Player dashboard

---

## 🔥 **Production Configuration**

### **For Live Deployment:**

1. **Update Redirect URI**:
   ```
   INSTAGRAM_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback
   ```

2. **Configure Webhooks** (optional):
   ```
   WEBHOOK_SECRET=your-secure-webhook-secret
   ```

3. **Add SSL** for secure OAuth callbacks

4. **Set Environment**:
   ```
   NODE_ENV=production
   ```

5. **Configure Database** (replace in-memory storage):
   ```
   MONGODB_URI=mongodb://your-production-db
   ```

---

## 🛠️ **Troubleshooting**

### **Instagram API Issues:**
- ✅ **Invalid Client**: Check `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`
- ✅ **Redirect URI Mismatch**: Ensure exact match in Facebook app settings
- ✅ **User Not Tester**: Add Instagram account as tester in Facebook app
- ✅ **Scope Issues**: Verify `user_profile,user_media` permissions

### **JW Player API Issues:**
- ✅ **Invalid Credentials**: Check `JW_PLAYER_API_KEY` and `JW_PLAYER_API_SECRET`
- ✅ **Wrong Site ID**: Verify `JW_PLAYER_SITE_ID` in dashboard
- ✅ **Upload Failures**: Check file permissions and disk space
- ✅ **API Limits**: Monitor rate limiting and concurrent uploads

### **File Processing Issues:**
- ✅ **Download Failures**: Check Instagram video URLs and permissions
- ✅ **Disk Space**: Ensure adequate space in temp directories
- ✅ **File Permissions**: Verify write access to temp/processed folders

---

## 🎉 **Success! Real Data Pipeline**

You now have a **fully functional, production-ready** Creator Content Bridge that:

✅ **Connects to real Instagram accounts** via OAuth  
✅ **Downloads actual video content** from Instagram  
✅ **Uploads to real JW Player** via Management API  
✅ **Processes real metadata** and file handling  
✅ **Provides live status tracking** and error handling  

**This is no longer a demo - it's a real B2B SaaS tool ready for clients!** 🚀

---

## 📞 **Need Help?**

- **Instagram API Docs**: [developers.facebook.com/docs/instagram-basic-display-api](https://developers.facebook.com/docs/instagram-basic-display-api)
- **JW Player API Docs**: [docs.jwplayer.com/platform/reference](https://docs.jwplayer.com/platform/reference)
- **OAuth Debugging**: Check browser network tab and server logs