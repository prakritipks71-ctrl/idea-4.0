# PROJECT RULES: AI Jyotish

These rules are mandatory and must be strictly followed for every task in the **AI Jyotish** project.

---

## 1. Project Overview & Concept
- **Name:** AI Jyotish
- **Purpose:** A fun, mobile-first web app offering lighthearted, warm, funny, and 100% positive astrology and palmistry readings in **Hinglish** (Hindi written in English alphabet, e.g., *"Aapka future ekdum bright hai"*).
- **Core Experience:**
  1. Visitor enters first name, birthday, and birthplace (with optional birth time).
  2. Visitor can optionally upload a palm photo.
  3. Visitor watches animated named "AI agents" collaborate (e.g., *Nakshatra Navigator*, *Hasta Rekha Pandit*, *Kismet Kavi*).
  4. Visitor gets an entertaining, uplifting reading.

---

## 2. Tech Stack & Architecture
- **Frontend:** Plain HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+). No heavy client frameworks.
- **Backend:** Lightweight Node.js + Express server.
- **Storage & Auth:** No user login. No database for readings. The system is stateless.
- **Configuration:** Environment variables stored in `.env` (ignored in `.gitignore`).

---

## 3. The 8 Hard Rules

### Rule 1: Safety & Absolute Positivity (PG Only)
- **Zero Negativity:** Never generate or display anything negative, distressing, or alarming.
- **Forbidden Topics:** No illness, death, accidents, failure, exams, breakups, relationship conflict, financial loss, debt, or bad luck.
- **No Romantic or Health Advice:** No matchmaking guarantees, dating/romance claims, or health/medical diagnoses/prescriptions.
- **Tone:** PG-rated, wholesome, playful, witty, and warmly reassuring at all times.

### Rule 2: Mandatory Disclaimer
- Every result screen and reading display must clearly and prominently show:
  > **"For fun only"**

### Rule 3: Privacy & Zero PII to Server
- **Client-Side Derivations:**
  - Sun sign is calculated in the browser.
  - Numerology Life-Path number is calculated in the browser.
  - Time of birth is converted to a coarse bucket in the browser (e.g., Morning, Afternoon, Evening, Night).
- **Forbidden Payloads:** The user's **first name** and full **date of birth** must **NEVER** be sent to the backend server.
- **Allowed Server Payload:** Only anonymous derived values:
  - `sunSign` (string)
  - `lifePathNumber` (number)
  - `timeBucket` (string)
  - `birthplace` (sanitized string, max 40 characters)
  - Optional sanitized palm image (see Rule 4)
- First name is stitched back into the reading on the client side only.

### Rule 4: Palm Image Privacy & Processing
- **Client-Side Sanitization:** The uploaded palm photo must be resized in the browser using HTML5 Canvas to approximately **768px on the longest side** and re-encoded as JPEG. This strips all EXIF metadata (GPS location, camera details, timestamps).
- **In-Memory Server Processing:** The backend processes the image buffer purely in memory.
- **No Persistence:** Palm images are **NEVER** saved to disk, filesystem, persistent storage, logs, or any database.

### Rule 5: Strict Telemetry & Log Sanitization
- Server and console logs may **only** record high-level event names and execution timings (e.g., `event=agent_pipeline_start`, `event=reading_complete duration_ms=450`).
- Logs must **never** contain names, dates of birth, birthplaces, coordinates, or image data.

### Rule 6: Mock Mode & Secret Management
- The app must work seamlessly out of the box in **MOCK MODE** without requiring any external AI API keys.
- Real API keys (if used) must only live in `.env` on the server and must never be exposed to the browser or checked into source control.

### Rule 7: Mobile-First Design & Theme
- **Color Palette:**
  - Background: Dark ink-blue (`#19173D`)
  - Typography / Body Text: Light paper (`#F7F6F2`)
  - Primary CTA / Buttons: Vibrant blue-to-purple gradient (`#62BBF3` to `#4E308D`)
- **Ergonomics & Layout:**
  - Minimum tap target size: 44px by 44px for buttons, inputs, and clickable elements.
  - Zero horizontal scrolling on any screen.
  - Flawless responsiveness starting from 375px × 812px (mobile viewport) up to desktop displays.

### Rule 8: Code Clarity & Documentation
- Keep code clean, modular, and well-commented so beginners can easily follow the flow.
- After every task, provide a 3 to 5 simple sentence summary explaining what was built and how to run or test it.
