const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// --- Middlewares ---

// Enable CORS for all routes
app.use(cors());

// Set various HTTP headers for security
app.use(helmet());

// Parse incoming JSON requests
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- API Routes ---
// TODO: Add application routes here
// app.use('/api/v1/auth', require('./routes/authRoutes'));
// app.use('/api/v1/content', require('./routes/contentRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Creator Bridge API is running.' });
});

// --- Server Initialization ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});