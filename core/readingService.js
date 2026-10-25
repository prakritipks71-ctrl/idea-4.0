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
 * - Validates structured JSON schema output across all required sections before sending to frontend.
 * - Provides rich, high-quality contextual mock fallback when GEMINI_API_KEY is not set.
 */

const getSunSign = require('./rashi');

// Structured Schema sections for runtime validation
const REQUIRED_SECTIONS = [
  'personalityReflection',
  'strengthsAndGrowth',
  'careerAndLearning',
  'relationshipsAndCommunication',
  'futurePossibilities',
  'practicalSuggestions'
];

/**
 * Validates the inbound payload from client
 */
function validateClientPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' };
  }

  // 1. User's Name (sanitized string, max 50 characters)
  const rawName = (body.name || body.firstName || 'Seeker').toString().trim();
  const sanitizedName = rawName.slice(0, 50).replace(/[<>]/g, '');

  // 2. Date of Birth (YYYY-MM-DD from calendar or DD/MM/YYYY)
  const rawDob = (body.dob || '').toString().trim();
  let day, month, year;
  let sunSign = body.sunSign;
  let lifePath = body.lifePath;

  if (rawDob) {
    // Check YYYY-MM-DD first (standard HTML5 date input)
    const ymdMatch = rawDob.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10);
      month = parseInt(ymdMatch[2], 10);
      day = parseInt(ymdMatch[3], 10);
    } else {
      // Check DD/MM/YYYY
      const dmyMatch = rawDob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmyMatch) {
        day = parseInt(dmyMatch[1], 10);
        month = parseInt(dmyMatch[2], 10);
        year = parseInt(dmyMatch[3], 10);
      }
    }
  }

  // Derive sunSign if not provided
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

  // Derive lifePath if not provided
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

  // 3. Birthplace (Optional) and Time Bucket
  const sanitizedPlace = (body.birthplace || 'Not specified').toString().slice(0, 50).replace(/[<>]/g, '').trim();
  const safeTimeBucket = ['morning', 'afternoon', 'evening', 'night', 'unknown', 'unsure', 'subah', 'dopahar', 'shaam', 'raat', 'pata_nahi'].includes(body.timeBucket)
    ? body.timeBucket
    : 'unknown';

  // 4. Palm Image validation (Check base64 format and size limit of 10MB)
  let palmImage = null;
  if (body.palmImage && typeof body.palmImage === 'string') {
    if (body.palmImage.length > 10 * 1024 * 1024) {
      return { valid: false, error: 'Palm image exceeds maximum allowed payload size (10MB).' };
    }
    if (body.palmImage.startsWith('data:image/') || body.palmImage.includes('base64,')) {
      palmImage = body.palmImage;
    }
  }

  return {
    valid: true,
    data: {
      name: sanitizedName,
      dob: rawDob,
      sunSign: sunSign.trim(),
      lifePath: lifePathNum,
      birthplace: sanitizedPlace,
      timeBucket: safeTimeBucket,
      palmImage: palmImage,
      isDemoPalm: Boolean(body.isDemoPalm)
    }
  };
}

/**
 * Formats time bucket into clean English descriptor
 */
function formatTimeBucket(key) {
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
  return map[key] || 'Solar Unknown';
}

/**
 * Generates an intelligent, rich mock reading based on derived traits.
 * Zero-budget guarantee: Always works seamlessly without external keys or network.
 */
