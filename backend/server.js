require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { importCSV } = require('./src/controllers/importController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection
app.use(cors());

// Parse JSON and urlencoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Multer memory storage for parsing CSV files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit files to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Basic CSV check
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// Import route
app.post('/api/import', upload.single('file'), importCSV);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.AI_PROVIDER || 'gemini'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Configured AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
});
