# 🚀 Creator Content Bridge - Quick Start

## Step 1: Run the Demo (30 seconds)

```bash
cd creator-bridge
node simple-demo.js
```

You'll see output like this:
```
🌉 Creator Content Bridge - Simple Demo
=======================================

✅ 1. Multi-Platform OAuth Integration
✅ 2. Content Ingestion & Metadata Extraction  
✅ 3. Staging Dashboard
✅ 4. CMS Integration

🚀 Creator Bridge Demo Server Started!
📍 Running on: http://localhost:5000
```

## Step 2: Test the API (in a new terminal)

```bash
# Test 1: Health Check
curl http://localhost:5000/

# Test 2: Platform Connections
curl http://localhost:5000/api/platforms/connections

# Test 3: Content Library
curl http://localhost:5000/api/content/

# Test 4: Sync Operations
curl http://localhost:5000/api/sync/recent
```

## What You're Testing

### 🔗 **Platform Connections**
See how the app connects to Instagram and TikTok accounts:
```json
{
  "connections": [
    {
      "platform": "instagram",
      "accountHandle": "@creative_agency",
      "status": "connected",
      "autoSync": true
    }
  ]
}
```

### 📹 **Content Management**
See how social media content is imported and managed:
```json
{
  "content": [
    {
      "title": "Ultimate Marketing Tips for 2024",
      "platform": "instagram",
      "status": "ready",
      "originalCaption": "Top 5 marketing tips...",
      "editedTitle": "Ultimate Marketing Tips for 2024 - Transform Your Business",
      "hashtags": ["marketing", "business", "tips"],
      "stats": { "likes": 1547, "views": 12543 }
    }
  ]
}
```

### 🔄 **CMS Integration**
See how content syncs to JW Player:
```json
{
  "recent": [
    {
      "contentId": "content_002",
      "destination": "jwplayer", 
      "status": "success",
      "destinationUrl": "https://cdn.jwplayer.com/videos/xyz123"
    }
  ]
}
```

## Next Steps

1. **Try the Full Backend**: `cd backend && npm install && npm start`
2. **Try the Frontend**: `cd frontend && npm install && npm start`
3. **Read the Docs**: Check `README.md` for complete documentation

## Architecture Overview

```
Social Platforms          Creator Bridge          Owned Media
┌─────────────┐           ┌──────────────┐       ┌──────────────┐
│ Instagram   │ ◄────────►│   Content    │◄─────►│ JW Player    │
│ TikTok      │           │   Pipeline   │       │ Vimeo        │
│ (Future)    │           │              │       │ Wistia       │
└─────────────┘           └──────────────┘       └──────────────┘
```

**The Creator Bridge handles:**
- 🔐 OAuth authentication with social platforms
- 📥 Video and metadata extraction  
- 🎛️ Content staging and editing
- 🚀 Automated CMS deployment
- 📊 Sync status tracking

Stop the demo with `Ctrl+C` when done!