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

  describe('Witty Category Reports & Top Summary Tests', () => {
    it('1. Dating Mood On should generate romantic-focused witty report with 5 unique metrics', () => {
      const mock = generateMockReading({
        name: 'Zara',
        sunSign: 'Leo',
        lifePath: 3,
        cardFocus: 'dating_mood_on'
      });

      assert.ok(mock.summary);
      assert.equal(typeof mock.summary.score, 'number');
      assert.ok(mock.summary.score >= 70 && mock.summary.score <= 100);
      assert.ok(mock.summary.title.includes('Dating Mood'));
      assert.ok(mock.summary.label);
      assert.equal(mock.summary.metrics.length, 5);

      const metricLabels = mock.summary.metrics.map(m => m.label);
      assert.deepEqual(metricLabels, [
        'Communication',
        'Emotional Awareness',
        'Romantic Confidence',
        'Openness',
        'Growth Potential'
      ]);

      // 7 detailed sections
      const sec = mock.sections;
      assert.ok(sec.past && sec.past.length > 10);
      assert.ok(sec.present && sec.present.length > 10);
      assert.ok(sec.future && sec.future.length > 10);
      assert.ok(Array.isArray(sec.strengths) && sec.strengths.length >= 2);
      assert.ok(Array.isArray(sec.watchOutFor) && sec.watchOutFor.length >= 2);
      assert.ok(sec.nextMove && sec.nextMove.length > 10);
      assert.ok(sec.finalVerdict && sec.finalVerdict.length > 5);

      // Verify category content purity (focuses on romance/dating, no wealth/career predictions)
      const fullText = JSON.stringify(sec).toLowerCase();
      assert.ok(fullText.includes('romantic') || fullText.includes('dating') || fullText.includes('chemistry'));
      assert.ok(!fullText.includes('stock portfolio') && !fullText.includes('millionaire status'));
    });

    it('2. Bond Check should generate duo relationship report for two people with 5 distinct metrics', () => {
      const mock = generateMockReading({
        isTwoPerson: true,
        cardFocus: 'bond_check',
        person1: { name: 'Aarav', dob: '10/05/1996', sunSign: 'Taurus', lifePath: 4 },
        person2: { name: 'Diya', dob: '22/11/1998', sunSign: 'Scorpio', lifePath: 8 }
      });

      assert.ok(mock.summary);
      assert.ok(mock.summary.title.includes('Bond Check'));
      assert.equal(mock.summary.metrics.length, 5);

      const metricLabels = mock.summary.metrics.map(m => m.label);
      assert.deepEqual(metricLabels, [
        'Mutual Trust',
        'Vibe Synergy',
        'Communication Flow',
        'Shared Humor',
        'Conflict Resolution'
      ]);

      const sec = mock.sections;
      assert.ok(sec.past.includes('Aarav') && sec.past.includes('Diya'));
      assert.ok(sec.present.includes('Aarav') && sec.present.includes('Diya'));
      assert.ok(sec.future.includes('Aarav') && sec.future.includes('Diya'));
      assert.ok(sec.strengths.some(s => s.toLowerCase().includes('loyalty') || s.toLowerCase().includes('humor')));
      assert.ok(sec.finalVerdict);
    });

    it('3. Future Millionaire should focus strictly on career, work style & money habits without guaranteeing wealth', () => {
      const mock = generateMockReading({
        name: 'Kabir',
        sunSign: 'Capricorn',
        lifePath: 8,
        cardFocus: 'future_millionaire'
      });

      assert.ok(mock.summary);
      assert.ok(mock.summary.title.includes('Career & Wealth'));
      assert.equal(mock.summary.metrics.length, 5);

      const metricLabels = mock.summary.metrics.map(m => m.label);
      assert.deepEqual(metricLabels, [
        'Career Drive',
        'Money Mindfulness',
        'Skill Adaptability',
        'Strategic Focus',
        'Breakthrough Potential'
      ]);

      const sec = mock.sections;
      assert.ok(sec.past.includes('Kabir'));
      assert.ok(sec.present.includes('Kabir'));
      assert.ok(sec.future.includes('Kabir'));
      assert.ok(sec.nextMove.toLowerCase().includes('savings') || sec.nextMove.toLowerCase().includes('idea'));

      // Purity: no romance, never guarantees wealth
      const fullText = JSON.stringify(sec).toLowerCase();
      assert.ok(!fullText.includes('soulmate') && !fullText.includes('dating profile'));
      assert.ok(!fullText.includes('guaranteed millionaire') && !fullText.includes('guaranteed wealth'));
    });

    it('4. Karma Is Loading should focus on personal growth, habits, choices & lessons', () => {
      const mock = generateMockReading({
        name: 'Rhea',
        sunSign: 'Virgo',
        lifePath: 7,
        cardFocus: 'karma_is_loading'
      });

      assert.ok(mock.summary);
      assert.ok(mock.summary.title.includes('Karma'));
      assert.equal(mock.summary.metrics.length, 5);

      const metricLabels = mock.summary.metrics.map(m => m.label);
      assert.deepEqual(metricLabels, [
        'Self-Awareness',
        'Resilience',
        'Habit Discipline',
        'Emotional Balance',
        'Destiny Alignment'
      ]);

      const sec = mock.sections;
      assert.ok(sec.past.includes('Rhea'));
      assert.ok(sec.present.includes('Rhea'));
      assert.ok(sec.future.includes('Rhea'));
      assert.ok(sec.watchOutFor.some(w => w.toLowerCase().includes('trap') || w.toLowerCase().includes('procrastination')));

      // Purity: no romance, no career/wealth predictions
      const fullText = JSON.stringify(sec).toLowerCase();
      assert.ok(!fullText.includes('dating vibe') && !fullText.includes('stock market'));
    });

    it('5. Metrics must never be reused across all four cards (strictly disjoint)', () => {
      const p = { name: 'TestUser', dob: '01/01/2000', lifePath: 5 };
      const cats = ['dating_mood_on', 'bond_check', 'future_millionaire', 'karma_is_loading'];
      const seenLabels = new Set();

      cats.forEach(cat => {
        const mock = generateMockReading({ ...p, cardFocus: cat, isTwoPerson: cat === 'bond_check', person1: p, person2: p });
        assert.equal(mock.summary.metrics.length, 5);
        mock.summary.metrics.forEach(m => {
          assert.ok(!seenLabels.has(m.label), `Metric label "${m.label}" was reused across cards!`);
          seenLabels.add(m.label);
        });
      });

      // Total 20 distinct metrics across 4 cards
      assert.equal(seenLabels.size, 20);
    });

    it('6. HTML structure and JS configuration should enforce 2-person for Dating and Bond Check, and 1-person for Millionaire and Karma', () => {
      const fs = require('node:fs');
      const path = require('node:path');
      const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
      const js = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

      // Top summary card and 7 snappy cards in HTML
      assert.ok(html.includes('id="results-summary-card"'), 'Must have results-summary-card');
      assert.ok(html.includes('id="summary-category-title"'), 'Must have summary-category-title');
      assert.ok(html.includes('id="summary-vibe-score"'), 'Must have summary-vibe-score');
      assert.ok(html.includes('id="summary-vibe-label"'), 'Must have summary-vibe-label');
      assert.ok(html.includes('id="summary-metrics-list"'), 'Must have summary-metrics-list');
      assert.ok(html.includes('id="card-witty-past"'), 'Must have card-witty-past');
      assert.ok(html.includes('id="card-witty-present"'), 'Must have card-witty-present');
      assert.ok(html.includes('id="card-witty-future"'), 'Must have card-witty-future');
      assert.ok(html.includes('id="card-witty-strengths"'), 'Must have card-witty-strengths');
      assert.ok(html.includes('id="card-witty-watch-out"'), 'Must have card-witty-watch-out');
      assert.ok(html.includes('id="card-witty-next-move"'), 'Must have card-witty-next-move');
      assert.ok(html.includes('id="card-witty-verdict"'), 'Must have card-witty-verdict');

      // Verify CARD_FOCUS_META: dating_mood_on and bond_check are twoPerson: true, others are false
      assert.match(js, /dating_mood_on:\s*\{[^}]*isTwoPerson:\s*true/);
      assert.match(js, /future_millionaire:\s*\{[^}]*isTwoPerson:\s*false/);
      assert.match(js, /karma_is_loading:\s*\{[^}]*isTwoPerson:\s*false/);
      assert.match(js, /bond_check:\s*\{[^}]*isTwoPerson:\s*true/);

      // Verify no "Love is Calling" remains
      assert.ok(!html.toLowerCase().includes('love is calling'));
      assert.ok(!js.toLowerCase().includes('love_is_calling'));
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

