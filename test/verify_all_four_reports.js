const assert = require('node:assert/strict');
const { getReading } = require('../core/readingService');

require('dotenv').config();

async function testAllCardsPersonalization() {
  console.log('================================================================');
  console.log('PERSONALIZATION & 60-95 SCORING VERIFICATION ACROSS ALL FOUR CARDS');
  console.log('================================================================\n');

  function validateScoresAndMetrics(reading, cardName) {
    const score = reading?.summary?.score;
    assert.equal(typeof score, 'number', `${cardName} score must be a number`);
    assert.ok(score >= 60 && score <= 95, `${cardName} score (${score}) must be between 60 and 95 inclusive`);
    assert.notEqual(score, 100, `${cardName} score must never be 100`);

    const metrics = reading?.summary?.metrics;
    assert.ok(Array.isArray(metrics) && metrics.length === 5, `${cardName} must have 5 metrics`);
    metrics.forEach((m, idx) => {
      assert.equal(typeof m.value, 'number', `${cardName} metric ${idx} value must be a number`);
      assert.ok(m.value >= 60 && m.value <= 95, `${cardName} metric ${m.label} (${m.value}) must be between 60 and 95 inclusive`);
      assert.notEqual(m.value, 100, `${cardName} metric ${m.label} must never be 100`);
    });
  }

  // -------------------------------------------------------------------------
  // CARD 1: DATING MOOD ON (2 People)
  // -------------------------------------------------------------------------
  console.log('>>> [1/5] DATING MOOD ON');

  // Input Set A
  const datingA = await getReading({
    cardFocus: 'dating_mood_on',
    isTwoPerson: true,
    person1: { name: 'Kabir', dob: '1996-07-14', sunSign: 'Cancer', lifePath: 1, birthplace: 'Goa', birthTime: '19:30' },
    person2: { name: 'Tara', dob: '1998-02-18', sunSign: 'Aquarius', lifePath: 4, birthplace: 'Kolkata', birthTime: '12:15' }
  });

  // Input Set B
  const datingB = await getReading({
    cardFocus: 'dating_mood_on',
    isTwoPerson: true,
    person1: { name: 'Rohan', dob: '1995-08-20', sunSign: 'Leo', lifePath: 7, birthplace: 'Bangalore', birthTime: '11:00' },
    person2: { name: 'Ananya', dob: '1997-09-15', sunSign: 'Virgo', lifePath: 5, birthplace: 'Mumbai', birthTime: '08:45' }
  });

  console.log('--- Dating Mood On: Pair A (Kabir & Tara) ---');
  console.log('Score:', datingA.summary.score, 'Label:', datingA.summary.label);
  console.log('Past:', datingA.sections.past);
  console.log('Present:', datingA.sections.present);

  console.log('\n--- Dating Mood On: Pair B (Rohan & Ananya) ---');
  console.log('Score:', datingB.summary.score, 'Label:', datingB.summary.label);
  console.log('Past:', datingB.sections.past);
  console.log('Present:', datingB.sections.present);

  validateScoresAndMetrics(datingA, 'Dating A');
  validateScoresAndMetrics(datingB, 'Dating B');
  assert.notEqual(datingA.summary.score, datingB.summary.score, 'Dating scores must be different for different users!');
  assert.notEqual(datingA.sections.past, datingB.sections.past, 'Dating reports must be distinct!');
  assert.ok(datingA.sections.past.includes('Kabir') || datingA.sections.present.includes('Kabir'));
  assert.ok(datingA.sections.past.includes('Tara') || datingA.sections.present.includes('Tara'));
  assert.ok(datingB.sections.past.includes('Rohan') || datingB.sections.present.includes('Rohan'));
  assert.ok(datingB.sections.past.includes('Ananya') || datingB.sections.present.includes('Ananya'));
  assert.ok(!JSON.stringify(datingA).includes('abc') && !JSON.stringify(datingB).includes('abc'));
  assert.ok(!JSON.stringify(datingA).includes('xyz') && !JSON.stringify(datingB).includes('xyz'));
  console.log('✓ Dating Mood On personalization and 60-95 score bounds verified!\n');

  // -------------------------------------------------------------------------
  // CARD 2: BOND CHECK (2 People)
  // -------------------------------------------------------------------------
  console.log('>>> [2/5] BOND CHECK');

  // Input Set A
  const bondA = await getReading({
    cardFocus: 'bond_check',
    isTwoPerson: true,
    person1: { name: 'Aman', dob: '1994-03-10', sunSign: 'Pisces', lifePath: 9, birthplace: 'Delhi', birthTime: '15:20' },
    person2: { name: 'Pooja', dob: '1996-12-05', sunSign: 'Sagittarius', lifePath: 6, birthplace: 'Shimla', birthTime: '07:15' }
  });

  // Input Set B
  const bondB = await getReading({
    cardFocus: 'bond_check',
    isTwoPerson: true,
    person1: { name: 'Sameer', dob: '1993-05-04', sunSign: 'Taurus', lifePath: 4, birthplace: 'Chennai', birthTime: '18:00' },
    person2: { name: 'Vikram', dob: '1995-04-12', sunSign: 'Aries', lifePath: 9, birthplace: 'Pune', birthTime: '09:30' }
  });

  console.log('--- Bond Check: Pair A (Aman & Pooja) ---');
  console.log('Score:', bondA.summary.score, 'Label:', bondA.summary.label);
  console.log('Past:', bondA.sections.past);
  console.log('Present:', bondA.sections.present);

  console.log('\n--- Bond Check: Pair B (Sameer & Vikram) ---');
  console.log('Score:', bondB.summary.score, 'Label:', bondB.summary.label);
  console.log('Past:', bondB.sections.past);
  console.log('Present:', bondB.sections.present);

  validateScoresAndMetrics(bondA, 'Bond A');
  validateScoresAndMetrics(bondB, 'Bond B');
  assert.notEqual(bondA.summary.score, bondB.summary.score, 'Bond Check scores must be different for different users!');
  assert.notEqual(bondA.sections.past, bondB.sections.past, 'Bond Check reports must be distinct!');
  assert.ok(bondA.sections.past.includes('Aman') || bondA.sections.present.includes('Aman'));
  assert.ok(bondA.sections.past.includes('Pooja') || bondA.sections.present.includes('Pooja'));
  assert.ok(bondB.sections.past.includes('Sameer') || bondB.sections.present.includes('Sameer'));
  assert.ok(bondB.sections.past.includes('Vikram') || bondB.sections.present.includes('Vikram'));
  assert.ok(!JSON.stringify(bondA).includes('abc') && !JSON.stringify(bondB).includes('abc'));
  assert.ok(!JSON.stringify(bondA).includes('xyz') && !JSON.stringify(bondB).includes('xyz'));
  console.log('✓ Bond Check personalization and 60-95 score bounds verified!\n');

  // -------------------------------------------------------------------------
  // CARD 3: FUTURE MILLIONAIRE (1 Person)
  // -------------------------------------------------------------------------
  console.log('>>> [3/5] FUTURE MILLIONAIRE');

  // Input Set A
  const milA = await getReading({
    cardFocus: 'future_millionaire',
    isTwoPerson: false,
    name: 'Aarav Patel',
    dob: '1995-10-14',
    sunSign: 'Libra',
    lifePath: 3,
    birthplace: 'Jaipur',
    birthTime: '14:30'
  });

  // Input Set B
  const milB = await getReading({
    cardFocus: 'future_millionaire',
    isTwoPerson: false,
    name: 'Dev Singhania',
    dob: '1992-11-08',
    sunSign: 'Scorpio',
    lifePath: 8,
    birthplace: 'Hyderabad',
    birthTime: '06:15'
  });

  console.log('--- Future Millionaire: Person A (Aarav) ---');
  console.log('Score:', milA.summary.score, 'Label:', milA.summary.label);
  console.log('Past:', milA.sections.past);

  console.log('\n--- Future Millionaire: Person B (Dev) ---');
  console.log('Score:', milB.summary.score, 'Label:', milB.summary.label);
  console.log('Past:', milB.sections.past);

  validateScoresAndMetrics(milA, 'Millionaire A');
  validateScoresAndMetrics(milB, 'Millionaire B');
  assert.notEqual(milA.summary.score, milB.summary.score, 'Future Millionaire scores must be different for different users!');
  assert.notEqual(milA.sections.past, milB.sections.past, 'Millionaire reports must be distinct!');
  assert.ok(milA.sections.past.includes('Aarav') || milA.sections.present.includes('Aarav'));
  assert.ok(milB.sections.past.includes('Dev') || milB.sections.present.includes('Dev'));
  assert.ok(!JSON.stringify(milA).includes('abc') && !JSON.stringify(milB).includes('abc'));
  console.log('✓ Future Millionaire personalization and 60-95 score bounds verified!\n');

  // -------------------------------------------------------------------------
  // CARD 4: KARMA IS LOADING (1 Person)
  // -------------------------------------------------------------------------
  console.log('>>> [4/5] KARMA IS LOADING');

  // Input Set A
  const karmaA = await getReading({
    cardFocus: 'karma_is_loading',
    isTwoPerson: false,
    name: 'Prakriti Sharma',
    dob: '1998-06-12',
    sunSign: 'Gemini',
    lifePath: 9,
    birthplace: 'Varanasi',
    birthTime: '09:00'
  });

  // Input Set B
  const karmaB = await getReading({
    cardFocus: 'karma_is_loading',
    isTwoPerson: false,
    name: 'Siddharth Verma',
    dob: '1993-01-05',
    sunSign: 'Capricorn',
    lifePath: 4,
    birthplace: 'Chandigarh',
    birthTime: '22:45'
  });

  console.log('--- Karma Is Loading: Person A (Prakriti) ---');
  console.log('Score:', karmaA.summary.score, 'Label:', karmaA.summary.label);
  console.log('Past:', karmaA.sections.past);

  console.log('\n--- Karma Is Loading: Person B (Siddharth) ---');
  console.log('Score:', karmaB.summary.score, 'Label:', karmaB.summary.label);
  console.log('Past:', karmaB.sections.past);

  validateScoresAndMetrics(karmaA, 'Karma A');
  validateScoresAndMetrics(karmaB, 'Karma B');
  assert.notEqual(karmaA.summary.score, karmaB.summary.score, 'Karma Is Loading scores must be different for different users!');
  assert.notEqual(karmaA.sections.past, karmaB.sections.past, 'Karma reports must be distinct!');
  assert.ok(karmaA.sections.past.includes('Prakriti') || karmaA.sections.present.includes('Prakriti'));
  assert.ok(karmaB.sections.past.includes('Siddharth') || karmaB.sections.present.includes('Siddharth'));
  assert.ok(!JSON.stringify(karmaA).includes('abc') && !JSON.stringify(karmaB).includes('abc'));
  console.log('✓ Karma Is Loading personalization and 60-95 score bounds verified!\n');

  // -------------------------------------------------------------------------
  // SECTION 5: SIMULTANEOUS CONCURRENT REQUESTS (NO DATA MIXING & INDEPENDENT SCORES)
  // -------------------------------------------------------------------------
  console.log('>>> [5/5] SIMULTANEOUS REQUESTS TEST ACROSS ALL 4 CARDS');

  const concurrentPromises = [
    getReading({
      cardFocus: 'dating_mood_on',
      isTwoPerson: true,
      person1: { name: 'Kabir', dob: '1996-07-14', sunSign: 'Cancer', lifePath: 1, birthplace: 'Goa', birthTime: '19:30' },
      person2: { name: 'Tara', dob: '1998-02-18', sunSign: 'Aquarius', lifePath: 4, birthplace: 'Kolkata', birthTime: '12:15' }
    }),
    getReading({
      cardFocus: 'bond_check',
      isTwoPerson: true,
      person1: { name: 'Aman', dob: '1994-03-10', sunSign: 'Pisces', lifePath: 9, birthplace: 'Delhi', birthTime: '15:20' },
      person2: { name: 'Pooja', dob: '1996-12-05', sunSign: 'Sagittarius', lifePath: 6, birthplace: 'Shimla', birthTime: '07:15' }
    }),
    getReading({
      cardFocus: 'future_millionaire',
      isTwoPerson: false,
      name: 'Aarav Patel',
      dob: '1995-10-14',
      sunSign: 'Libra',
      lifePath: 3,
      birthplace: 'Jaipur',
      birthTime: '14:30'
    }),
    getReading({
      cardFocus: 'karma_is_loading',
      isTwoPerson: false,
      name: 'Prakriti Sharma',
      dob: '1998-06-12',
      sunSign: 'Gemini',
      lifePath: 9,
      birthplace: 'Varanasi',
      birthTime: '09:00'
    })
  ];

  const concurrentResults = await Promise.all(concurrentPromises);
  const [c1, c2, c3, c4] = concurrentResults;

  validateScoresAndMetrics(c1, 'Concurrent Dating');
  validateScoresAndMetrics(c2, 'Concurrent Bond');
  validateScoresAndMetrics(c3, 'Concurrent Millionaire');
  validateScoresAndMetrics(c4, 'Concurrent Karma');

  // Verify no data was mixed between simultaneous calls
  assert.ok(c1.sections.past.includes('Kabir') || c1.sections.past.includes('Tara'), 'Concurrent C1 must have Kabir/Tara');
  assert.ok(c2.sections.past.includes('Aman') || c2.sections.past.includes('Pooja'), 'Concurrent C2 must have Aman/Pooja');
  assert.ok(c3.sections.past.includes('Aarav'), 'Concurrent C3 must have Aarav');
  assert.ok(c4.sections.past.includes('Prakriti'), 'Concurrent C4 must have Prakriti');

  console.log('Scores across concurrent requests:', [c1.summary.score, c2.summary.score, c3.summary.score, c4.summary.score]);
  console.log('✓ Simultaneous requests executed cleanly without data mixing!\n');

  console.log('================================================================');
  console.log('ALL FOUR CARDS PASSED PERSONALIZATION, 60-95 BOUNDS, AND CONCURRENCY TESTS!');
  console.log('================================================================');
}

testAllCardsPersonalization().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