function generateMockReading(data) {
  const { name, sunSign, lifePath, timeBucket } = data;
  const capitalizedSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();
  const seekerName = name || 'Seeker';

  const signArchetypes = {
    Aries: { title: 'The Inspired Trailblazer', element: 'Fire', gift: 'Courageous Initiative' },
    Taurus: { title: 'The Grounded Architect', element: 'Earth', gift: 'Steadfast Loyalty' },
    Gemini: { title: 'The Curious Storyteller', element: 'Air', gift: 'Agile Adaptability' },
    Cancer: { title: 'The Intuitive Guardian', element: 'Water', gift: 'Deep Empathy' },
    Leo: { title: 'The Radiant Luminary', element: 'Fire', gift: 'Generous Warmth' },
    Virgo: { title: 'The Thoughtful Craftsman', element: 'Earth', gift: 'Discerning Precision' },
    Libra: { title: 'The Harmonious Diplomat', element: 'Air', gift: 'Balanced Perception' },
    Scorpio: { title: 'The Transformative Seeker', element: 'Water', gift: 'Profound Insight' },
    Sagittarius: { title: 'The Cosmic Explorer', element: 'Fire', gift: 'Philosophical Optimism' },
    Capricorn: { title: 'The Purposeful Summit-Seeker', element: 'Earth', gift: 'Quiet Resilience' },
    Aquarius: { title: 'The Visionary Catalyst', element: 'Air', gift: 'Inventive Altruism' },
    Pisces: { title: 'The Dream-Weaver', element: 'Water', gift: 'Imaginative Compassion' }
  };

  const archetype = signArchetypes[capitalizedSign] || {
    title: 'The Inquisitive Wayfarer',
    element: 'Cosmic Ether',
    gift: 'Reflective Clarity'
  };

  const timeInfluence = formatTimeBucket(timeBucket);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      provider: 'mock-engine',
      mode: 'mock'
    },
    archetype: {
      title: archetype.title,
      zodiacSign: capitalizedSign,
      element: archetype.element,
      lifePathNumber: lifePath,
      coreGift: archetype.gift,
      solarAlignment: timeInfluence
    },
    palmHighlights: [
      {
        line: 'Heart Line',
        observation: 'Deep, gently curving upward toward Jupiter mount',
        meaning: 'Suggests a generous emotional nature with a strong instinct for loyalty and heartfelt connection.'
      },
      {
        line: 'Head Line',
        observation: 'Crisp, extending across the palm with a subtle creative slope',
        meaning: 'Indicates a balance of analytical discernment and innovative, creative intuition.'
      },
      {
        line: 'Life Line',
        observation: 'Broad arc with clear vitality markings and smooth contour',
        meaning: 'Reflects steady energy reserves, adaptability through change, and resilient inner fortitude.'
      }
    ],
    personalityReflection: {
      title: 'Personality Reflection',
      summary: `${seekerName}, you carry the vibrant signature of ${capitalizedSign} harmonized with the reflective depth of Life Path ${lifePath}. You naturally perceive nuance in everyday encounters, guided by an inner compass that seeks genuine purpose over fleeting applause.`,
      traits: [
        'Naturally observant and thoughtful before voicing opinions',
        'Strong sense of integrity and authentic connection with peers',
        'Recharges energy effectively through calm moments of introspection'
      ]
    },
    strengthsAndGrowth: {
      title: 'Strengths & Areas for Growth',
      coreStrengths: 'Focused dedication, compassionate listening, and the ability to maintain clarity when navigating complex decisions.',
      areasForGrowth: 'Give yourself permission to celebrate intermediate milestones rather than rushing toward perfection, and practice voicing your own needs as openly as you support others.'
    },
    careerAndLearning: {
      title: 'Career & Learning Reflections',
      summary: `In your professional journey, you thrive when daily actions connect to a meaningful, tangible outcome. With your ${archetype.element.toLowerCase()} elemental resonance, repetitive routine drains your vitality, whereas creative problem-solving sparks your best work.`,
      idealEnvironments: 'Collaborative, low-drama environments where craft excellence, trust, and autonomy are valued.',
      learningStyle: 'Hands-on experimentation combined with reflective synthesis. You learn most deeply by testing ideas, observing results, and refining.'
    },
    relationshipsAndCommunication: {
      title: 'Relationships & Communication',
      summary: 'You value depth, trust, and sincerity in your circle. While you engage easily in conversation, your truest warmth is reserved for those who demonstrate mutual authenticity.',
      communicationStyle: 'Direct yet considerate; you listen intently to tone, emotional cadence, and unspoken context.',
      connectionTip: 'Clear, gentle boundaries safeguard your natural generosity, allowing relationships to flourish without emotional fatigue.'
    },
    futurePossibilities: {
      title: 'General Future Possibilities',
      summary: 'Your astrological and palm patterns reflect an open horizon of creative development. The upcoming season highlights opportunities to bridge technical skill with empathetic leadership.',
      upcomingThemes: [
        'Creative synthesis: Bringing together seemingly distinct skills or hobbies into a unified project',
        'Expanding community: Forming collaborative alliances built on mutual respect and shared values',
        'Personal renewal: Establishing grounded routines that nurture both mental clarity and physical vitality'
      ]
    },
    practicalSuggestions: {
      title: 'Positive, Practical Suggestions',
      dailyPractices: [
        'Start your morning with a 5-minute quiet pause or breathing practice before opening notifications',
        'Take regular walks in open air to reset focus and stimulate creative reflection',
        'Keep a brief gratitude or insight journal to anchor daily learnings'
      ],
      reflectionPrompt: `What is one pursuit that currently brings you a sense of calm momentum and joyful focus?`,
      cosmicAffirmation: 'I trust my inner wisdom, honor my unique rhythm, and step forward with quiet confidence and clear intention.'
    }
  };
}

/**
 * Validates that an interpretation object adheres strictly to the required schema.
 */
function validateReadingResult(data) {
  if (!data || typeof data !== 'object') return false;
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

  // Verify key fields in each section
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

  return true;
}

/**
 * Calls Google Gemini API with system instructions enforcing structured JSON output.
 * Uses official Gemini v1beta endpoint with server-side GEMINI_API_KEY.
 */
