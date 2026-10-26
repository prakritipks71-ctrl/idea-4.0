# AI Jyotish 🔮✋

An English-first, mobile-responsive cosmic astrology and palmistry self-reflection web app powered by Google Gemini API (with a seamless zero-budget fallback mock engine).

Built strictly in accordance with [PROJECT_RULES.md](PROJECT_RULES.md).

---

## 🌟 Highlights & Features

- **English-First Experience:** Professional, uplifting, and accessible self-reflection with zero jargon.
- **Mystical Aesthetic:** Dark navy & cosmic purple palette (`#09081C`), subtle warm gold accents (`#F3D17A`), elegant typography (Cinzel & Outfit), glassmorphism cards, and preserved ambient animations.
- **5 Screen Journey:**
  1. **Welcome Screen:** Engaging introduction, clear "Start Reading" action, and prominent self-reflection disclaimers.
  2. **Personal Details Form:** First name, Date of Birth (calendar and manual bounds validation), required Birthplace (city), and required accurate Time of Birth (HH:MM time picker). Supports dual-person mode for connection cards.
  3. **Palm Photo Upload Screen:** In-browser image guidelines, live preview, and HTML5 Canvas sanitization (resizes to max 768px, strips EXIF data). Requires real uploaded palm photos for authentic hand analysis.
  4. **Loading Screen:** Mystical rotating gyro-loader with animated cycling progress messages.
  5. **Results Dashboard:** Personalized Archetype card, Palm Highlights (Heart, Head, Life lines), and 5 structured self-reflection sections:
     - *Personality Reflection*
     - *Career & Learning*
     - *Relationships & Empathy*
     - *Personal Growth & Mindfulness*
     - *General Reflection & Daily Affirmation*
- **UX Delights:** Step indicator breadcrumbs, back navigation, friendly empty/retry states, copy summary with toast feedback, and a "Start New Reading" reset button.
- **Zero Budget & Gemini API Integration:**
  - Secure backend endpoint `POST /api/reading` calls Gemini (`gemini-2.5-flash` / `gemini-1.5-flash`) via server-side `GEMINI_API_KEY`.
  - Never exposes API keys to client-side code.
  - Automatically falls back to an intelligent, contextual mock interpretation engine if no key is configured or quota is exceeded.
- **Privacy & Safety First:**
  - Zero PII persisted: user names and birth dates never touch disk or databases.
  - Palm images processed in-memory only.
  - Present palmistry strictly for entertainment and introspective self-reflection.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```
*(If `GEMINI_API_KEY` is omitted, the app runs smoothly in zero-budget **Mock Mode**).*

### 3. Run the App
```bash
npm start
```
Then visit **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Test Suite
```bash
npm test
```
All 37 test cases (zodiac boundaries, payload validation, mock engine schema adherence) run using Node's built-in test runner.

---

## 📁 Project Structure

```text
├── core/
│   ├── rashi.js               # Tropical zodiac calculation logic
│   └── readingService.js       # Gemini API client, schema validation & mock engine
├── public/
│   ├── index.html             # Semantic 5-screen markup & accessibility structure
│   ├── style.css              # Dark navy/purple theme, gold accents & animations
│   └── app.js                 # Screen router, canvas sanitization & API integration
├── test/
│   ├── rashi.test.js          # Boundary tests for zodiac signs
│   └── reading.test.js        # Validation and mock engine schema tests
├── server.js                  # Express backend & secure /api/reading endpoint
├── PROJECT_RULES.md           # Safety, privacy & architectural guidelines
├── package.json               # Scripts & dependencies
└── .gitignore                 # Excludes .env, node_modules, and logs
```
