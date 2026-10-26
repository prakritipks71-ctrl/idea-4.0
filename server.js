/**
 * AI Jyotish - Server
 *
 * Lightweight Node.js + Express backend.
 * Serves the mobile-first frontend from the /public directory.
 * Strictly adheres to PROJECT_RULES.md (no database, no PII logging, mock-ready).
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const { validateClientPayload, getReading } = require('./core/readingService');
const { createRateLimiter } = require('./core/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter for reading API: 25 requests per 10 minutes per IP
const readingRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: 'Too many reading requests. Please take a mindful pause and try again in a few minutes.'
});

// Middleware: Parse JSON and urlencoded data with safe limits (10mb for canvas-sanitized image)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicit intro video routes (streaming & range requests)
app.get(['/intro-video.mp4', '/VID_20261025_225353_193_bsl.mp4'], (req, res) => {
  const isIntro = req.path.includes('intro-video.mp4');
  const filename = isIntro ? 'intro-video.mp4' : 'VID_20261025_225353_193_bsl.mp4';
  const videoPath = fs.existsSync(path.join(__dirname, 'public', filename))
    ? path.join(__dirname, 'public', filename)
    : path.join(__dirname, filename);
  res.sendFile(videoPath);
});

// Health check endpoint (for monitoring and readiness checks)
app.get('/api/health', (req, res) => {
  // Safe telemetry: Only return general service status (Rule 5)
  res.json({
    status: 'ok',
    app: 'AI Jyotish',
    mode: process.env.GEMINI_API_KEY ? 'live' : 'mock',
    features: {
      astrology: true,
      palmistry: true,
      englishFirst: true,
      privacyEnforced: true,
      rateLimited: true
    }
  });
});

// Secure Reading Endpoint with rate limiting & input validation
app.post('/api/reading', readingRateLimiter, async (req, res) => {
  const startTime = Date.now();
  console.log('[event] reading_request_received');

  try {
    // 1. Validate inbound payload
    const validation = validateClientPayload(req.body);
    if (!validation.valid) {
      console.warn('[event] reading_request_validation_failed');
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid request payload.'
      });
    }

    // 2. Orchestrate reading (via Gemini API or fallback mock engine)
    const reading = await getReading(validation.data);

    // Rule 5 & 9: Log only timing and event name. NEVER log names, birthdays, places, or images.
    const durationMs = Date.now() - startTime;
    console.log(`[event] reading_request_completed duration_ms=${durationMs} provider=${reading?.meta?.provider || 'unknown'}`);

    return res.json({
      success: true,
      data: reading
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[event] reading_request_error duration_ms=${durationMs}`);
    // Rule 10: Never expose API keys or internal stack traces in error messages
    const safeError = err.message && !err.message.includes('key=') && !err.message.includes('GEMINI_API_KEY')
      ? err.message
      : 'Cosmic AI interpretation service is temporarily unavailable. Please try again.';
    return res.status(502).json({
      success: false,
      error: safeError
    });
  }
});

// Fallback to index.html for root or SPA navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  // Rule 5: Logs only contain event names and timings / port, no PII
  console.log(`[server_start] AI Jyotish running on http://localhost:${PORT}`);
});
