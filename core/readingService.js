/**
 * AI Jyotish - Reading Service
 *
 * Secure backend service that orchestrates AI astrology and palmistry interpretations.
 * Strictly adheres to safety, privacy, and architectural requirements:
 * - Server-side GEMINI_API_KEY environment variable (never exposed).
 * - Accepts user's name, date of birth, and palm image.
 * - In-memory image processing; no permanent storage or disk writes.
 * - Enforces PG-rated, wholesome, reflective interpretations.
 * - Presents palmistry strictly as entertainment and self-reflection; never guarantees the future.
 * - Witty, engaging, clever friend persona with short punchy paragraphs, bullet points, and emojis.
 * - Enforces strict category-specific content across the 4 cards:
 *   1. Dating Mood On (1 person) - Romantic life, vibes, green/red flags, dating tips
 *   2. Bond Check (2 persons) - Duo bond, synergy, trust, humor, resolving misunderstandings
 *   3. Future Millionaire (1 person) - Career, learning, work style, financial habits, next steps
 *   4. Karma Is Loading (1 person) - Personal growth, habits, choices, lessons, small actions
 * - Dynamic top summary with Overall Vibe Score /100, funny label, and 5 category-unique metrics.
 * - Provides rich, high-quality contextual mock fallback when GEMINI_API_KEY is not set.
 */

const getSunSign = require('./rashi');

// Structured Schema sections for runtime validation & backward compatibility
const REQUIRED_SECTIONS = [
  'personalityReflection',
  'strengthsAndGrowth',
  'careerAndLearning',
  'relationshipsAndCommunication',
  'futurePossibilities',
  'practicalSuggestions'
];

function parseDob(rawDob) {
  if (!rawDob) return null;
  const str = rawDob.toString().trim();
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2026) {
      return { day, month, year };
    }
  }
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2026) {
      return { day, month, year };
    }
  }
  return null;
}

/**
 * Helper to parse and sanitize individual person details
 */
function parsePerson(raw, defaultName = 'Seeker') {
  if (!raw || typeof raw !== 'object') {
    raw = {};
  }

  const rawName = (raw.name || raw.firstName || defaultName).toString().trim();
  const sanitizedName = rawName.slice(0, 50).replace(/[<>]/g, '') || defaultName;

  const rawDob = (raw.dob || '').toString().trim();
  const parsedDate = parseDob(rawDob);
  const day = parsedDate ? parsedDate.day : null;
  const month = parsedDate ? parsedDate.month : null;
  const year = parsedDate ? parsedDate.year : null;

  let sunSign = raw.sunSign;
  let lifePath = raw.lifePath;

  if (!sunSign && day && month) {
    try {
      sunSign = getSunSign(day, month, year);
    } catch {
      sunSign = 'Aries';
    }
  }
  if (!sunSign || typeof sunSign !== 'string') {
    sunSign = 'Aries';
  }

  let lifePathNum = parseInt(lifePath, 10);
  if (isNaN(lifePathNum) || lifePathNum < 1 || lifePathNum > 33) {
    if (day && month && year) {
      function sumDigits(n) {
        let sum = 0;
        while (n > 0) {
          sum += n % 10;
          n = Math.floor(n / 10);
        }
        return sum;
      }
      function reduce(n) {
        while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
          n = sumDigits(n);
        }
        return n;
      }
      lifePathNum = reduce(reduce(day) + reduce(month) + reduce(year));
    } else {
      lifePathNum = 7;
    }
  }

  const sanitizedPlace = (raw.birthplace || 'Not specified').toString().slice(0, 50).replace(/[<>]/g, '').trim();
  const rawTime = (raw.birthTime || raw.time || raw.timeOfBirth || raw.timeBucket || '').toString().trim();
  const safeTimeBucket = ['morning', 'afternoon', 'evening', 'night', 'unknown', 'unsure', 'subah', 'dopahar', 'shaam', 'raat', 'pata_nahi'].includes(rawTime.toLowerCase())
    ? rawTime.toLowerCase()
    : (rawTime || 'unknown');

  let palmImage = null;
  if (raw.palmImage && typeof raw.palmImage === 'string') {
    if (raw.palmImage.length <= 10 * 1024 * 1024 && (raw.palmImage.startsWith('data:image/') || raw.palmImage.includes('base64,'))) {
      palmImage = raw.palmImage;
    }
  }

  return {
    name: sanitizedName,
    dob: rawDob,
    sunSign: sunSign.trim(),
    lifePath: lifePathNum,
    birthplace: sanitizedPlace,
    birthTime: rawTime,
    timeBucket: safeTimeBucket,
    palmImage: palmImage,
    isDemoPalm: Boolean(raw.isDemoPalm)
  };
}

/**
 * Validates the inbound payload from client
 * Bond Check handles two people; the other three cards handle one person.
 */
function validateClientPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' };
  }

  const isTwoPerson = Boolean(
    body.isTwoPerson === true ||
    body.mode === 'two_person' ||
    ((body.cardFocus === 'bond_check' || body.cardFocus === 'dating_mood_on') && (body.person2 || body.name2 || body.firstName2)) ||
    (body.person2 && (body.person2.name || body.person2.firstName || body.person2.dob))
  );

  if (isTwoPerson) {
    const rawP1 = body.person1 || {
      name: body.name || body.name1 || body.firstName || body.firstName1,
      dob: body.dob || body.dob1,
      sunSign: body.sunSign || body.sunSign1,
      lifePath: body.lifePath || body.lifePath1,
      birthplace: body.birthplace || body.birthplace1,
      birthTime: body.birthTime || body.birthTime1 || body.time || body.timeBucket || body.timeBucket1,
      timeBucket: body.timeBucket || body.timeBucket1 || body.birthTime || body.birthTime1,
      palmImage: body.palmImage || body.palmImage1,
      isDemoPalm: body.isDemoPalm || body.isDemoPalm1
    };

    const rawP2 = body.person2 || {
      name: body.name2 || body.firstName2,
      dob: body.dob2,
      sunSign: body.sunSign2,
      lifePath: body.lifePath2,
      birthplace: body.birthplace2,
      birthTime: body.birthTime2 || body.p2BirthTime || body.time2 || body.timeBucket2,
      timeBucket: body.timeBucket2 || body.p2BirthTime || body.birthTime2,
      palmImage: body.palmImage2,
      isDemoPalm: body.isDemoPalm2
    };

    if (!rawP1 || !rawP1.name || rawP1.name.trim().length < 2) {
      return { valid: false, error: 'Person 1 name must be at least 2 characters.' };
    }
    const p1Dob = parseDob(rawP1.dob);
    if (!rawP1.dob || !p1Dob) {
      return { valid: false, error: 'Person 1 date of birth is required and must be valid.' };
    }
    if (!rawP2 || !rawP2.name || rawP2.name.trim().length < 2) {
      return { valid: false, error: 'Person 2 name must be at least 2 characters.' };
    }
    const p2Dob = parseDob(rawP2.dob);
    if (!rawP2.dob || !p2Dob) {
      return { valid: false, error: 'Person 2 date of birth is required and must be valid.' };
    }

    const p1 = parsePerson(rawP1, 'Person 1');
    const p2 = parsePerson(rawP2, 'Person 2');

    return {
      valid: true,
      data: {
        isTwoPerson: true,
        cardFocus: body.cardFocus || 'dating_mood_on',
        name: `${p1.name} & ${p2.name}`,
        person1: p1,
        person2: p2,
        dob: p1.dob,
        sunSign: p1.sunSign,
        lifePath: p1.lifePath,
        birthplace: p1.birthplace,
        birthTime: p1.birthTime,
        timeBucket: p1.timeBucket,
        palmImage: p1.palmImage,
        isDemoPalm: p1.isDemoPalm
      }
    };
  }

  // Single person mode
  const single = parsePerson(body, 'Seeker');
  return {
    valid: true,
    data: {
      isTwoPerson: false,
      cardFocus: body.cardFocus || 'dating_mood_on',
      name: single.name,
      dob: single.dob,
      sunSign: single.sunSign,
      lifePath: single.lifePath,
      birthplace: single.birthplace,
      birthTime: single.birthTime,
      timeBucket: single.timeBucket,
      palmImage: single.palmImage,
      isDemoPalm: single.isDemoPalm
    }
  };
}

