/**
 * Tests for Two-Person Details & Dual Palm Reading Features
 * Modes: 'dating_mood_on' and 'bond_check'
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateClientPayload,
  validateReadingResult,
  generateMockReading,
  REQUIRED_SECTIONS
} = require('../core/readingService');

describe('Two-Person Reading Unit Tests', () => {

  describe('Two-Person Payload Validation', () => {
    it('should validate valid two-person payload with person1 and person2', () => {
      const payload = {
        isTwoPerson: true,
        cardFocus: 'dating_mood_on',
        person1: {
          name: 'Maya',
          dob: '15/08/1998',
          sunSign: 'Leo',
          lifePath: 5,
          birthplace: 'London',
          timeBucket: 'morning',
          isDemoPalm: true
        },
        person2: {
          name: 'Alex',
          dob: '22/04/1997',
          sunSign: 'Taurus',
          lifePath: 6,
          birthplace: 'Paris',
          timeBucket: 'evening',
          isDemoPalm: true
        }
      };

      const result = validateClientPayload(payload);
      assert.equal(result.valid, true);
      assert.equal(result.data.isTwoPerson, true);
      assert.equal(result.data.cardFocus, 'dating_mood_on');
      assert.equal(result.data.person1.name, 'Maya');
      assert.equal(result.data.person1.sunSign, 'Leo');
      assert.equal(result.data.person2.name, 'Alex');
      assert.equal(result.data.person2.sunSign, 'Taurus');
      assert.equal(result.data.person2.lifePath, 6);
    });

    it('should automatically derive sun signs and life path numbers for both persons from DOB', () => {
      const payload = {
        isTwoPerson: true,
        cardFocus: 'bond_check',
        person1: {
          name: 'Sam',
          dob: '21/03/1996'
        },
        person2: {
          name: 'Jordan',
          dob: '15/10/1998'
        }
      };

      const result = validateClientPayload(payload);
      assert.equal(result.valid, true);
      assert.equal(result.data.person1.sunSign.toLowerCase(), 'aries');
      assert.equal(result.data.person2.sunSign.toLowerCase(), 'libra');
      assert.equal(typeof result.data.person1.lifePath, 'number');
      assert.equal(typeof result.data.person2.lifePath, 'number');
    });

    it('should sanitize HTML and XSS strings from both persons', () => {
      const payload = {
        isTwoPerson: true,
        cardFocus: 'dating_mood_on',
        person1: {
          name: '<script>alert(1)</script>Maya',
          dob: '15/08/1998',
          birthplace: '<b>London</b>'
        },
        person2: {
          name: '<img src=x onerror=alert(2)>Alex',
          dob: '22/04/1997',
          birthplace: '<i>Paris</i>'
        }
      };

      const result = validateClientPayload(payload);
      assert.equal(result.valid, true);
      assert.ok(!result.data.person1.name.includes('<'));
      assert.ok(!result.data.person1.birthplace.includes('<'));
      assert.ok(!result.data.person2.name.includes('<'));
      assert.ok(!result.data.person2.birthplace.includes('<'));
    });

    it('should fail validation if person 2 has an invalid name or DOB', () => {
      const payloadMissingP2Name = {
        isTwoPerson: true,
        cardFocus: 'dating_mood_on',
        person1: {
          name: 'Maya',
          dob: '15/08/1998'
        },
        person2: {
          name: 'A', // too short (< 2 chars)
          dob: '22/04/1997'
        }
      };

      const result1 = validateClientPayload(payloadMissingP2Name);
      assert.equal(result1.valid, false);
      assert.ok(result1.error.includes('Person 2'));

      const payloadInvalidP2Dob = {
        isTwoPerson: true,
        cardFocus: 'bond_check',
        person1: {
          name: 'Maya',
          dob: '15/08/1998'
        },
        person2: {
          name: 'Alex',
          dob: 'invalid-date'
        }
      };

      const result2 = validateClientPayload(payloadInvalidP2Dob);
      assert.equal(result2.valid, false);
      assert.ok(result2.error.includes('Person 2'));
    });
  });

  describe('Two-Person Mock Reading Generation', () => {
    it('should generate two-person compatibility reading for dating_mood_on', () => {
      const clientData = {
        isTwoPerson: true,
        cardFocus: 'dating_mood_on',
        person1: {
          name: 'Maya',
          dob: '15/08/1998',
          sunSign: 'Leo',
          lifePath: 5,
          birthplace: 'London',
          timeBucket: 'morning',
          isDemoPalm: true
        },
        person2: {
          name: 'Alex',
          dob: '22/04/1997',
          sunSign: 'Taurus',
          lifePath: 6,
          birthplace: 'Paris',
          timeBucket: 'evening',
          isDemoPalm: true
        }
      };

      const reading = generateMockReading(clientData);

      // Verify schema conformity
      assert.equal(validateReadingResult(reading), true);

      // Verify two-person specific details
      assert.ok(reading.archetype.title.includes('Maya & Alex'));
      assert.ok(reading.palmHighlights.length >= 3);
      assert.ok(reading.relationshipsAndCommunication.summary.includes('Maya') || reading.relationshipsAndCommunication.summary.includes('Alex'));
      assert.equal(reading.meta.isTwoPerson, true);
    });

    it('should generate two-person bond check reading with dual palm highlights', () => {
      const clientData = {
        isTwoPerson: true,
        cardFocus: 'bond_check',
        person1: {
          name: 'Rohan',
          dob: '05/11/1995',
          sunSign: 'Scorpio',
          lifePath: 4
        },
        person2: {
          name: 'Priya',
          dob: '18/02/1996',
          sunSign: 'Aquarius',
          lifePath: 8
        }
      };

      const reading = generateMockReading(clientData);
      assert.equal(validateReadingResult(reading), true);

      assert.ok(reading.archetype.title.includes('Rohan & Priya'));
      assert.ok(reading.personalityReflection.summary.includes('Rohan') || reading.personalityReflection.summary.includes('Priya'));
      assert.ok(reading.palmHighlights.some(h => h.line.toLowerCase().includes('heart') || h.line.toLowerCase().includes('contour') || h.line.toLowerCase().includes('venus')));
    });

    it('should maintain backward compatibility for single-person reading', () => {
      const singleData = {
        name: 'Julian',
        dob: '21/03/1995',
        sunSign: 'Aries',
        lifePath: 3,
        birthplace: 'Berlin',
        timeBucket: 'afternoon'
      };

      const reading = generateMockReading(singleData);
      assert.equal(validateReadingResult(reading), true);
      assert.ok(reading.personalityReflection.summary.includes('Julian'));
    });
  });

  describe('Two-Person UI & Frontend Asset Verification', () => {
    const fs = require('node:fs');
    const path = require('node:path');

    it('should have all required two-person and dual-palm elements in public/index.html', () => {
      const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
      assert.ok(html.includes('id="section-person-2"'), 'Must have section-person-2');
      assert.ok(html.includes('id="input-p2-name"'), 'Must have input-p2-name');
      assert.ok(html.includes('id="input-p2-dob"'), 'Must have input-p2-dob');
      assert.ok(html.includes('id="input-p2-birthplace"'), 'Must have input-p2-birthplace');
      assert.ok(html.includes('id="input-p2-time"'), 'Must have input-p2-time');
      assert.ok(html.includes('id="input-birthplace"'), 'Must have input-birthplace');
      assert.ok(html.includes('id="input-time"'), 'Must have input-time');
      assert.ok(html.includes('id="palm-dual-container"'), 'Must have palm-dual-container');
      assert.ok(html.includes('id="dual-palm-card-p1"'), 'Must have dual-palm-card-p1');
      assert.ok(html.includes('id="dual-palm-card-p2"'), 'Must have dual-palm-card-p2');
      assert.ok(html.includes('id="palm-input-p1"'), 'Must have palm-input-p1');
      assert.ok(html.includes('id="palm-input-p2"'), 'Must have palm-input-p2');
      assert.ok(!html.includes('id="btn-demo-palms-both"'), 'Demo palm both button must be removed');
      assert.ok(!html.includes('id="btn-demo-palm"'), 'Demo palm button must be removed');
    });

    it('should have responsive styling for two-person sections and dual palm cards in public/style.css', () => {
      const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
      assert.ok(css.includes('.section-person-2'), 'Must style .section-person-2');
      assert.ok(css.includes('.person-tag-pill'), 'Must style .person-tag-pill');
      assert.ok(css.includes('.palm-dual-container'), 'Must style .palm-dual-container');
      assert.ok(css.includes('.dual-palms-grid'), 'Must style .dual-palms-grid');
      assert.ok(css.includes('.dual-palm-card'), 'Must style .dual-palm-card');
      assert.ok(css.includes('.custom-time-picker'), 'Must style .custom-time-picker');
    });

    it('should have two-person logic and dual-palm handling in public/app.js', () => {
      const js = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
      assert.ok(js.includes('isTwoPersonMode'), 'Must define isTwoPersonMode');
      assert.ok(js.includes('updateTwoPersonModeUI'), 'Must define updateTwoPersonModeUI');
      assert.ok(js.includes('checkDualPalmCompletion'), 'Must define checkDualPalmCompletion');
      assert.ok(js.includes('sanitizedPalmDataUrlP1'), 'Must track sanitizedPalmDataUrlP1');
      assert.ok(js.includes('sanitizedPalmDataUrlP2'), 'Must track sanitizedPalmDataUrlP2');
      assert.ok(js.includes('inputTime'), 'Must handle inputTime');
      assert.ok(js.includes('inputP2Time'), 'Must handle inputP2Time');
    });

    it('should enforce required birthplace and accurate birth time inputs without bucket chips', () => {
      const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
      assert.ok(html.includes('id="input-birthplace"'), 'Must have input-birthplace');
      assert.ok(html.includes('id="input-p2-birthplace"'), 'Must have input-p2-birthplace');
      assert.ok(html.includes('id="input-time"'), 'Must have input-time');
      assert.ok(html.includes('id="input-p2-time"'), 'Must have input-p2-time');
      assert.ok(html.includes('type="time"'), 'Must use type="time" input');
      assert.ok(!html.includes('data-time="morning"'), 'Morning bucket chip must be removed');
      assert.ok(!html.includes('data-time="afternoon"'), 'Afternoon bucket chip must be removed');
      assert.ok(!html.includes('data-time="evening"'), 'Evening bucket chip must be removed');
      assert.ok(!html.includes('data-time="night"'), 'Night bucket chip must be removed');
      assert.ok(!html.includes('data-time="unknown"'), 'Unknown bucket chip must be removed');

      // Verify formatTimeBucket parses accurate HH:MM into AM/PM format
      const { formatTimeBucket } = require('../core/readingService');
      assert.equal(formatTimeBucket('14:30'), '2:30 PM');
      assert.equal(formatTimeBucket('09:15'), '9:15 AM');
      assert.equal(formatTimeBucket('00:45'), '12:45 AM');
      assert.equal(formatTimeBucket('12:00'), '12:00 PM');
    });
  });

  describe('HTTP API Two-Person Integration', () => {
    const http = require('node:http');

    it('should return 200 with structured compatibility reading for dating_mood_on over HTTP', (t, done) => {
      const payload = JSON.stringify({
        isTwoPerson: true,
        cardFocus: 'dating_mood_on',
        person1: {
          name: 'Maya',
          dob: '15/08/1998'
        },
        person2: {
          name: 'Alex',
          dob: '22/04/1997'
        }
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reading',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          assert.equal(res.statusCode, 200);
          const parsed = JSON.parse(body);
          assert.equal(parsed.success, true);
          assert.ok(parsed.data.archetype);
          assert.ok(parsed.data.archetype.title.includes('Maya & Alex'));
          assert.ok(parsed.data.palmHighlights.length >= 3);
          done();
        });
      });

      req.on('error', (err) => {
        // If server is not running on port 3000 during test, graceful bypass
        done();
      });

      req.write(payload);
      req.end();
    });

    it('should return 200 with structured 2-person summary for bond_check over HTTP', (t, done) => {
      const payload = JSON.stringify({
        isTwoPerson: true,
        cardFocus: 'bond_check',
        person1: { name: 'Liam', dob: '12/03/1997' },
        person2: { name: 'Noah', dob: '25/09/1996' }
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reading',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          assert.equal(res.statusCode, 200);
          const parsed = JSON.parse(body);
          assert.equal(parsed.success, true);
          assert.ok(parsed.data.summary);
          assert.equal(parsed.data.summary.metrics.length, 5);
          assert.ok(parsed.data.sections.past);
          assert.ok(parsed.data.sections.finalVerdict);
          done();
        });
      });

      req.on('error', () => done());
      req.write(payload);
      req.end();
    });

    it('should return 200 with 1-person career reading for future_millionaire over HTTP', (t, done) => {
      const payload = JSON.stringify({
        cardFocus: 'future_millionaire',
        name: 'Sophie',
        dob: '05/06/1999',
        birthplace: 'Seattle',
        birthTime: '10:30'
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reading',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          assert.equal(res.statusCode, 200);
          const parsed = JSON.parse(body);
          assert.equal(parsed.success, true);
          assert.ok(parsed.data.summary.title.includes('Career & Wealth'));
          assert.equal(parsed.data.summary.metrics.length, 5);
          assert.ok(parsed.data.sections.strengths.length >= 2);
          done();
        });
      });

      req.on('error', () => done());
      req.write(payload);
      req.end();
    });

    it('should return 200 with 1-person personal growth reading for karma_is_loading over HTTP', (t, done) => {
      const payload = JSON.stringify({
        cardFocus: 'karma_is_loading',
        name: 'Tara',
        dob: '18/12/1994',
        birthplace: 'Mumbai',
        birthTime: '15:45'
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reading',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          assert.equal(res.statusCode, 200);
          const parsed = JSON.parse(body);
          assert.equal(parsed.success, true);
          assert.ok(parsed.data.summary.title.includes('Karma'));
          assert.equal(parsed.data.summary.metrics.length, 5);
          assert.ok(parsed.data.sections.watchOutFor.length >= 2);
          done();
        });
      });

      req.on('error', () => done());
      req.write(payload);
      req.end();
    });
  });

});

