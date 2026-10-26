const assert = require('assert');
const { generateMockReading } = require('../core/readingService');

console.log('Testing dynamic personalization across different people and categories...\n');

// 1. Person A: Prakriti (Libra / Path 7)
const personA = {
  name: 'Prakriti',
  dob: '1998-10-15',
  birthplace: 'Jaipur',
  timeOfBirth: '14:30',
  cardFocus: 'karma_is_loading'
};
const resA = generateMockReading(personA);

// 2. Person B: Dev (Aries / Path 3)
const personB = {
  name: 'Dev',
  dob: '2001-04-05',
  birthplace: 'Mumbai',
  timeOfBirth: '09:15',
  cardFocus: 'karma_is_loading'
};
const resB = generateMockReading(personB);

console.log('--- Person A (Prakriti, Karma Is Loading) ---');
console.log('Score:', resA.summary.score);
console.log('Persona:', resA.summary.label);
console.log('Metrics:', resA.summary.metrics.map(m => `${m.icon} ${m.displayLabel}: ${m.value}%`).join(', '));
console.log('Past:', resA.sections.past);
console.log('Strengths:', resA.sections.strengths);
console.log('Verdict Headline:', resA.sections.verdictHeadline);
console.log('Verdict Text:', resA.sections.finalVerdict);

console.log('\n--- Person B (Dev, Karma Is Loading) ---');
console.log('Score:', resB.summary.score);
console.log('Persona:', resB.summary.label);
console.log('Metrics:', resB.summary.metrics.map(m => `${m.icon} ${m.displayLabel}: ${m.value}%`).join(', '));
console.log('Past:', resB.sections.past);
console.log('Strengths:', resB.sections.strengths);

// Verify scores and personas are dynamically different
assert.notEqual(resA.summary.score, resB.summary.score, 'Scores must vary for different people');
assert.notEqual(resA.summary.label, resB.summary.label, 'Personas must vary for different people');

// 3. Category: Future Millionaire
const resMillionaire = generateMockReading({
  name: 'Rohan',
  dob: '1995-08-20',
  birthplace: 'Bangalore',
  timeOfBirth: '11:00',
  cardFocus: 'future_millionaire'
});
console.log('\n--- Category: Future Millionaire (Rohan) ---');
console.log('Title:', resMillionaire.summary.title);
console.log('Score:', resMillionaire.summary.score);
console.log('Persona:', resMillionaire.summary.label);
console.log('Badge Img:', resMillionaire.summary.badgeImg);
console.log('Metrics:', resMillionaire.summary.metrics.map(m => `${m.icon} ${m.displayLabel}: ${m.value}%`).join(', '));
assert.equal(resMillionaire.summary.badgeImg, 'verdict_trophy.jpg');

// 4. Category: Bond Check (Two People)
const resBond = generateMockReading({
  isTwoPerson: true,
  cardFocus: 'bond_check',
  person1: { name: 'Aman', dob: '1997-03-12', birthplace: 'Delhi', timeOfBirth: '08:00' },
  person2: { name: 'Pooja', dob: '1999-11-25', birthplace: 'Shimla', timeOfBirth: '16:45' }
});
console.log('\n--- Category: Bond Check (Aman & Pooja) ---');
console.log('Title:', resBond.summary.title);
console.log('Score:', resBond.summary.score);
console.log('Bond Type:', resBond.summary.label);
console.log('Badge Img:', resBond.summary.badgeImg);
console.log('Metrics:', resBond.summary.metrics.map(m => `${m.icon} ${m.displayLabel}: ${m.value}%`).join(', '));
assert.equal(resBond.summary.badgeImg, 'verdict_hearts.jpg');

// 5. Category: Dating Mood On (Two People)
const resDating = generateMockReading({
  isTwoPerson: true,
  cardFocus: 'dating_mood_on',
  person1: { name: 'Kabir', dob: '1996-07-14', birthplace: 'Goa', timeOfBirth: '19:30' },
  person2: { name: 'Tara', dob: '1998-02-18', birthplace: 'Kolkata', timeOfBirth: '12:15' }
});
console.log('\n--- Category: Dating Mood On (Kabir & Tara) ---');
console.log('Title:', resDating.summary.title);
console.log('Score:', resDating.summary.score);
console.log('Couple Vibe:', resDating.summary.label);
console.log('Badge Img:', resDating.summary.badgeImg);
console.log('Metrics:', resDating.summary.metrics.map(m => `${m.icon} ${m.displayLabel}: ${m.value}%`).join(', '));
assert.equal(resDating.summary.badgeImg, 'verdict_couple.jpg');

console.log('\nAll dynamic personalization and category asset tests passed with flying colors!');