/**
 * Formats time bucket or accurate time string into clean English descriptor
 */
function formatTimeBucket(key) {
  if (!key) return 'Time Not Specified';
  const str = key.toString().trim();
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }
  const map = {
    morning: 'Morning',
    subah: 'Morning',
    afternoon: 'Afternoon',
    dopahar: 'Afternoon',
    evening: 'Evening',
    shaam: 'Evening',
    night: 'Night',
    raat: 'Night',
    unknown: 'Unknown',
    unsure: 'Unknown',
    pata_nahi: 'Unknown'
  };
  return map[str.toLowerCase()] || str;
}

/**
 * Deterministically calculates category-specific scores and 5 unique horizontal progress bar metrics.
 * Indicators are for entertainment and self-reflection.
 * Never reuses metrics across categories.
 */
function calculateCategoryScores(category, person1, person2 = null) {
  const seedStr = `${person1?.name || 'User'}-${person1?.dob || ''}-${person1?.lifePath || 7}-${person2 ? person2.name + person2.dob : ''}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const overallScore = 80 + (absHash % 17); // Realistic range 80-96

  const categoryConfigs = {
    karma_is_loading: {
      categoryName: 'Karma Is Loading',
      icon: '🪷',
      subtitle: 'Your Life Lessons & Growth Report',
      title: 'Karma & Life Lessons Report 🔥',
      reportIcon: '⚖️',
      scoreLabel: 'Overall Balance Score',
      personaLabel: 'Your Karma Persona',
      badgeImg: 'verdict_lotus.jpg',
      strengthsTitle: 'Your Strengths',
      strengthsIcon: '💪',
      watchOutTitle: 'Watch Out For',
      nextMoveTitle: 'Your Next Move',
      verdictHeadline: 'Your karma is in a "Reset & Grow" phase!',
      metrics: [
        { label: 'Self-Awareness', displayLabel: 'Past Lessons', icon: '🎓', base: 88 },
        { label: 'Resilience', displayLabel: 'Current Balance', icon: '🧠', base: 82 },
        { label: 'Habit Discipline', displayLabel: 'Decision Wisdom', icon: '🎯', base: 86 },
        { label: 'Emotional Balance', displayLabel: 'Growth Potential', icon: '🌱', base: 90 },
        { label: 'Destiny Alignment', displayLabel: 'Inner Peace', icon: '🪷', base: 84 }
      ],
      labels: [
        'The Self-Growth Explorer 🌱',
        'The Mindful Strategist 🔮',
        'The Resilient Phoenix 🔥',
        'The Karmic Alchemist ✨',
        'The Grounded Philosopher 🌿',
        'The Patient Visionary 🌙'
      ]
    },
    future_millionaire: {
      categoryName: 'Future Millionaire',
      icon: '💰',
      subtitle: 'Your Career & Money Vibe Report',
      title: 'Career & Wealth Blueprint 💰',
      reportIcon: '📊',
      scoreLabel: 'Overall Growth Score',
      personaLabel: 'Your Career Persona',
      badgeImg: 'verdict_trophy.jpg',
      strengthsTitle: 'Your Strengths',
      strengthsIcon: '💪',
      watchOutTitle: 'Watch Out For',
      nextMoveTitle: 'Your Next Move',
      verdictHeadline: 'You have a real "Millionaire Mindset"!',
      metrics: [
        { label: 'Career Drive', displayLabel: 'Learning Drive', icon: '🎓', base: 94 },
        { label: 'Money Mindfulness', displayLabel: 'Career Focus', icon: '💻', base: 86 },
        { label: 'Skill Adaptability', displayLabel: 'Money Management', icon: '🪙', base: 84 },
        { label: 'Strategic Focus', displayLabel: 'Creativity', icon: '💡', base: 91 },
        { label: 'Breakthrough Potential', displayLabel: 'Success Potential', icon: '🏆', base: 95 }
      ],
      labels: [
        'The Curious Builder 🚀',
        'The Strategic Innovator 💡',
        'The Value Creator 🎯',
        'The Resourceful Achiever 📈',
        'The High-Impact Visionary ⚡',
        'The Pragmatic Builder 💼'
      ]
    },
    bond_check: {
      categoryName: 'Bond Check',
      icon: '🤝',
      subtitle: 'Your Relationship & Bond Report',
      title: 'Bond Check & Duo Synergy Index ⭐',
      reportIcon: '👥',
      scoreLabel: 'Overall Bond Score',
      personaLabel: 'Your Bond Type',
      badgeImg: 'verdict_hearts.jpg',
      strengthsTitle: 'Your Combined Strengths',
      strengthsIcon: '💪',
      watchOutTitle: 'Things to Watch For',
      nextMoveTitle: 'Bond Tips',
      verdictHeadline: 'A Strong & Balanced Bond!',
      metrics: [
        { label: 'Mutual Trust', displayLabel: 'Trust', icon: '🛡️', base: 91 },
        { label: 'Vibe Synergy', displayLabel: 'Understanding', icon: '💬', base: 86 },
        { label: 'Communication Flow', displayLabel: 'Fun & Vibes', icon: '✨', base: 90 },
        { label: 'Shared Humor', displayLabel: 'Communication', icon: '💖', base: 87 },
        { label: 'Conflict Resolution', displayLabel: 'Mutual Effort', icon: '♾️', base: 85 }
      ],
      labels: [
        'The Supportive Duo 👥',
        'The Dynamic Allies 🤝',
        'The Telepathic Minds 🧠',
        'The Unshakeable Dynamic Duo ⭐',
        'Partners in Controlled Chaos 😂',
        'The Loyal Companions 💫'
      ]
    },
    dating_mood_on: {
      categoryName: 'Dating Mood On',
      icon: '👥',
      subtitle: 'Your Compatibility & Dating Vibe Report',
      title: 'Dating Mood & Chemistry Check 💕',
      reportIcon: '🩷',
      scoreLabel: 'Overall Match Score',
      personaLabel: 'Your Couple Vibe',
      badgeImg: 'verdict_couple.jpg',
      strengthsTitle: 'Your Strengths (Together)',
      strengthsIcon: '💎',
      watchOutTitle: 'Things to Watch For',
      nextMoveTitle: 'Relationship Tips',
      verdictHeadline: 'A Strong & Promising Match!',
      metrics: [
        { label: 'Communication', displayLabel: 'Emotional Sync', icon: '💖', base: 90 },
        { label: 'Emotional Awareness', displayLabel: 'Communication', icon: '💬', base: 86 },
        { label: 'Romantic Confidence', displayLabel: 'Trust & Comfort', icon: '🤝', base: 88 },
        { label: 'Openness', displayLabel: 'Romantic Vibe', icon: '✨', base: 91 },
        { label: 'Growth Potential', displayLabel: 'Long-term Potential', icon: '🌱', base: 87 }
      ],
      labels: [
        'The Balanced Duo ✨',
        'Electric Chemistry With Unspoken Mutual Sparks 💕',
        'Dynamic Match Made for Banter & Romance 🥂',
        'Playful Flirts Who Actually Match Each Other’s Effort 🔥',
        'Complementary Hearts With High Chemistry 💖',
        'Golden Couple Energy With Low-Drama Vibes 🌟'
      ]
    }
  };

  const normalizedCat = ['dating_mood_on', 'bond_check', 'future_millionaire', 'karma_is_loading'].includes(category)
    ? category
    : 'dating_mood_on';

  const config = categoryConfigs[normalizedCat];
  const labelIndex = absHash % config.labels.length;
  const label = config.labels[labelIndex];

  const metrics = config.metrics.map((m, idx) => {
    const variance = ((absHash >> (idx * 3)) % 11) - 5; // -5 to +5
    const score = Math.max(70, Math.min(98, m.base + variance));
    return {
      label: m.label,
      displayLabel: m.displayLabel || m.label,
      icon: m.icon || '✨',
      value: score
    };
  });

  return {
    categoryKey: normalizedCat,
    categoryName: config.categoryName,
    categoryIcon: config.icon,
    subtitle: config.subtitle,
    title: config.title,
    reportIcon: config.reportIcon,
    scoreLabel: config.scoreLabel,
    personaLabel: config.personaLabel,
    badgeImg: config.badgeImg,
    strengthsTitle: config.strengthsTitle,
    strengthsIcon: config.strengthsIcon,
    watchOutTitle: config.watchOutTitle,
    nextMoveTitle: config.nextMoveTitle,
    score: overallScore,
    label: label,
    metrics: metrics
  };
}

const ZODIAC_PROFILES = {
  Aries: { trait: 'bold initiative and fierce authenticity', style: 'direct and spirited' },
  Taurus: { trait: 'grounded steadiness and loyal persistence', style: 'calm and deliberate' },
  Gemini: { trait: 'sparkling conversational flow and quick curiosity', style: 'playful and multifaceted' },
  Cancer: { trait: 'deep emotional intuition and heartfelt warmth', style: 'protective and caring' },
  Leo: { trait: 'radiant presence, creative flair and big-hearted loyalty', style: 'confident and warm' },
  Virgo: { trait: 'crisp discernment, masterful detail, and quiet competence', style: 'thoughtful and observant' },
  Libra: { trait: 'diplomatic charm, balanced grace, and love for harmony', style: 'considerate and social' },
  Scorpio: { trait: 'magnetic depth, intense loyalty, and perceptive wisdom', style: 'profound and passionate' },
  Sagittarius: { trait: 'truth-seeking optimism, philosophical humor, and free spirit', style: 'adventurous and honest' },
  Capricorn: { trait: 'strategic patience, earned mastery, and dependable grit', style: 'steady and ambitious' },
  Aquarius: { trait: 'refreshing originality, inventive thinking, and cool individuality', style: 'visionary and authentic' },
  Pisces: { trait: 'soulful resonance, artistic sensitivity, and empathetic depth', style: 'gentle and imaginative' }
};

function getZodiacProfile(sign) {
  return ZODIAC_PROFILES[sign] || { trait: 'versatile adaptability and intuitive warmth', style: 'balanced and thoughtful' };
}

/**
 * Enriches a reading object with all category-specific UI configuration,
 * including icons, badges, titles, metric display names, and next-move lists.
 */
function enrichReadingWithCategoryMeta(reading, cardFocus, person1, person2 = null) {
  if (!reading || typeof reading !== 'object') return reading;

  const config = calculateCategoryScores(cardFocus, person1, person2);

  if (!reading.summary || typeof reading.summary !== 'object') {
    reading.summary = {};
  }

  // Ensure category branding and icons are attached
  reading.summary.categoryKey = config.categoryKey;
  reading.summary.categoryName = config.categoryName;
  reading.summary.categoryIcon = config.categoryIcon;
  reading.summary.subtitle = config.subtitle;
  reading.summary.reportIcon = config.reportIcon;
  reading.summary.scoreLabel = config.scoreLabel;
  reading.summary.personaLabel = config.personaLabel;
  reading.summary.badgeImg = config.badgeImg;
  reading.summary.strengthsTitle = config.strengthsTitle;
  reading.summary.strengthsIcon = config.strengthsIcon;
  reading.summary.watchOutTitle = config.watchOutTitle;
  reading.summary.nextMoveTitle = config.nextMoveTitle;
  if (!reading.summary.title) {
    reading.summary.title = config.title;
  }
  if (typeof reading.summary.score !== 'number' || reading.summary.score < 50 || reading.summary.score > 100) {
    reading.summary.score = config.score;
  }
  if (!reading.summary.label) {
    reading.summary.label = config.label;
  }

  // Map 5 metrics with their category displayLabel and icons
  if (Array.isArray(reading.summary.metrics) && reading.summary.metrics.length > 0) {
    reading.summary.metrics = reading.summary.metrics.map((m, idx) => {
      const cfg = config.metrics[idx] || config.metrics[0];
      const val = typeof m.value === 'number' ? Math.max(70, Math.min(99, Math.round(m.value))) : cfg.base;
      return {
        label: m.label || cfg.label,
        displayLabel: cfg.displayLabel || m.label || cfg.label,
        icon: cfg.icon || '✨',
        value: val
      };
    });
  } else {
    reading.summary.metrics = config.metrics;
  }

  if (!reading.sections || typeof reading.sections !== 'object') {
    reading.sections = {};
  }

  // Ensure verdictHeadline is present
  if (!reading.sections.verdictHeadline) {
    reading.sections.verdictHeadline = config.verdictHeadline;
  }
  reading.summary.verdictHeadline = reading.sections.verdictHeadline;

  // Ensure nextMoveList is populated
  if (!Array.isArray(reading.sections.nextMoveList) || reading.sections.nextMoveList.length === 0) {
    if (reading.sections.nextMove && typeof reading.sections.nextMove === 'string') {
      const parts = reading.sections.nextMove
        .split(/(?:[.,;]\s+|\band\b\s+)/)
        .map(s => s.trim().replace(/^[•\-\*]\s*/, ''))
        .filter(s => s.length > 5);
      if (parts.length >= 2) {
        reading.sections.nextMoveList = parts.slice(0, 4);
      }
    }
    if (!Array.isArray(reading.sections.nextMoveList) || reading.sections.nextMoveList.length === 0) {
      const defaultLists = {
        karma_is_loading: [
          'Let go of what no longer serves your peace',
          'Build a consistent 10-minute morning routine',
          'Practice self-compassion when plans pivot',
          'Focus on long-term calm over quick reactions'
        ],
        future_millionaire: [
          'Pick one primary high-leverage goal for this quarter',
          'Automate your savings and investment transfers',
          'Ship or demonstrate your latest skillset publicly',
          'Focus on consistent execution over endless planning'
        ],
        bond_check: [
          'Keep communication direct and low-pressure',
          'Celebrate each other’s small personal wins',
          'Respect individual decompression space',
          'Plan regular uninterrupted catch-up sessions'
        ],
        dating_mood_on: [
          'Plan a date that encourages natural conversation',
          'Be clear and candid about what brings you joy',
          'Give each other room to express emotions at own pace',
          'Keep the playful banter and curiosity alive'
        ]
      };
      reading.sections.nextMoveList = defaultLists[config.categoryKey] || defaultLists.dating_mood_on;
    }
  }

  // Auto-populate legacy fields for backwards compatibility with test suites
  ensureLegacyFields(reading);

  return reading;
}

/**
 * Generates an intelligent, witty, concise mock reading written like a clever friend.
 * Strictly adheres to category boundaries and includes both past and future reflections.
 * Results dynamically adapt to individual's Sun Sign, Life Path, Birthplace, and Names.
 */
function generateMockReading(data) {
  const isTwoPerson = Boolean(data.isTwoPerson && data.person1 && data.person2);
  const cardFocus = data.cardFocus || (isTwoPerson ? 'dating_mood_on' : 'dating_mood_on');

  const p1 = isTwoPerson ? data.person1 : data;
  const p2 = isTwoPerson ? data.person2 : null;
  const name1 = p1.name || 'Seeker';
  const name2 = p2 ? (p2.name || 'Partner') : '';

  const p1Prof = getZodiacProfile(p1.sunSign);
  const p2Prof = p2 ? getZodiacProfile(p2.sunSign) : null;
  const p1PlaceStr = p1.birthplace && p1.birthplace !== 'Not specified' ? `rooted in ${p1.birthplace}` : 'shaped by your path';
  const p2PlaceStr = p2 && p2.birthplace && p2.birthplace !== 'Not specified' ? `rooted in ${p2.birthplace}` : 'shaped by your path';

  const summary = calculateCategoryScores(cardFocus, p1, p2);

  let sections = {};
  let palmHighlights = [];
  let archetypeTitle = '';
  let coreGift = '';

  if (cardFocus === 'dating_mood_on') {
    // CATEGORY A: DATING MOOD ON (Romance, Chemistry, Compatibility)
    archetypeTitle = isTwoPerson
      ? `${name1} & ${name2} · Romantic Chemistry & Compatibility`
      : `${name1} · Romantic Vibe & Dating Chemistry`;
    coreGift = 'Magnetic Chemistry & Mutual Emotional Resonance';

    sections = {
      past: isTwoPerson
        ? `Looking back, the romantic sparks between ${name1} and ${name2} ignited through a mix of ${p1Prof.trait} and ${p2Prof.trait}. From early conversations ${p1PlaceStr} and ${p2PlaceStr}, you sensed an uncommon mutual curiosity.`
        : `Looking back, ${name1}, your past dating experiences shaped by ${p1Prof.trait} taught you to value genuine emotional reciprocity over surface-level charm.`,
      present: isTwoPerson
        ? `${name1} & ${name2}, your current romantic rhythm feels magnetic. You balance ${name1}'s ${p1Prof.style} energy with ${name2}'s ${p2Prof.style} warmth, creating a genuine space where both of you can drop the social mask.`
        : `${name1}, you are currently stepping into a magnetic dating headspace where your ${p1Prof.trait} naturally attracts people who appreciate your authentic rhythm.`,
      future: isTwoPerson
        ? `For ${name1} and ${name2}, this dating connection has genuine potential to grow into something rare, stable, and deeply fulfilling as long as you keep communication open and celebrate small shared moments.`
        : `For ${name1}, your romantic path is opening toward deeper emotional safety, exciting mutual chemistry, and a partner who matches your Life Path ${p1.lifePath} dedication.`,
      strengths: [
        `✨ ${name1} brings ${p1Prof.trait}`,
        `💖 ${isTwoPerson ? `${name2} anchors with ${p2Prof.trait}` : 'Deep emotional authenticity and loyalty'}`,
        '🔥 Effortless banter that turns ordinary dates into core memories',
        '🤝 Mutual emotional safety where both feel heard and respected'
      ],
      watchOutFor: [
        '🚩 Misinterpreting quiet decompression time as emotional distance',
        '🚩 Letting overthinking create imaginary complications',
        '🚩 Expecting each other to read minds instead of asking directly'
      ],
      nextMove: 'Plan an easygoing, low-pressure date with space for real conversation, and keep the playful banter alive.',
      nextMoveList: [
        'Plan a date that encourages natural conversation',
        'Be candid about what brings you joy',
        'Give each other room to express emotions at own pace',
        'Keep the playful banter and curiosity alive'
      ],
      verdictHeadline: 'A Strong & Promising Match!',
      finalVerdict: isTwoPerson
        ? `${name1} and ${name2} share a vibrant romantic frequency with high chemistry and real long-term potential.`
        : `${name1}, trust your natural romantic instincts—you are ready for genuine connection.`
    };

    palmHighlights = [
      {
        line: 'Dual Heart Line Romantic Harmony',
        observation: isTwoPerson ? `${name1}'s passionate curve aligns with ${name2}'s warm emotional receptivity.` : `${name1}'s heart line displays warm emotional receptivity and depth.`,
        meaning: 'Shows strong romantic attraction, reciprocal affection, and relationship safety.'
      },
      {
        line: 'Venus Mount Passion & Warmth',
        observation: 'Warm, energized contours at the base of the thumb.',
        meaning: 'High romantic chemistry, affection, and thoughtful romantic gestures.'
      },
      {
        line: 'Head Line Intellectual Sparks',
        observation: 'Complementary arches pointing toward expressive creative mounts.',
        meaning: 'Effortless verbal banter, engaging conversations, and shared humor.'
      }
    ];
  } else if (cardFocus === 'bond_check' || (isTwoPerson && !cardFocus)) {
    // CATEGORY B: BOND CHECK (Two people strictly / Duo harmony)
    archetypeTitle = `${name1} & ${name2 || 'Partner'} · Cosmic Bond Harmony`;
    coreGift = 'Unspoken Understanding & Complementary Strengths';

    sections = {
      past: `Looking back, the bond between ${name1} and ${name2 || 'your counterpart'} was forged through mutual respect and shared adventures ${p1PlaceStr}. You learned early on that when life gets chaotic, you two can turn any mess into an inside joke.`,
      present: `${name1} & ${name2 || 'your counterpart'}, your current duo synergy is unmatched. Combining ${name1}'s ${p1Prof.trait} with ${name2}'s ${p2Prof?.trait || 'grounded perspective'}, you form an alliance where unsaid thoughts get understood instantly.`,
      future: `For ${name1} and ${name2 || 'your counterpart'}, this bond has an unbreakable trajectory as dynamic partners. Whether tackling new projects or navigating changes, your complementary perspectives will keep you thriving.`,
      strengths: [
        `🤝 Ride-or-die loyalty and absolute trust between ${name1} and ${name2}`,
        '😂 Top-tier shared humor that lightens up even stressful situations',
        '🛡️ No-judgment sanctuary for sharing wild ideas and real feelings',
        '⚡ Unbeatable teamwork where bold action meets grounded clarity'
      ],
      watchOutFor: [
        '⚠️ Assuming the other person knows what you need without saying it',
        '⚠️ Taking occasional bluntness personally during high-stress weeks',
        '⚠️ Forgetting to celebrate small milestones amid busy schedules'
      ],
      nextMove: 'Keep communication open and direct, respect each other’s space, and plan regular uninterrupted catch-up sessions.',
      nextMoveList: [
        'Keep communication direct and low-pressure',
        'Celebrate each other’s small personal wins',
        'Respect individual decompression space',
        'Plan regular uninterrupted catch-up sessions'
      ],
      verdictHeadline: 'A Strong & Balanced Bond!',
      finalVerdict: `${name1} and ${name2} have built a genuine connection with deep trust and undeniable synergy that only gets stronger with time.`
    };

    palmHighlights = [
      {
        line: 'Dual Heart Line Alignment',
        observation: `${name1}'s upward curve harmonizes with ${name2}'s steady emotional anchor.`,
        meaning: 'Shows genuine warmth, easy mutual forgiveness, and an innate feeling of safety together.'
      },
      {
        line: 'Venus Mount Harmony',
        observation: 'Both palms reveal warm, vibrant contours at the base of the thumb.',
        meaning: 'Shared joy for good food, cozy hangouts, and spontaneous celebrations of small wins.'
      },
      {
        line: 'Head Line Synergy',
        observation: 'One brings innovative creative sparks while the other adds grounding clarity.',
        meaning: 'Balanced decision-making where bold ideas meet practical execution without friction.'
      }
    ];
  } else if (cardFocus === 'future_millionaire') {
    // CATEGORY C: FUTURE MILLIONAIRE (Career, work style, learning, financial habits)
    archetypeTitle = `${name1} · The Strategic Builder`;
    coreGift = 'Decisive Vision & Practical Resourcefulness';

    sections = {
      past: `Looking back, ${name1}, your early professional path ${p1PlaceStr} taught you resourcefulness through hands-on trial and error. Your ${p1Prof.trait} pushed you to explore distinct avenues before zeroing in on your true creative leverage.`,
      present: `${name1}, you are in a high-leverage skill synthesis phase. Your Life Path ${p1.lifePath} drive is directing your focus into tangible output, combining ${p1Prof.style} execution with an appetite for high-impact innovation.`,
      future: `For ${name1}, your career momentum points toward expanding autonomy and leadership opportunities. While financial freedom is earned through compounding daily habits rather than magic, your disciplined learning curve positions you for significant professional milestones.`,
      strengths: [
        `🚀 ${p1Prof.trait} applied to practical execution`,
        '💡 Sharp intuitive problem-solving and rapid learning curve',
        `🎯 Life Path ${p1.lifePath} focus on building genuine, long-term value`,
        '📊 Natural instinct for spotting overlooked opportunities in your field'
      ],
      watchOutFor: [
        '⚠️ Spreading focus across too many shiny new projects simultaneously',
        '⚠️ Postponing launch dates while seeking unattainable perfection',
        '⚠️ Overworking without scheduling deliberate mental resets'
      ],
      nextMove: 'Pick one high-leverage project for this quarter, automate your savings, and ship your work with confidence.',
      nextMoveList: [
        'Pick one primary high-leverage goal for this quarter',
        'Automate your savings and investment transfers',
        'Ship or demonstrate your latest skillset publicly',
        'Focus on consistent execution over endless planning'
      ],
      verdictHeadline: 'You have a real "Millionaire Mindset"!',
      finalVerdict: `${name1}, with steady execution, smart financial discipline, and belief in your skillset, your long-term ambitions are well within reach.`
    };

    palmHighlights = [
      {
        line: 'Crisp Head Line Depth',
        observation: 'Extends across the palm with sharp definition and a decisive forward trajectory.',
        meaning: 'Indicates strategic foresight, quick problem-solving, and strong analytical composure.'
      },
      {
        line: 'Mercury Mount Elevation',
        observation: 'Firm, well-developed mount under the little finger.',
        meaning: 'Natural flair for persuasion, commercial instinct, and articulate value negotiation.'
      },
      {
        line: 'Ascending Fate Crease',
        observation: 'Clear upward progression originating near the palm center.',
        meaning: 'Reflects self-driven career momentum built on earned skills rather than mere luck.'
      }
    ];
  } else {
    // CATEGORY D: KARMA IS LOADING (Personal growth, habits, choices, lessons)
    archetypeTitle = `${name1} · The Resilient Alchemist`;
    coreGift = 'Honest Self-Awareness & Moral Courage';

    sections = {
      past: `Looking back, ${name1}, defining life lessons ${p1PlaceStr} challenged your patience and taught you discernment. Guided by your ${p1Prof.trait}, those hurdles stripped away illusions and revealed your inner resilience.`,
      present: `${name1}, you are in a conscious phase of personal realignment. You're observing your daily habits and choices with fresh clarity, actively replacing reactive impulses with mindful boundaries.`,
      future: `For ${name1}, a much more peaceful, balanced, and confident chapter is unfolding. As you let go of outdated burdens and honor your Life Path ${p1.lifePath} compass, momentum will flow with far less friction.`,
      strengths: [
        `🪷 ${p1Prof.trait} anchoring your moral compass`,
        '🌱 Deep honest self-awareness and the courage to course-correct',
        '🧠 Resilience that turns difficult experiences into hard-won wisdom',
        `✨ Life Path ${p1.lifePath} capacity to stay centered amid worldly noise`
      ],
      watchOutFor: [
        '⚠️ Repeating old avoidance traps when uncomfortable emotions arise',
        '⚠️ Procrastination disguised as waiting for the perfect cosmic timing',
        '⚠️ Over-criticizing yourself instead of celebrating small steps of progress'
      ],
      nextMove: 'Release what no longer serves your peace, establish a steady daily routine, and treat yourself with patience.',
      nextMoveList: [
        'Let go of what no longer serves your peace',
        'Build a consistent 10-minute morning routine',
        'Practice self-compassion when plans pivot',
        'Focus on long-term calm over quick reactions'
      ],
      verdictHeadline: 'Your karma is in a "Reset & Grow" phase!',
      finalVerdict: `${name1}, the universe is clearing out stale emotional clutter to make room for an authentic, grounded, and brighter version of you.`
    };

    palmHighlights = [
      {
        line: 'Resilient Life Line Arc',
        observation: 'Broad, unbroken curvature sweeping generously around the base of the thumb.',
        meaning: 'Highlights powerful stamina, rapid bounce-back vitality, and grounded inner fortitude.'
      },
      {
        line: 'Intuition Mount Accents',
        observation: 'Subtle cross-hatching across the upper Moon mount.',
        meaning: 'Points to strong gut instincts that warn you well in advance when a situation feels off.'
      },
      {
        line: 'Saturn Mount Stability',
        observation: 'Centering markings beneath the middle finger.',
        meaning: 'Deep accountability and personal integrity; you do what is right even when nobody is looking.'
      }
    ];
  }

  // Construct full object supporting both new witty format and legacy backward compatibility
  const reading = {
    meta: {
      generatedAt: new Date().toISOString(),
      provider: 'mock-engine',
      mode: 'mock',
      cardFocus: cardFocus,
      isTwoPerson: isTwoPerson
    },
    summary: summary,
    sections: sections,
    archetype: {
      title: archetypeTitle,
      zodiacSign: p1.sunSign || 'Aries',
      element: 'Air & Fire Synergy',
      lifePathNumber: p1.lifePath || 7,
      coreGift: coreGift,
      solarAlignment: formatTimeBucket(p1.timeBucket),
      person1: isTwoPerson ? { name: p1.name, sunSign: p1.sunSign, lifePath: p1.lifePath } : undefined,
      person2: isTwoPerson && p2 ? { name: p2.name, sunSign: p2.sunSign, lifePath: p2.lifePath } : undefined
    },
    palmHighlights: palmHighlights,
    personalityReflection: {
      title: 'Personality & Current Vibe',
      summary: isTwoPerson
        ? `When ${name1} and ${name2} connect, your energies create an uplifting, engaging frequency.`
        : `${name1}, you carry the vibrant signature of ${p1.sunSign || 'Aries'} with an intuitive, reflective compass. ${sections.present}`,
      traits: sections.strengths
    },
    strengthsAndGrowth: {
      title: 'Strengths & Watch-Outs',
      coreStrengths: sections.strengths.join(' '),
      areasForGrowth: sections.watchOutFor.join(' ')
    },
    careerAndLearning: {
      title: cardFocus === 'future_millionaire' ? 'Career & Wealth Blueprint' : 'Growth & Ambitions',
      summary: sections.present,
      idealEnvironments: 'Fast-paced, high-trust, collaborative environments with autonomy and low drama.',
      learningStyle: 'Hands-on experimentation and quick iterative feedback.'
    },
    relationshipsAndCommunication: {
      title: cardFocus === 'dating_mood_on' ? 'Dating Chemistry & Romantic Vibe' : 'Communication & Connection',
      summary: isTwoPerson
        ? `The connection between ${name1} and ${name2} radiates high chemistry, genuine warmth, and easy mutual understanding.`
        : `${name1}, you value sincerity and depth in connections, backed by witty banter and perceptive listening.`,
      communicationStyle: 'Direct, witty, and emotionally perceptive.',
      connectionTip: sections.nextMove
    },
    futurePossibilities: {
      title: 'Future Possibilities',
      summary: sections.future,
      upcomingThemes: [
        sections.future,
        'Deepening authentic alignment',
        'Exciting new collaborative milestones'
      ]
    },
    practicalSuggestions: {
      title: 'Practical Action & Verdict',
      dailyPractices: [
        sections.nextMove,
        'Take 10 minutes of quiet screen-free grounding each morning',
        'Protect your peace and energy with clear gentle boundaries'
      ],
      reflectionPrompt: sections.nextMove,
      cosmicAffirmation: sections.finalVerdict
    }
  };

  enrichReadingWithCategoryMeta(reading, cardFocus, p1, p2);

  return reading;
}

