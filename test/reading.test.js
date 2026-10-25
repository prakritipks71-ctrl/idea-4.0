/**
 * Tests for Reading Service, Structured JSON Schema Validation, and Rate Limiting
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateClientPayload,
  validateReadingResult,
  generateMockReading,
  formatTimeBucket,
  REQUIRED_SECTIONS
} = require('../core/readingService');
const { createRateLimiter } = require('../core/rateLimiter');

describe('Reading Service Unit Tests', () => {

  describe('Client Payload Validation', () => {
    it('should validate valid client payloads with name, dob, and palm details', () => {
      const payload = {
        name: 'Maya',
        dob: '15/08/1998',
        sunSign: 'Leo',
        lifePath: 5,
        birthplace: 'London',
        timeBucket: 'morning',
        isDemoPalm: true
      };
      const result = validateClientPayload(payload);
      assert.equal(result.valid, true);
      assert.equal(result.data.name, 'Maya');
      assert.equal(result.data.dob, '15/08/1998');
      assert.equal(result.data.sunSign, 'Leo');
      assert.equal(result.data.lifePath, 5);
      assert.equal(result.data.timeBucket, 'morning');
      assert.equal(result.data.isDemoPalm, true);
    });

    it('should automatically derive sunSign and lifePath from dob if not explicitly supplied', () => {
      const payload = {
        name: 'Julian',
        dob: '21/03/1995'
      };
      const result = validateClientPayload(payload);
      assert.equal(result.valid, true);
      assert.equal(result.data.name, 'Julian');
      assert.equal(result.data.sunSign.toLowerCase(), 'aries');
      assert.equal(typeof result.data.lifePath, 'number');
    });

    it('should sanitize HTML tags from name and birthplace to prevent XSS', () => {
      const payload = {
        name: '<script>alert("hack")</script>Alex',
        dob: '10/10/2000',
        birthplace: '<b>New York</b>'
      };
      const result = validateClientPayload(payload);
      assert.equal(result.valid, true);
      assert.ok(!result.data.name.includes('<'));
      assert.ok(!result.data.birthplace.includes('<'));
    });

    it('should reject invalid non-object payload', () => {
      const result = validateClientPayload(null);
      assert.equal(result.valid, false);
    });
  });

  describe('Time Bucket Formatting', () => {
    it('should map standard keys to English descriptors', () => {
      assert.equal(formatTimeBucket('morning'), 'Morning');
      assert.equal(formatTimeBucket('afternoon'), 'Afternoon');
      assert.equal(formatTimeBucket('evening'), 'Evening');
      assert.equal(formatTimeBucket('night'), 'Night');
      assert.equal(formatTimeBucket('unknown'), 'Unknown');
    });
  });

  describe('Mock Reading Generation & Schema Adherence', () => {
    it('should generate structured JSON with all 6 required reflection sections', () => {
      const mock = generateMockReading({
        name: 'Elena',
        sunSign: 'Pisces',
        lifePath: 9,
        birthplace: 'Tokyo',
        timeBucket: 'evening'
      });

      assert.ok(mock);
      assert.equal(mock.archetype.zodiacSign, 'Pisces');
      assert.equal(mock.archetype.lifePathNumber, 9);
      assert.ok(Array.isArray(mock.palmHighlights));
      assert.equal(mock.palmHighlights.length, 3);

      // 1. Personality reflection
      assert.ok(mock.personalityReflection.title);
      assert.ok(mock.personalityReflection.summary.includes('Elena'));
      assert.ok(Array.isArray(mock.personalityReflection.traits));

      // 2. Strengths and areas for growth
      assert.ok(mock.strengthsAndGrowth.title);
      assert.ok(mock.strengthsAndGrowth.coreStrengths);
      assert.ok(mock.strengthsAndGrowth.areasForGrowth);

      // 3. Career and learning reflections
      assert.ok(mock.careerAndLearning.title);
      assert.ok(mock.careerAndLearning.summary);
      assert.ok(mock.careerAndLearning.idealEnvironments);
      assert.ok(mock.careerAndLearning.learningStyle);

      // 4. Relationships and communication reflections
      assert.ok(mock.relationshipsAndCommunication.title);
      assert.ok(mock.relationshipsAndCommunication.summary);
      assert.ok(mock.relationshipsAndCommunication.communicationStyle);
      assert.ok(mock.relationshipsAndCommunication.connectionTip);

      // 5. General future possibilities
      assert.ok(mock.futurePossibilities.title);
      assert.ok(mock.futurePossibilities.summary);
      assert.ok(Array.isArray(mock.futurePossibilities.upcomingThemes));

      // 6. Positive, practical suggestions
      assert.ok(mock.practicalSuggestions.title);
      assert.ok(Array.isArray(mock.practicalSuggestions.dailyPractices));
      assert.ok(mock.practicalSuggestions.reflectionPrompt);
      assert.ok(mock.practicalSuggestions.cosmicAffirmation);

      // Verify overall schema validator
      assert.equal(validateReadingResult(mock), true);
    });

    it('should validateReadingResult return false for incomplete objects', () => {
      assert.equal(validateReadingResult(null), false);
      assert.equal(validateReadingResult({}), false);
      assert.equal(validateReadingResult({ archetype: {}, palmHighlights: [] }), false);
    });
  });

  describe('Rate Limiter Abuse Protection', () => {
    it('should allow requests within threshold and block when exceeded', () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Rate limit exceeded'
      });

      const mockReq = { headers: {}, socket: { remoteAddress: '192.168.1.100' } };
      let statusCalled = null;
      let jsonCalled = null;
      let nextCount = 0;

      const mockRes = {
        setHeader: () => {},
        status: (code) => {
          statusCalled = code;
          return {
            json: (payload) => { jsonCalled = payload; }
          };
        }
      };

      const next = () => { nextCount++; };

      // Requests 1, 2, 3 should proceed
      limiter(mockReq, mockRes, next);
      limiter(mockReq, mockRes, next);
      limiter(mockReq, mockRes, next);
      assert.equal(nextCount, 3);
      assert.equal(statusCalled, null);

      // Request 4 should be rate limited with HTTP 429
      limiter(mockReq, mockRes, next);
      assert.equal(nextCount, 3);
      assert.equal(statusCalled, 429);
      assert.equal(jsonCalled.success, false);
      assert.match(jsonCalled.error, /Rate limit/i);
    });
  });

});
