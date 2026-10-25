/**
 * Tests for Western (Tropical) Sun Sign ID Calculation
 * Uses Node.js built-in test runner (`node:test` and `node:assert/strict`).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const getSunSign = require('../core/rashi');

describe('Western (Tropical) Sun Sign - Boundary Tests', () => {

  describe('1. Pisces / Aries Boundary (March 20 / March 21)', () => {
    it('20 Mar should return pisces', () => {
      assert.equal(getSunSign(20, 3), 'pisces');
    });

    it('21 Mar should return aries', () => {
      assert.equal(getSunSign(21, 3), 'aries');
    });
  });

  describe('2. Aries / Taurus Boundary (April 19 / April 20)', () => {
    it('19 Apr should return aries', () => {
      assert.equal(getSunSign(19, 4), 'aries');
    });

    it('20 Apr should return taurus', () => {
      assert.equal(getSunSign(20, 4), 'taurus');
    });
  });

  describe('3. Taurus / Gemini Boundary (May 20 / May 21)', () => {
    it('20 May should return taurus', () => {
      assert.equal(getSunSign(20, 5), 'taurus');
    });

    it('21 May should return gemini', () => {
      assert.equal(getSunSign(21, 5), 'gemini');
    });
  });

  describe('4. Gemini / Cancer Boundary (June 20 / June 21)', () => {
    it('20 Jun should return gemini', () => {
      assert.equal(getSunSign(20, 6), 'gemini');
    });

    it('21 Jun should return cancer', () => {
      assert.equal(getSunSign(21, 6), 'cancer');
    });
  });

  describe('5. Cancer / Leo Boundary (July 22 / July 23)', () => {
    it('22 Jul should return cancer', () => {
      assert.equal(getSunSign(22, 7), 'cancer');
    });

    it('23 Jul should return leo', () => {
      assert.equal(getSunSign(23, 7), 'leo');
    });
  });

  describe('6. Leo / Virgo Boundary (August 22 / August 23)', () => {
    it('22 Aug should return leo', () => {
      assert.equal(getSunSign(22, 8), 'leo');
    });

    it('23 Aug should return virgo', () => {
      assert.equal(getSunSign(23, 8), 'virgo');
    });
  });

  describe('7. Virgo / Libra Boundary (September 22 / September 23)', () => {
    it('22 Sep should return virgo', () => {
      assert.equal(getSunSign(22, 9), 'virgo');
    });

    it('23 Sep should return libra', () => {
      assert.equal(getSunSign(23, 9), 'libra');
    });
  });

  describe('8. Libra / Scorpio Boundary (October 22 / October 23)', () => {
    it('22 Oct should return libra', () => {
      assert.equal(getSunSign(22, 10), 'libra');
    });

    it('23 Oct should return scorpio', () => {
      assert.equal(getSunSign(23, 10), 'scorpio');
    });
  });

  describe('9. Scorpio / Sagittarius Boundary (November 21 / November 22)', () => {
    it('21 Nov should return scorpio', () => {
      assert.equal(getSunSign(21, 11), 'scorpio');
    });

    it('22 Nov should return sagittarius', () => {
      assert.equal(getSunSign(22, 11), 'sagittarius');
    });
  });

  describe('10. Sagittarius / Capricorn Boundary (December 21 / December 22)', () => {
    it('21 Dec should return sagittarius', () => {
      assert.equal(getSunSign(21, 12), 'sagittarius');
    });

    it('22 Dec should return capricorn', () => {
      assert.equal(getSunSign(22, 12), 'capricorn');
    });
  });

  describe('11. Capricorn / Aquarius Boundary (January 19 / January 20)', () => {
    it('19 Jan should return capricorn', () => {
      assert.equal(getSunSign(19, 1), 'capricorn');
    });

    it('20 Jan should return aquarius', () => {
      assert.equal(getSunSign(20, 1), 'aquarius');
    });
  });

  describe('12. Aquarius / Pisces Boundary (February 18 / February 19)', () => {
    it('18 Feb should return aquarius', () => {
      assert.equal(getSunSign(18, 2), 'aquarius');
    });

    it('19 Feb should return pisces', () => {
      assert.equal(getSunSign(19, 2), 'pisces');
    });
  });

  describe('Additional Required Dates', () => {
    it('31 Dec should return capricorn', () => {
      assert.equal(getSunSign(31, 12), 'capricorn');
    });

    it('1 Jan should return capricorn', () => {
      assert.equal(getSunSign(1, 1), 'capricorn');
    });

    it('29 Feb 2008 (leap year) should return pisces', () => {
      assert.equal(getSunSign(29, 2, 2008), 'pisces');
    });

    it('29 Feb 2008 as Date object should return pisces', () => {
      const leapDate = new Date(2008, 1, 29); // Month index 1 is February
      assert.equal(getSunSign(leapDate), 'pisces');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should throw RangeError for invalid month (0 or 13)', () => {
      assert.throws(() => getSunSign(15, 0), RangeError);
      assert.throws(() => getSunSign(15, 13), RangeError);
    });

    it('should throw RangeError for invalid day (0 or 32)', () => {
      assert.throws(() => getSunSign(0, 5), RangeError);
      assert.throws(() => getSunSign(32, 5), RangeError);
    });

    it('should throw TypeError for non-numeric inputs', () => {
      assert.throws(() => getSunSign('abc', 'xyz'), TypeError);
    });
  });

});