/**
 * Ensures legacy schema fields exist on a reading object (synthesized from sections if needed)
 */
function ensureLegacyFields(data) {
  if (!data) return;
  const sec = data.sections || {};
  const sum = data.summary || {};

  if (!data.archetype) {
    data.archetype = {
      title: sum.title || 'Cosmic Seeker',
      zodiacSign: 'Aries',
      element: 'Cosmic Ether',
      lifePathNumber: 7,
      coreGift: sum.label || 'Insightful Clarity',
      solarAlignment: 'Morning'
    };
  }

  if (!Array.isArray(data.palmHighlights) || data.palmHighlights.length === 0) {
    data.palmHighlights = [
      { line: 'Heart Line', observation: 'Gracefully curved contour', meaning: 'Emotional warmth and authenticity.' },
      { line: 'Head Line', observation: 'Clear, decisive arc', meaning: 'Sharp problem-solving and focus.' },
      { line: 'Life Line', observation: 'Resilient and energized', meaning: 'Steadfast vitality and inner resilience.' }
    ];
  }

  if (!data.personalityReflection) {
    data.personalityReflection = {
      title: 'Personality Reflection',
      summary: sec.present || 'Reflective, vibrant energy navigating life with authenticity.',
      traits: Array.isArray(sec.strengths) ? sec.strengths : ['Thoughtful and perceptive', 'Resilient and genuine']
    };
  }

  if (!data.strengthsAndGrowth) {
    data.strengthsAndGrowth = {
      title: 'Strengths & Growth',
      coreStrengths: Array.isArray(sec.strengths) ? sec.strengths.join(' ') : 'Authentic clarity and loyalty.',
      areasForGrowth: Array.isArray(sec.watchOutFor) ? sec.watchOutFor.join(' ') : 'Be mindful of rest and patience.'
    };
  }

  if (!data.careerAndLearning) {
    data.careerAndLearning = {
      title: 'Career & Learning Reflections',
      summary: sec.present || 'Goal-oriented and creative in professional endeavors.',
      idealEnvironments: 'Creative, collaborative, and low-drama settings.',
      learningStyle: 'Experiential and self-directed discovery.'
    };
  }

  if (!data.relationshipsAndCommunication) {
    data.relationshipsAndCommunication = {
      title: 'Relationships & Communication',
      summary: sec.present || 'Warm, sincere, and values depth in connections.',
      communicationStyle: 'Direct and emotionally perceptive.',
      connectionTip: sec.nextMove || 'Keep communication open, honest, and relaxed.'
    };
  }

  if (!data.futurePossibilities) {
    data.futurePossibilities = {
      title: 'Future Possibilities',
      summary: sec.future || 'An encouraging horizon of positive self-expansion.',
      upcomingThemes: [sec.future || 'Personal renewal', 'Positive momentum', 'Creative clarity']
    };
  }

  if (!data.practicalSuggestions) {
    data.practicalSuggestions = {
      title: 'Positive, Practical Suggestions',
      dailyPractices: [sec.nextMove || 'Pause for daily breathwork', 'Honor your personal rhythm'],
      reflectionPrompt: sec.nextMove || 'What path brings you calm momentum?',
      cosmicAffirmation: sec.finalVerdict || 'I walk forward with confidence and joy.'
    };
  }
}