async function generateGeminiReading(clientData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    // Graceful fallback to mock mode
    return null;
  }

  const { name, dob, sunSign, lifePath, birthplace, timeBucket, palmImage, isDemoPalm } = clientData;
  const timeDesc = formatTimeBucket(timeBucket);
  const seekerName = name || 'Seeker';

  const systemInstruction = `You are a gentle, insightful AI Jyotish and Palmistry Interpreter.
Your mission is to provide an uplifting, 100% positive, English-language self-reflection reading.
CRITICAL SAFETY, PRIVACY & ENTERTAINMENT RULES:
1. Tone must be warm, PG-rated, inspiring, psychological, and reflective.
2. Palmistry and astrology are presented strictly for entertainment and introspective self-reflection.
3. NEVER make frightening, fatalistic, or guaranteed claims about the future. Do not claim AI can know someone's actual past or guarantee their future.
4. STRICTLY FORBIDDEN: No medical advice, no health diagnoses, no relationship conflict/breakup warnings, no death/illness predictions, no financial debt/gambling/failure predictions.
5. Emphasize self-agency, personal strengths, resilience, constructive growth, and mindful living.
6. Return ONLY valid JSON adhering exactly to the requested schema. No markdown backticks, no markdown codeblocks, only pure JSON.`;

  const userPrompt = `Generate a personalized, uplifting astrological and palmistry reflection for:
- Seeker's Name: ${seekerName}
- Date of Birth: ${dob || 'Not specified'}
- Tropical Sun Sign: ${sunSign}
- Life Path Number: ${lifePath}
- Birthplace (City): ${birthplace || 'Not specified'}
- Time of Birth Period: ${timeDesc}
- Palm Photo Included: ${palmImage && !isDemoPalm ? 'Yes (attached as image)' : 'Synthesized / Demo Palm'}

Required JSON Schema:
{
  "archetype": {
    "title": "string (e.g. The Grounded Architect)",
    "zodiacSign": "string (e.g. Taurus)",
    "element": "string (e.g. Earth)",
    "lifePathNumber": number,
    "coreGift": "string (e.g. Steadfast Wisdom & Creative Focus)",
    "solarAlignment": "string (strictly single word, e.g. Morning, Afternoon, Evening, Night, or Unknown)"
  },
  "palmHighlights": [
    { "line": "Heart Line", "observation": "string", "meaning": "string" },
    { "line": "Head Line", "observation": "string", "meaning": "string" },
    { "line": "Life Line", "observation": "string", "meaning": "string" }
  ],
  "personalityReflection": {
    "title": "Personality Reflection",
    "summary": "string addressing ${seekerName} warmly",
    "traits": ["string", "string", "string"]
  },
  "strengthsAndGrowth": {
    "title": "Strengths & Areas for Growth",
    "coreStrengths": "string",
    "areasForGrowth": "string (constructive, gentle, positive encouragement)"
  },
  "careerAndLearning": {
    "title": "Career & Learning Reflections",
    "summary": "string",
    "idealEnvironments": "string",
    "learningStyle": "string"
  },
  "relationshipsAndCommunication": {
    "title": "Relationships & Communication",
    "summary": "string",
    "communicationStyle": "string",
    "connectionTip": "string"
  },
  "futurePossibilities": {
    "title": "General Future Possibilities",
    "summary": "string (positive, open-ended possibilities, not guaranteed predictions)",
    "upcomingThemes": ["string", "string", "string"]
  },
  "practicalSuggestions": {
    "title": "Positive, Practical Suggestions",
    "dailyPractices": ["string", "string", "string"],
    "reflectionPrompt": "string (thoughtful question for personal contemplation)",
    "cosmicAffirmation": "string (encouraging daily affirmation)"
  }
}`;

  // Assemble Gemini multimodal contents
  const contentsParts = [];

  // If user provided a sanitized base64 palm image, include it as inline data
  if (palmImage && !isDemoPalm && palmImage.includes('base64,')) {
    try {
      const mimeMatch = palmImage.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = palmImage.split('base64,')[1];

      if (base64Data && base64Data.length > 50) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
    } catch {
      // In case of parsing issue, continue with prompt
    }
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

  // Try gemini-2.5-flash first, then gemini-1.5-flash as fallback
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
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
        signal: AbortSignal.timeout(15000)
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

      // Parse JSON (strip accidental markdown code wrappers if any)
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (validateReadingResult(parsed)) {
        parsed.meta = {
          generatedAt: new Date().toISOString(),
          provider: 'google-gemini',
          model: model,
          mode: 'live'
        };
        return parsed;
      }
    } catch (err) {
      lastError = err;
    }
  }

  // If live calls failed, return null to trigger mock fallback
  if (lastError) {
    // Rule 5: Keep logs sanitized; never log API key
    console.warn('[gemini_api_warning] Live call did not succeed, falling back to mock engine.');
  }
  return null;
}

/**
 * Main orchestration entry point
 */
async function getReading(clientData) {
  // If GEMINI_API_KEY is configured, attempt live generation
  if (process.env.GEMINI_API_KEY) {
    try {
      const liveResult = await generateGeminiReading(clientData);
      if (liveResult) {
        return liveResult;
      }
    } catch (err) {
      console.warn('[reading_orchestration] Live interpretation failed; using mock fallback.');
    }
  }

  // Seamless zero-budget mock engine
  return generateMockReading(clientData);
}

module.exports = {
  validateClientPayload,
  validateReadingResult,
  generateMockReading,
  getReading,
  formatTimeBucket,
  REQUIRED_SECTIONS
};
