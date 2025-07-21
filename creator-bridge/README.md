# Creator Content Bridge 🌉

A powerful B2B SaaS tool designed for SMMAs and professional creators to seamlessly migrate video content from social platforms to owned media ecosystems.

## 🚀 Product Vision

Creator Content Bridge acts as the essential pipeline for liberating video content from social platforms (Instagram Reels, TikTok) and redeploying it into a powerful, owned media ecosystem (starting with JW Player, expanding to Vimeo, Wistia, and custom WordPress solutions).

## ✨ Core Features

### 1. 🔐 Secure Multi-Platform Connection
- **Source Connectors**: Instagram (Reels) and TikTok API integration
- **OAuth Authentication**: Secure token-based authentication
- **Multi-Account Support**: Connect multiple accounts for different clients
- **Destination Connectors**: Deep JW Player integration (Vimeo & Wistia coming soon)

### 2. 📥 Smart Content Ingestion & Metadata Mapping
- **Selective Import**: Browse and cherry-pick videos from social platforms
- **Automated Sync**: Auto-import new videos from connected profiles
- **Rich Metadata Extraction**:
  - Original captions and descriptions
  - Hashtags and tags
  - Post dates and engagement metrics
  - Thumbnails and cover images
  - Video dimensions and duration

### 3. 🎛️ Staging and Transformation Dashboard
- **Content Queue Management**: Track import and sync status
- **Metadata Editor**: 
  - Edit titles for SEO optimization
  - Add detailed descriptions and CTAs
  - Manage tags and categories
  - Upload custom thumbnails
- **Preview and Review**: See content before publishing

### 4. 🚀 Automated CMS Deployment
- **API-Driven Uploads**: Seamless video and metadata sync
- **Status Tracking**: Real-time sync status and error handling
- **Bulk Operations**: Process multiple videos simultaneously

## 🏗️ Technical Architecture

### Backend (Node.js/Express)
```
creator-bridge/backend/
├── server.js                 # Main server entry point
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── models/
│   ├── User.js              # User and platform connections
│   └── Content.js           # Video content and metadata
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── platforms.js         # Social platform connections
│   ├── content.js           # Content management
│   ├── destinations.js      # CMS integration
│   └── sync.js              # Sync operations
├── services/
│   ├── InstagramService.js  # Instagram API integration
│   ├── TikTokService.js     # TikTok API integration
│   ├── JWPlayerService.js   # JW Player API integration
│   └── ContentProcessor.js  # Video processing pipeline
└── middleware/
    └── auth.js              # JWT authentication
```

### Frontend (React/TypeScript)
```
creator-bridge/frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── stores/             # State management (Zustand)
│   ├── types/              # TypeScript definitions
│   └── utils/              # Helper functions
├── package.json
└── tailwind.config.js      # Styling configuration
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (for production)
- API credentials for:
  - Instagram Basic Display API
  - TikTok for Developers
  - JW Player API

### Backend Setup

1. **Clone and navigate to backend:**
   ```bash
   cd creator-bridge/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API credentials
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd creator-bridge/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 🔑 Environment Variables

### Backend (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/creator-bridge

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Instagram API
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/platforms/instagram/callback

# TikTok API
TIKTOK_CLIENT_ID=your-tiktok-client-id
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_REDIRECT_URI=http://localhost:5000/api/platforms/tiktok/callback

# JW Player API
JW_PLAYER_API_BASE_URL=https://api.jwplayer.com/v2
JW_PLAYER_UPLOAD_BASE_URL=https://upload.jwplatform.com

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=creator-bridge-temp-storage
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Platform Connections
- `GET /api/platforms/connections` - Get connected platforms
- `GET /api/platforms/instagram/connect` - Start Instagram OAuth
- `GET /api/platforms/tiktok/connect` - Start TikTok OAuth
- `DELETE /api/platforms/disconnect/:platform/:connectionId` - Disconnect platform

### Content Management
- `GET /api/content` - List user content with filters
- `GET /api/content/browse/:platform/:connectionId` - Browse platform content
- `POST /api/content/import` - Import selected videos
- `GET /api/content/:contentId` - Get specific content
- `PUT /api/content/:contentId/metadata` - Update content metadata
- `DELETE /api/content/:contentId` - Archive content

### Sync & Destinations
- `GET /api/destinations/connections` - Get CMS connections
- `POST /api/destinations/jwplayer/connect` - Connect JW Player
- `POST /api/sync/content/:contentId` - Sync content to CMS
- `GET /api/sync/status/:contentId` - Get sync status

## 🎨 UI/UX Features

### Modern Design System
- **Tailwind CSS** for consistent styling
- **Headless UI** for accessible components
- **Hero Icons** for consistent iconography
- **Custom color palette** optimized for content management

### Responsive Layout
- Mobile-first responsive design
- Optimized for desktop content management workflows
- Touch-friendly mobile interface for quick reviews

### Real-time Updates
- Live sync status tracking
- Real-time notifications
- Progress indicators for long-running operations

## 🔄 Content Processing Pipeline

1. **Discovery**: Browse content from connected social platforms
2. **Selection**: Choose specific videos to import
3. **Import**: Extract video files and metadata
4. **Processing**: Download and prepare content
5. **Staging**: Review and edit metadata in dashboard
6. **Sync**: Deploy to connected CMS platforms
7. **Monitoring**: Track sync status and handle errors

## 🚀 Deployment

### Production Considerations
- Use MongoDB Atlas for database
- Configure Redis for session management
- Set up AWS S3 for video storage
- Use PM2 for process management
- Configure nginx for reverse proxy
- Set up SSL certificates
- Configure monitoring and logging

### Docker Support
```bash
# Backend
docker build -t creator-bridge-backend ./backend
docker run -p 5000:5000 creator-bridge-backend

# Frontend
docker build -t creator-bridge-frontend ./frontend
docker run -p 3000:3000 creator-bridge-frontend
```

## 📈 Scalability Features

- **Queue System**: Background job processing for video imports
- **Rate Limiting**: API abuse prevention
- **Caching**: Redis for session and API response caching
- **CDN Integration**: Fast video delivery
- **Database Indexing**: Optimized queries for large datasets

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based auth
- **OAuth Integration**: Platform-native authentication
- **Rate Limiting**: DDoS protection
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@creator-bridge.com
- Documentation: https://docs.creator-bridge.com

---

**Creator Content Bridge** - Transforming social content into owned media assets. 🎬✨