/**
 * Ensures witty sections and top summary exist on a reading object (synthesized from legacy fields if needed)
 */
function ensureWittySections(data, cardFocus = 'dating_mood_on') {
  if (!data) return;

  if (!data.summary) {
    const dummyPerson = {
      name: data.archetype?.title || 'Seeker',
      lifePath: data.archetype?.lifePathNumber || 7,
      dob: '2000-01-01'
    };
    data.summary = calculateCategoryScores(cardFocus, dummyPerson);
  }

  if (!data.sections) {
    data.sections = {
      past: 'Looking back, your path has been shaped by valuable lessons and growth opportunities.',
      present: data.personalityReflection?.summary || 'You are standing in a grounded space of self-awareness and positive momentum.',
      future: data.futurePossibilities?.summary || 'Ahead lies a bright horizon of creative synthesis and genuine connection.',
      strengths: Array.isArray(data.personalityReflection?.traits) && data.personalityReflection.traits.length > 0
        ? data.personalityReflection.traits
        : ['✨ Deep intuitive awareness', '🌟 Genuine authenticity and loyalty'],
      watchOutFor: [
        '⚠️ Giving too much energy to fleeting concerns',
        '⚠️ Putting unnecessary pressure on immediate perfection'
      ],
      nextMove: data.relationshipsAndCommunication?.connectionTip || 'Take a moment today to do something that genuinely resets your energy.',
      finalVerdict: data.practicalSuggestions?.cosmicAffirmation || 'Trust your inner compass and keep moving forward with good humor.'
    };
  }
}

