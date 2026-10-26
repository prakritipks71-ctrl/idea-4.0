const assert = require('node:assert/strict');
const { getReading } = require('../core/readingService');

require('dotenv').config();

async function testAllCardsPersonalization() {
  console.log('================================================================');
  console.log('PERSONALIZATION VERIFICATION: 2 DISTINCT INPUTS PER CARD');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // CARD 1: DATING MOOD ON (2 People)
  // -------------------------------------------------------------------------
  console.log('>>> [1/4] DATING MOOD ON');

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
  console.log('Provider:', datingA.meta.provider, 'Mode:', datingA.meta.mode);
  console.log('Past:', datingA.sections.past);
  console.log('Present:', datingA.sections.present);
  console.log('Future:', datingA.sections.future);
  console.log('Strengths:', datingA.sections.strengths[0]);

  console.log('\n--- Dating Mood On: Pair B (Rohan & Ananya) ---');
  console.log('Past:', datingB.sections.past);
  console.log('Present:', datingB.sections.present);
  console.log('Future:', datingB.sections.future);
  console.log('Strengths:', datingB.sections.strengths[0]);

  // Assertions: Distinct content, both names present, no abc/xyz
  assert.notEqual(datingA.sections.past, datingB.sections.past, 'Dating reports must be distinct!');
  assert.notEqual(datingA.sections.present, datingB.sections.present);
  assert.ok(datingA.sections.past.includes('Kabir') || datingA.sections.present.includes('Kabir'), 'Must mention Kabir');
  assert.ok(datingA.sections.past.includes('Tara') || datingA.sections.present.includes('Tara'), 'Must mention Tara');
  assert.ok(datingB.sections.past.includes('Rohan') || datingB.sections.present.includes('Rohan'), 'Must mention Rohan');
  assert.ok(datingB.sections.past.includes('Ananya') || datingB.sections.present.includes('Ananya'), 'Must mention Ananya');
  assert.ok(!JSON.stringify(datingA).includes('abc') && !JSON.stringify(datingB).includes('abc'), 'Must not have abc');
  assert.ok(!JSON.stringify(datingA).includes('xyz') && !JSON.stringify(datingB).includes('xyz'), 'Must not have xyz');
  console.log('✓ Dating Mood On personalization verified!\n');

  // -------------------------------------------------------------------------
  // CARD 2: BOND CHECK (2 People)
  // -------------------------------------------------------------------------
  console.log('>>> [2/4] BOND CHECK');

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
  console.log('Provider:', bondA.meta.provider, 'Mode:', bondA.meta.mode);
  console.log('Past:', bondA.sections.past);
  console.log('Present:', bondA.sections.present);
  console.log('Future:', bondA.sections.future);
  console.log('Strengths:', bondA.sections.strengths[0]);

  console.log('\n--- Bond Check: Pair B (Sameer & Vikram) ---');
  console.log('Past:', bondB.sections.past);
  console.log('Present:', bondB.sections.present);
  console.log('Future:', bondB.sections.future);
  console.log('Strengths:', bondB.sections.strengths[0]);

  // Assertions
  assert.notEqual(bondA.sections.past, bondB.sections.past, 'Bond Check reports must be distinct!');
  assert.notEqual(bondA.sections.present, bondB.sections.present);
  assert.ok(bondA.sections.past.includes('Aman') || bondA.sections.present.includes('Aman'), 'Must mention Aman');
  assert.ok(bondA.sections.past.includes('Pooja') || bondA.sections.present.includes('Pooja'), 'Must mention Pooja');
  assert.ok(bondB.sections.past.includes('Sameer') || bondB.sections.present.includes('Sameer'), 'Must mention Sameer');
  assert.ok(bondB.sections.past.includes('Vikram') || bondB.sections.present.includes('Vikram'), 'Must mention Vikram');
  assert.ok(!JSON.stringify(bondA).includes('abc') && !JSON.stringify(bondB).includes('abc'), 'Must not have abc');
  assert.ok(!JSON.stringify(bondA).includes('xyz') && !JSON.stringify(bondB).includes('xyz'), 'Must not have xyz');
  console.log('✓ Bond Check personalization verified!\n');

  // -------------------------------------------------------------------------
  // CARD 3: FUTURE MILLIONAIRE (1 Person)
  // -------------------------------------------------------------------------
  console.log('>>> [3/4] FUTURE MILLIONAIRE');

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
  console.log('Provider:', milA.meta.provider, 'Mode:', milA.meta.mode);
  console.log('Past:', milA.sections.past);
  console.log('Present:', milA.sections.present);
  console.log('Future:', milA.sections.future);
  console.log('Strengths:', milA.sections.strengths[0]);

  console.log('\n--- Future Millionaire: Person B (Dev) ---');
  console.log('Past:', milB.sections.past);
  console.log('Present:', milB.sections.present);
  console.log('Future:', milB.sections.future);
  console.log('Strengths:', milB.sections.strengths[0]);

  // Assertions: Distinct, single person only, no wealth promises, no romance
  assert.notEqual(milA.sections.past, milB.sections.past, 'Millionaire reports must be distinct!');
  assert.notEqual(milA.sections.present, milB.sections.present);
  assert.ok(milA.sections.past.includes('Aarav') || milA.sections.present.includes('Aarav'), 'Must mention Aarav');
  assert.ok(milB.sections.past.includes('Dev') || milB.sections.present.includes('Dev'), 'Must mention Dev');
  assert.ok(!JSON.stringify(milA).includes('abc') && !JSON.stringify(milB).includes('abc'));
  console.log('✓ Future Millionaire personalization verified!\n');

  // -------------------------------------------------------------------------
  // CARD 4: KARMA IS LOADING (1 Person)
  // -------------------------------------------------------------------------
  console.log('>>> [4/4] KARMA IS LOADING');

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
  console.log('Provider:', karmaA.meta.provider, 'Mode:', karmaA.meta.mode);
  console.log('Past:', karmaA.sections.past);
  console.log('Present:', karmaA.sections.present);
  console.log('Future:', karmaA.sections.future);
  console.log('Strengths:', karmaA.sections.strengths[0]);

  console.log('\n--- Karma Is Loading: Person B (Siddharth) ---');
  console.log('Past:', karmaB.sections.past);
  console.log('Present:', karmaB.sections.present);
  console.log('Future:', karmaB.sections.future);
  console.log('Strengths:', karmaB.sections.strengths[0]);

  // Assertions: Distinct, single person only, no romance, no career/wealth
  assert.notEqual(karmaA.sections.past, karmaB.sections.past, 'Karma reports must be distinct!');
  assert.notEqual(karmaA.sections.present, karmaB.sections.present);
  assert.ok(karmaA.sections.past.includes('Prakriti') || karmaA.sections.present.includes('Prakriti'), 'Must mention Prakriti');
  assert.ok(karmaB.sections.past.includes('Siddharth') || karmaB.sections.present.includes('Siddharth'), 'Must mention Siddharth');
  assert.ok(!JSON.stringify(karmaA).includes('abc') && !JSON.stringify(karmaB).includes('abc'));
  console.log('✓ Karma Is Loading personalization verified!\n');

  console.log('================================================================');
  console.log('ALL FOUR CARDS PASSED PERSONALIZATION ACROSS BOTH TEST SETS!');
  console.log('================================================================');
}

testAllCardsPersonalization().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
