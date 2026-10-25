/**
 * Western (Tropical) Zodiac Date Table
 * 
 * -------------------------------------------------------------------------
 * Sign ID        Sign Name    Start Date     End Date
 * -------------------------------------------------------------------------
 * aries          Aries        March 21       April 19
 * taurus         Taurus       April 20       May 20
 * gemini         Gemini       May 21         June 20
 * cancer         Cancer       June 21        July 22
 * leo            Leo          July 23        August 22
 * virgo          Virgo        August 23      September 22
 * libra          Libra        September 23   October 22
 * scorpio        Scorpio      October 23     November 21
 * sagittarius    Sagittarius  November 22    December 21
 * capricorn      Capricorn    December 22    January 19 (wraps across year-end)
 * aquarius       Aquarius     January 20     February 18
 * pisces         Pisces       February 19    March 20
 * -------------------------------------------------------------------------
 */

const ZODIAC_DATE_TABLE = [
  { id: 'aries',       name: 'Aries',       startMonth: 3,  startDay: 21, endMonth: 4,  endDay: 19 },
  { id: 'taurus',      name: 'Taurus',      startMonth: 4,  startDay: 20, endMonth: 5,  endDay: 20 },
  { id: 'gemini',      name: 'Gemini',      startMonth: 5,  startDay: 21, endMonth: 6,  endDay: 20 },
  { id: 'cancer',      name: 'Cancer',      startMonth: 6,  startDay: 21, endMonth: 7,  endDay: 22 },
  { id: 'leo',         name: 'Leo',         startMonth: 7,  startDay: 23, endMonth: 8,  endDay: 22 },
  { id: 'virgo',       name: 'Virgo',       startMonth: 8,  startDay: 23, endMonth: 9,  endDay: 22 },
  { id: 'libra',       name: 'Libra',       startMonth: 9,  startDay: 23, endMonth: 10, endDay: 22 },
  { id: 'scorpio',     name: 'Scorpio',     startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { id: 'sagittarius', name: 'Sagittarius', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  { id: 'capricorn',   name: 'Capricorn',   startMonth: 12, startDay: 22, endMonth: 1,  endDay: 19 },
  { id: 'aquarius',    name: 'Aquarius',    startMonth: 1,  startDay: 20, endMonth: 2,  endDay: 18 },
  { id: 'pisces',      name: 'Pisces',      startMonth: 2,  startDay: 19, endMonth: 3,  endDay: 20 }
];

/**
 * Returns the western (tropical) sun sign id from day and month.
 *
 * @param {number|string|Date} day - Day of birth (1-31) or Date object
 * @param {number|string} [month] - Month of birth (1-12)
 * @param {number|string} [year] - Optional year (used for leap year context)
 * @returns {string} The lowercase western sun sign ID (e.g., 'aries', 'taurus', etc.)
 */
function getSunSign(day, month, year) {
  let d, m;

  if (day instanceof Date) {
    d = day.getDate();
    m = day.getMonth() + 1;
  } else {
    d = parseInt(day, 10);
    m = parseInt(month, 10);
  }

  if (isNaN(d) || isNaN(m)) {
    throw new TypeError(`Day and month must be valid numbers. Received day=${day}, month=${month}`);
  }

  if (m < 1 || m > 12) {
    throw new RangeError(`Month must be between 1 and 12. Received month=${m}`);
  }

  if (d < 1 || d > 31) {
    throw new RangeError(`Day must be between 1 and 31. Received day=${d}`);
  }

  for (const sign of ZODIAC_DATE_TABLE) {
    // Capricorn crosses year-end boundary (Dec 22 - Jan 19)
    if (sign.startMonth > sign.endMonth) {
      if ((m === sign.startMonth && d >= sign.startDay) || (m === sign.endMonth && d <= sign.endDay)) {
        return sign.id;
      }
    } else {
      if ((m === sign.startMonth && d >= sign.startDay) || (m === sign.endMonth && d <= sign.endDay)) {
        return sign.id;
      }
    }
  }

  throw new Error(`Unable to determine tropical sun sign for day=${d}, month=${m}`);
}

module.exports = getSunSign;
module.exports.getSunSign = getSunSign;
module.exports.getRashi = getSunSign;
module.exports.ZODIAC_DATE_TABLE = ZODIAC_DATE_TABLE;