/**
 * Validates that an interpretation object adheres strictly to the required schema.
 * Supports both new witty schema and legacy schema.
 */
function validateReadingResult(data, cardFocus) {
  if (!data || typeof data !== 'object') return false;

  // New Witty Schema Validation
  if (data.summary && data.sections) {
    if (typeof data.summary.score !== 'number' || !data.summary.label || !data.summary.title) {
      return false;
    }
    if (!Array.isArray(data.summary.metrics) || data.summary.metrics.length !== 5) {
      return false;
    }
    for (const m of data.summary.metrics) {
      if (!m.label || typeof m.value !== 'number') return false;
    }

    const sec = data.sections;
    if (!sec.past || !sec.present || !sec.future || !sec.nextMove || !sec.finalVerdict) {
      return false;
    }
    if (!Array.isArray(sec.strengths) || sec.strengths.length === 0) {
      return false;
    }
    if (!Array.isArray(sec.watchOutFor) || sec.watchOutFor.length === 0) {
      return false;
    }

    // Auto-populate legacy fields so all existing readers/tests pass 100%
    ensureLegacyFields(data);
    return true;
  }

  // Legacy Schema Validation
  if (!data.archetype || typeof data.archetype !== 'object') return false;
  if (!Array.isArray(data.palmHighlights) || data.palmHighlights.length === 0) return false;

  for (const section of REQUIRED_SECTIONS) {
    if (!data[section] || typeof data[section] !== 'object') {
      return false;
    }
    if (!data[section].title) {
      return false;
    }
  }

  // Verify key fields in legacy sections
  if (!data.personalityReflection.summary || !Array.isArray(data.personalityReflection.traits)) {
    return false;
  }
  if (!data.strengthsAndGrowth.coreStrengths || !data.strengthsAndGrowth.areasForGrowth) {
    return false;
  }
  if (!data.careerAndLearning.summary || !data.careerAndLearning.idealEnvironments) {
    return false;
  }
  if (!data.relationshipsAndCommunication.summary || !data.relationshipsAndCommunication.communicationStyle) {
    return false;
  }
  if (!data.futurePossibilities.summary || !Array.isArray(data.futurePossibilities.upcomingThemes)) {
    return false;
  }
  if (!data.practicalSuggestions.reflectionPrompt || !data.practicalSuggestions.cosmicAffirmation) {
    return false;
  }

  // Ensure witty sections and summary are populated
  ensureWittySections(data, cardFocus);
  return true;
}

/**
 * Calls Google Gemini API with system instructions enforcing structured JSON output.
 * Persona: Clever, funny friend. Strictly enforces category content isolation.
 */
async function generateGeminiReading(clientData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const { name, dob, sunSign, lifePath, birthplace, timeBucket, palmImage, isDemoPalm, cardFocus } = clientData;
  const timeDesc = formatTimeBucket(timeBucket);
  const seekerName = name || 'Seeker';

  const systemInstruction = `You are a clever, funny, warm, and perceptive friend giving an entertaining astrology and palmistry reflection.
TONE & STYLE GUIDELINES:
1. Write in short, engaging, witty, personalized paragraphs in simple, natural English.
2. Sound like a clever, funny friend—never a formal astrologer, mystic guru, or textbook.
3. Use emojis, clear headings, snappy bullet points, and light jokes.
4. Avoid generic filler, repetitive sentences, overly dramatic claims, and complex vocabulary.
5. Include specific, useful reflection tips.
6. Include BOTH past-themed reflections AND future possibilities in every report.
7. CRITICAL ENTERTAINMENT & SAFETY RULE: Never present guesses as verified facts. Palm photos cannot reliably establish personality, history, compatibility, or future. Present readings strictly as entertainment and self-reflection.
8. CRITICAL PERSONALIZATION RULE: Generate unique, deeply personalized observations that directly incorporate the person's/people's submitted names, zodiac signs, life path numbers, birthplace, time of birth, and palm observations. NEVER reuse generic boilerplate, and NEVER use placeholder names like "abc", "xyz", "Seeker", "Partner", or "Counterpart" unless that is the exact name entered.
9. CATEGORY RESTRICTIONS (STRICTLY ENFORCED):
   - dating_mood_on (2 people): Focus EXCLUSIVELY on romantic chemistry, mutual sparks, dating vibes, green flags, romantic advice, and couple chemistry between Person 1 and Person 2. NO career, NO wealth, NO general friendship predictions.
   - bond_check (2 people): Focus EXCLUSIVELY on the friendship, teamwork, and bond dynamic between Person 1 and Person 2. Mutual trust, communication, duo strengths, funny duo personality label, resolving misunderstandings, future connection, and bond tips. NO romance unless explicitly requested, NO career or wealth predictions. The sample names "abc" and "xyz" must never appear unless those are actually the submitted names.
   - future_millionaire (1 person): Focus EXCLUSIVELY on career, learning, work style, financial habits, practical next steps, and funny career personality label. NO romance, NO compatibility. NEVER guarantee wealth or millionaire status.
   - karma_is_loading (1 person): Focus EXCLUSIVELY on personal growth, habits, choices, lessons, recurring challenges, strengths to build on, habits to change, small practical actions, and funny karma personality label. NO romance, NO career/wealth.
10. Return ONLY valid JSON matching the requested schema. No markdown code blocks, no backticks.`;

  const contentsParts = [];

  function attachPalmImage(img) {
    if (img && typeof img === 'string' && img.includes('base64,')) {
      try {
        const mimeMatch = img.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64Data = img.split('base64,')[1];
        if (base64Data && base64Data.length > 50) {
          contentsParts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }
      } catch {
        // Continue if image format parsing fails
      }
    }
  }

  let userPrompt = '';

  if (clientData.isTwoPerson && clientData.person1 && clientData.person2) {
    const p1 = clientData.person1;
    const p2 = clientData.person2;
    if (p1.palmImage && !p1.isDemoPalm) attachPalmImage(p1.palmImage);
    if (p2.palmImage && !p2.isDemoPalm) attachPalmImage(p2.palmImage);

    const isDating = cardFocus === 'dating_mood_on';
    userPrompt = isDating
      ? `Generate a witty, deeply personalized TWO-PERSON Dating Mood & Romantic Chemistry reading for:
- Category: dating_mood_on (Focus EXCLUSIVELY on romantic chemistry, mutual sparks, dating vibes, green flags, and romantic advice between these two people. No career/wealth predictions.)
- Person 1: Name: ${p1.name}, DOB: ${p1.dob || 'Not specified'}, Sign: ${p1.sunSign}, Life Path: ${p1.lifePath}, Birthplace: ${p1.birthplace}, Birth Time: ${formatTimeBucket(p1.timeBucket)}
- Person 2: Name: ${p2.name}, DOB: ${p2.dob || 'Not specified'}, Sign: ${p2.sunSign}, Life Path: ${p2.lifePath}, Birthplace: ${p2.birthplace}, Birth Time: ${formatTimeBucket(p2.timeBucket)}

CRITICAL PERSONALIZATION INSTRUCTIONS:
- You MUST explicitly weave both ${p1.name}'s and ${p2.name}'s names, their zodiac energies (${p1.sunSign} & ${p2.sunSign}), their life paths (${p1.lifePath} & ${p2.lifePath}), and their birthplaces into the past, present, and future sections.
- Never use placeholder names like "abc" or "xyz".
- If palm observations are available, weave mutual touch/warmth and palm line dynamics into the text.

Return ONLY pure JSON matching:
{
  "summary": {
    "title": "Dating Mood & Chemistry Check 💕",
    "score": 92,
    "label": "Playful Flirts Who Actually Match Each Other's Effort 🔥",
    "metrics": [
      { "label": "Communication", "value": 90 },
      { "label": "Emotional Awareness", "value": 87 },
      { "label": "Romantic Confidence", "value": 85 },
      { "label": "Openness", "value": 88 },
      { "label": "Growth Potential", "value": 94 }
    ]
  },
  "sections": {
    "past": "1-3 short witty sentences referencing both ${p1.name} and ${p2.name}, their signs, and how their early romantic sparks or dating patterns shaped this connection.",
    "present": "1-3 short witty sentences on their current romantic chemistry, banter, and mutual vibe.",
    "future": "1-3 short witty sentences on future romantic possibilities for them together.",
    "strengths": ["bullet 1 with emoji referencing both people", "bullet 2 with emoji", "bullet 3 with emoji", "bullet 4 with emoji"],
    "watchOutFor": ["dating trap 1 with emoji", "dating trap 2 with emoji", "dating trap 3 with emoji"],
    "nextMove": "1-2 practical tips for an exciting, authentic date or connection.",
    "nextMoveList": ["action 1", "action 2", "action 3", "action 4"],
    "verdictHeadline": "A Strong & Promising Match!",
    "finalVerdict": "One memorable, witty romantic closing verdict line celebrating ${p1.name} and ${p2.name}."
  },
  "archetype": {
    "title": "${p1.name} & ${p2.name} · Romantic Chemistry",
    "zodiacSign": "${p1.sunSign} & ${p2.sunSign}",
    "element": "Chemistry",
    "lifePathNumber": "${p1.lifePath} & ${p2.lifePath}",
    "coreGift": "Mutual Sparks & Romantic Warmth",
    "solarAlignment": "Magnetic"
  },
  "palmHighlights": [
    { "line": "Dual Heart Line Romantic Harmony", "observation": "Passionate curvature aligned between both hands", "meaning": "High reciprocal affection and romantic safety." },
    { "line": "Venus Mount Passion & Warmth", "observation": "Warm energized base contours", "meaning": "Affectionate touch, mutual attraction, and thoughtful romantic gestures." },
    { "line": "Head Line Intellectual Sparks", "observation": "Complementary arches", "meaning": "Effortless verbal banter and shared humor." }
  ]
}`
      : `Generate a witty, deeply personalized TWO-PERSON Bond Check reading for:
- Category: bond_check (Focus EXCLUSIVELY on the friendship, synergy, teamwork, and bond dynamic between these two people. No career/wealth predictions. No romance unless requested.)
- Person 1: Name: ${p1.name}, DOB: ${p1.dob || 'Not specified'}, Sign: ${p1.sunSign}, Life Path: ${p1.lifePath}, Birthplace: ${p1.birthplace}, Birth Time: ${formatTimeBucket(p1.timeBucket)}
- Person 2: Name: ${p2.name}, DOB: ${p2.dob || 'Not specified'}, Sign: ${p2.sunSign}, Life Path: ${p2.lifePath}, Birthplace: ${p2.birthplace}, Birth Time: ${formatTimeBucket(p2.timeBucket)}

CRITICAL PERSONALIZATION INSTRUCTIONS:
- You MUST explicitly personalize the Past, Present, Future, Combined Strengths, Things to Watch For, and Bond Tips using both ${p1.name}'s and ${p2.name}'s details, their signs (${p1.sunSign} & ${p2.sunSign}), life paths (${p1.lifePath} & ${p2.lifePath}), and birthplaces.
- The sample names "abc" and "xyz" must NEVER appear unless those are actually the submitted names.
- Focus on unshakeable loyalty, comedic chemistry, resolving misunderstandings, and mutual support.

Return ONLY pure JSON matching:
{
  "summary": {
    "title": "Bond Check & Duo Synergy Index ⭐",
    "score": 91,
    "label": "Partners in Controlled Chaos 😂",
    "metrics": [
      { "label": "Mutual Trust", "value": 93 },
      { "label": "Vibe Synergy", "value": 90 },
      { "label": "Communication Flow", "value": 86 },
      { "label": "Shared Humor", "value": 96 },
      { "label": "Conflict Resolution", "value": 84 }
    ]
  },
  "sections": {
    "past": "1-3 short witty sentences on how ${p1.name} and ${p2.name}'s dynamic formed, highlighting shared adventures or lessons.",
    "present": "1-3 short witty sentences on their current connection, humor, and mutual understanding.",
    "future": "1-3 short witty sentences on future possibilities for their duo partnership.",
    "strengths": ["bullet 1 with emoji highlighting combined strength of ${p1.name} and ${p2.name}", "bullet 2 with emoji", "bullet 3 with emoji", "bullet 4 with emoji"],
    "watchOutFor": ["misunderstanding trap 1 with emoji", "misunderstanding trap 2 with emoji", "misunderstanding trap 3 with emoji"],
    "nextMove": "1-2 practical tips for keeping their bond healthy, low-stress, and fun.",
    "nextMoveList": ["action 1", "action 2", "action 3", "action 4"],
    "verdictHeadline": "A Strong & Balanced Bond!",
    "finalVerdict": "One memorable, witty closing verdict line celebrating ${p1.name} and ${p2.name}."
  },
  "archetype": {
    "title": "${p1.name} & ${p2.name} · Cosmic Bond",
    "zodiacSign": "${p1.sunSign} & ${p2.sunSign}",
    "element": "Synergy",
    "lifePathNumber": "${p1.lifePath} & ${p2.lifePath}",
    "coreGift": "Shared Laughter & Mutual Support",
    "solarAlignment": "Harmonious"
  },
  "palmHighlights": [
    { "line": "Dual Heart Line Alignment", "observation": "Curving contours harmonizing in depth", "meaning": "High emotional safety, genuine warmth, and easy mutual forgiveness." },
    { "line": "Venus Mount Harmony", "observation": "Vibrant base contours on both hands", "meaning": "Shared love for good food, humor, and easy hangouts." },
    { "line": "Head Line Synergy", "observation": "Complementary arches", "meaning": "One brings creative sparks, the other grounding clarity." }
  ]
}`;
  } else {
    // Single Person Prompt
    if (palmImage && !isDemoPalm) attachPalmImage(palmImage);

    const activeCat = cardFocus || 'dating_mood_on';

    const catInstructions = {
      dating_mood_on: {
        theme: 'Dating Mood On',
        title: 'Dating Mood Vibe Check 💕',
        rules: 'Focus exclusively on romantic life, dating patterns, emotional connection, green/red flags, practical dating tips. NO career or wealth.',
        metricNames: ['Communication', 'Emotional Awareness', 'Romantic Confidence', 'Openness', 'Growth Potential'],
        sampleLabel: 'Hopeless Romantic With High Standards',
        headline: 'A Strong & Promising Romantic Vibe!'
      },
      future_millionaire: {
        theme: 'Future Millionaire',
        title: 'Career & Wealth Blueprint 💰',
        rules: 'Focus exclusively on career, work style, learning, financial habits, practical next steps. NO romance. Never guarantee wealth or millionaire status.',
        metricNames: ['Career Drive', 'Money Mindfulness', 'Skill Adaptability', 'Strategic Focus', 'Breakthrough Potential'],
        sampleLabel: 'The High-Impact Visionary ⚡',
        headline: 'You have a real "Millionaire Mindset"!'
      },
      karma_is_loading: {
        theme: 'Karma Is Loading',
        title: 'Karma & Life Lessons Report 🔥',
        rules: 'Focus exclusively on personal growth, habits, choices, lessons, recurring challenges, habits worth changing, small actions. NO romance, NO career/wealth.',
        metricNames: ['Self-Awareness', 'Resilience', 'Habit Discipline', 'Emotional Balance', 'Destiny Alignment'],
        sampleLabel: 'The Grounded Philosopher 🌿',
        headline: 'Your karma is in a "Reset & Grow" phase!'
      }
    };

    const cat = catInstructions[activeCat] || catInstructions.dating_mood_on;

    userPrompt = `Generate a witty, deeply personalized single-person reflection for:
- Seeker: ${seekerName}
- Date of Birth: ${dob || 'Not specified'}
- Tropical Sun Sign: ${sunSign}
- Life Path: ${lifePath}
- City: ${birthplace || 'Not specified'}
- Birth Time: ${timeDesc}
- Category: ${cat.theme} (${cat.rules})

CRITICAL PERSONALIZATION INSTRUCTIONS:
- You MUST weave ${seekerName}'s exact name, their zodiac sign (${sunSign}), Life Path (${lifePath}), and birthplace (${birthplace}) into the reflection paragraphs.
- Never use placeholder names or generic boilerplate sentences.
- Strictly adhere to category boundaries. For Future Millionaire, focus on career skills, learning, and smart money habits without guaranteeing wealth. For Karma Is Loading, focus on personal choices, self-awareness, and breaking old patterns.

Return ONLY pure JSON matching:
{
  "summary": {
    "title": "${cat.title}",
    "score": 88,
    "label": "${cat.sampleLabel}",
    "metrics": [
      { "label": "${cat.metricNames[0]}", "value": 88 },
      { "label": "${cat.metricNames[1]}", "value": 84 },
      { "label": "${cat.metricNames[2]}", "value": 80 },
      { "label": "${cat.metricNames[3]}", "value": 85 },
      { "label": "${cat.metricNames[4]}", "value": 91 }
    ]
  },
  "sections": {
    "past": "1-3 short witty sentences referencing ${seekerName}'s background, early lessons, and how their ${sunSign} nature shaped past patterns.",
    "present": "1-3 short witty sentences on their current vibe, habits, and mindset.",
    "future": "1-3 short witty sentences on future possibilities in this specific category.",
    "strengths": ["bullet 1 with emoji referencing ${seekerName}'s strengths", "bullet 2 with emoji", "bullet 3 with emoji", "bullet 4 with emoji"],
    "watchOutFor": ["trap 1 with emoji", "trap 2 with emoji", "trap 3 with emoji"],
    "nextMove": "1-2 practical, specific reflection tips.",
    "nextMoveList": ["action 1", "action 2", "action 3", "action 4"],
    "verdictHeadline": "${cat.headline}",
    "finalVerdict": "One memorable, witty closing punchline for ${seekerName}."
  },
  "archetype": {
    "title": "${seekerName} · The Strategic Builder",
    "zodiacSign": "${sunSign}",
    "element": "Fire & Air",
    "lifePathNumber": ${lifePath},
    "coreGift": "Intuitive Clarity",
    "solarAlignment": "${timeDesc.split(' ')[0] || 'Morning'}"
  },
  "palmHighlights": [
    { "line": "Heart Line", "observation": "Gently rising curve", "meaning": "Warm, generous nature and loyalty." },
    { "line": "Head Line", "observation": "Clear horizontal span", "meaning": "Crisp discernment and strategic creativity." },
    { "line": "Life Line", "observation": "Steady open contour", "meaning": "Resilient stamina and adaptability." }
  ]
}`;
  }

  contentsParts.push({ text: userPrompt });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: 'user',
        parts: contentsParts
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  };

  const models = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini API error [${model}] status ${response.status}: ${errorText.slice(0, 150)}`);
        continue;
      }

      const result = await response.json();
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastError = new Error('Empty response part from Gemini');
        continue;
      }

      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      const p1 = clientData.isTwoPerson ? clientData.person1 : clientData;
      const p2 = clientData.isTwoPerson ? clientData.person2 : null;
      enrichReadingWithCategoryMeta(parsed, clientData.cardFocus, p1, p2);

      if (validateReadingResult(parsed, clientData.cardFocus)) {
        parsed.meta = {
          generatedAt: new Date().toISOString(),
          provider: 'google-gemini',
          model: model,
          mode: 'live',
          cardFocus: clientData.cardFocus
        };
        return parsed;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) {
    console.warn('[gemini_api_warning] Live call did not succeed:', lastError.message);
  }
  return null;
}

/**
 * Main orchestration entry point
 */
async function getReading(clientData) {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    try {
      const liveResult = await generateGeminiReading(clientData);
      if (liveResult) {
        return liveResult;
      }
    } catch (err) {
      console.error('[reading_orchestration] Live interpretation failed:', err.message);
    }
    // When API key is configured and live call did not succeed:
    // Strictly adhere to Requirement 6: Do not present generic fallback text as a personalized AI result!
    throw new Error('Cosmic AI interpretation service is temporarily unavailable. Please try again.');
  }

  return generateMockReading(clientData);
}

module.exports = {
  validateClientPayload,
  validateReadingResult,
  generateMockReading,
  calculateCategoryScores,
  getReading,
  formatTimeBucket,
  REQUIRED_SECTIONS
};
