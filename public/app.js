/**
 * AI Jyotish - Client Application Controller
 *
 * English-first cosmic astrology and palmistry self-reflection.
 * Implements:
 * - Clean screen navigation (Welcome -> Details -> Palm -> Loading -> Results)
 * - In-browser Astrological and Numerology derivations (Rule 3: Zero PII to server)
 * - In-browser HTML5 Canvas palm image sanitization (resizes to max 768px, strips EXIF)
 * - Demo Palm generation with synthetic contours for instant testing
 * - Cycling animated loading messages & glowing progress bar
 * - Secure communication with /api/reading (Gemini AI / zero-budget mock engine)
 * - Runtime JSON response validation
 * - Dynamic rendering of all 5 reflection sections + palm highlights
 * - Copy summary to clipboard + toast feedback
 * - Start new reading state reset
 */

// Storage Keys (sessionStorage only, never store raw photos in storage)
const STORAGE_KEYS = {
  FIRST_NAME: 'ai_jyotish_first_name',
  DOB: 'ai_jyotish_dob',
  BIRTHPLACE: 'ai_jyotish_birthplace',
  TIME_BUCKET: 'ai_jyotish_time_bucket',
  SUN_SIGN: 'ai_jyotish_sun_sign',
  LIFE_PATH: 'ai_jyotish_life_path'
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('[app_init] AI Jyotish cosmic reflection system active');

  // DOM Elements - Screens
  const screens = {
    welcome: document.getElementById('screen-welcome'),
    details: document.getElementById('screen-details'),
    palm: document.getElementById('screen-palm'),
    loading: document.getElementById('screen-loading'),
    results: document.getElementById('screen-results'),
    error: document.getElementById('screen-error')
  };

  // DOM Elements - Welcome Screen
  const btnStart = document.getElementById('btn-start');

  // DOM Elements - Details Screen
  const btnBackToWelcome = document.getElementById('btn-back-to-welcome');
  const detailsForm = document.getElementById('details-form');
  const inputFirstName = document.getElementById('input-first-name');
  const inputDob = document.getElementById('input-dob');
  const inputBirthplace = document.getElementById('input-birthplace');
  const timeChips = document.querySelectorAll('.chip-btn');
  const btnNextToPalm = document.getElementById('btn-next-to-palm');

  const hintFirstName = document.getElementById('hint-first-name');
  const hintDob = document.getElementById('hint-dob');
  const hintBirthplace = document.getElementById('hint-birthplace');

  // DOM Elements - Palm Screen
  const btnBackToDetails = document.getElementById('btn-back-to-details');
  const palmInput = document.getElementById('palm-input');
  const btnPickPhoto = document.getElementById('btn-pick-photo');
  const pickPhotoText = document.getElementById('pick-photo-text');
  const btnDemoPalm = document.getElementById('btn-demo-palm');
  const btnAnalyzePalm = document.getElementById('btn-analyze-palm');
  const palmPreviewContainer = document.getElementById('palm-preview-container');
  const palmPreviewImg = document.getElementById('palm-preview-img');
  const palmStatusBadge = document.getElementById('palm-status-badge');
  const palmStatusText = document.getElementById('palm-status-text');

  // DOM Elements - Reimagined Loading Screen (Neon Hand Scanner)
  const handScannerViewport = document.getElementById('hand-scanner-viewport');
  const scannerPalmPhoto = document.getElementById('scanner-palm-photo');
  const scannerKicker = document.getElementById('scanner-kicker');
  const scannerTitle = document.getElementById('scanner-title');
  const scannerSubtitle = document.getElementById('scanner-subtitle');
  const scannerStatus = document.getElementById('scanner-status');
  const loadingProgressBar = document.getElementById('loading-progress-bar');

  // DOM Elements - Results Screen
  const rUserName = document.getElementById('r-user-name');
  const rArchetypeTitle = document.getElementById('r-archetype-title');
  const rArchetypeGift = document.getElementById('r-archetype-gift');
  const rTagZodiac = document.getElementById('r-tag-zodiac');
  const rTagLifepath = document.getElementById('r-tag-lifepath');
  const rTagTime = document.getElementById('r-tag-time');
  const rPalmLines = document.getElementById('r-palm-lines');

  // 1. Personality Reflection
  const rPersonalityTitle = document.getElementById('r-personality-title');
  const rPersonalitySummary = document.getElementById('r-personality-summary');
  const rPersonalityTraits = document.getElementById('r-personality-traits');

  // 2. Strengths and Areas for Growth
  const rStrengthsText = document.getElementById('r-strengths-text');
  const rGrowthAreasText = document.getElementById('r-growth-areas-text');

  // 3. Career and Learning Reflections
  const rCareerTitle = document.getElementById('r-career-title');
  const rCareerSummary = document.getElementById('r-career-summary');
  const rCareerEnvironments = document.getElementById('r-career-environments');
  const rCareerLearning = document.getElementById('r-career-learning');

  // 4. Relationships and Communication Reflections
  const rRelationshipsTitle = document.getElementById('r-relationships-title');
  const rRelationshipsSummary = document.getElementById('r-relationships-summary');
  const rRelationshipsCommunication = document.getElementById('r-relationships-communication');
  const rRelationshipsTip = document.getElementById('r-relationships-tip');

  // 5. General Future Possibilities
  const rFutureTitle = document.getElementById('r-future-title');
  const rFutureSummary = document.getElementById('r-future-summary');
  const rFutureThemes = document.getElementById('r-future-themes');

  // 6. Positive, Practical Suggestions
  const rPracticalTitle = document.getElementById('r-practical-title');
  const rPracticalPractices = document.getElementById('r-practical-practices');
  const rPracticalPrompt = document.getElementById('r-practical-prompt');
  const rPracticalAffirmation = document.getElementById('r-practical-affirmation');

  const rModeInfo = document.getElementById('r-mode-info');
  const btnCopySummary = document.getElementById('btn-copy-summary');
  const btnStartNew = document.getElementById('btn-start-new');

  // DOM Elements - Error Screen
  const errorMessageText = document.getElementById('error-message-text');
  const btnRetry = document.getElementById('btn-retry');
  const btnErrorBack = document.getElementById('btn-error-back');

  // Toast
  const toast = document.getElementById('toast');

  // State
  let selectedTimeBucket = 'unsure';
  let sanitizedPalmDataUrl = null;
  let isDemoPalm = false;
  let currentReadingData = null;
  let loadingInterval = null;

  // -------------------------------------------------------------
  // 1. Screen Router
  // -------------------------------------------------------------
  function showScreen(screenKey) {
    Object.keys(screens).forEach(key => {
      const el = screens[key];
      if (el) {
        if (key === screenKey) {
          el.style.display = 'flex';
          el.classList.add('active');
        } else {
          el.style.display = 'none';
          el.classList.remove('active');
        }
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log(`[event] screen_navigated target=${screenKey}`);
  }

  // Navigation Event Listeners
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      showScreen('details');
      setTimeout(() => inputFirstName && inputFirstName.focus(), 150);
    });
  }

  if (btnBackToWelcome) {
    btnBackToWelcome.addEventListener('click', () => showScreen('welcome'));
  }

  if (btnBackToDetails) {
    btnBackToDetails.addEventListener('click', () => showScreen('details'));
  }

  if (btnErrorBack) {
    btnErrorBack.addEventListener('click', () => showScreen('details'));
  }

  if (btnStartNew) {
    btnStartNew.addEventListener('click', () => {
      // Clean reset
      sanitizedPalmDataUrl = null;
      isDemoPalm = false;
      currentReadingData = null;
      if (palmPreviewImg) {
        palmPreviewImg.src = '';
        palmPreviewImg.style.display = 'none';
      }
      if (btnAnalyzePalm) btnAnalyzePalm.style.display = 'none';
      if (palmStatusBadge) {
        const dot = palmStatusBadge.querySelector('.status-dot');
        if (dot) dot.classList.remove('active');
        palmStatusText.textContent = 'No palm selected yet';
      }
      if (pickPhotoText) pickPhotoText.textContent = 'Take or Upload Palm Photo';
      showScreen('welcome');
    });
  }

  // -------------------------------------------------------------
  // 2. Restore Saved Form Fields from sessionStorage
  // -------------------------------------------------------------
  function restoreSessionData() {
    const savedName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME);
    const savedDob = sessionStorage.getItem(STORAGE_KEYS.DOB);
    const savedPlace = sessionStorage.getItem(STORAGE_KEYS.BIRTHPLACE);
    const savedTime = sessionStorage.getItem(STORAGE_KEYS.TIME_BUCKET);

    if (savedName && inputFirstName) inputFirstName.value = savedName;
    if (savedDob && inputDob) inputDob.value = savedDob;
    if (savedPlace && inputBirthplace && savedPlace !== 'Not specified') inputBirthplace.value = savedPlace;

    if (savedTime) {
      selectedTimeBucket = savedTime;
      timeChips.forEach(chip => {
        const isActive = chip.getAttribute('data-time') === savedTime;
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    }
  }

  restoreSessionData();

  // -------------------------------------------------------------
  // 3. Details Form Input Event Handlers & Validation
  // -------------------------------------------------------------
  if (inputFirstName) {
    inputFirstName.addEventListener('input', (e) => {
      sessionStorage.setItem(STORAGE_KEYS.FIRST_NAME, e.target.value);
      clearHint(inputFirstName, hintFirstName);
    });

    inputFirstName.addEventListener('blur', () => {
      const val = (inputFirstName.value || '').trim();
      if (val.length > 0 && val.length < 2) {
        showHint(inputFirstName, hintFirstName, 'Please enter at least 2 characters for your first name.');
      }
    });
  }

  // Date of Birth: Calendar picker support (YYYY-MM-DD) and manual DD/MM/YYYY
  if (inputDob) {
    const handleDobInput = (e) => {
      const val = e.target.value;
      sessionStorage.setItem(STORAGE_KEYS.DOB, val);
      clearHint(inputDob, hintDob);
    };

    inputDob.addEventListener('input', handleDobInput);
    inputDob.addEventListener('change', handleDobInput);

    inputDob.addEventListener('blur', () => {
      const val = (inputDob.value || '').trim();
      if (val) {
        const res = validateDob(val);
        if (!res.valid) {
          showHint(inputDob, hintDob, res.message);
        }
      }
    });
  }

  // Birthplace is OPTIONAL
  if (inputBirthplace) {
    inputBirthplace.addEventListener('input', (e) => {
      sessionStorage.setItem(STORAGE_KEYS.BIRTHPLACE, e.target.value.slice(0, 50));
      clearHint(inputBirthplace, hintBirthplace);
    });

    inputBirthplace.addEventListener('blur', () => {
      const val = (inputBirthplace.value || '').trim();
      if (val.length > 50) {
        showHint(inputBirthplace, hintBirthplace, 'Please keep city name within 50 characters.');
      }
    });
  }

  // Time of Birth Chips (One-word labels: Morning, Afternoon, Evening, Night, Unknown)
  timeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const timeVal = chip.getAttribute('data-time') || 'unknown';
      selectedTimeBucket = timeVal;
      sessionStorage.setItem(STORAGE_KEYS.TIME_BUCKET, timeVal);

      timeChips.forEach(c => {
        const isCurrent = c === chip;
        c.classList.toggle('active', isCurrent);
        c.setAttribute('aria-checked', isCurrent ? 'true' : 'false');
      });
      console.log(`[event] time_chip_selected time=${timeVal}`);
    });
  });

  // Hint helpers
  function showHint(inputElement, hintElement, message) {
    if (!hintElement) return;
    hintElement.textContent = message;
    hintElement.style.display = 'block';
    if (inputElement) inputElement.classList.add('input-has-hint');
  }

  function clearHint(inputElement, hintElement) {
    if (!hintElement) return;
    hintElement.textContent = '';
    hintElement.style.display = 'none';
    if (inputElement) inputElement.classList.remove('input-has-hint');
  }

  // -------------------------------------------------------------
  // 4. DOB Validation & Astrological Derivations (Rule 3)
  // -------------------------------------------------------------
  function validateDob(dobString) {
    if (!dobString || dobString.trim() === '') {
      return { valid: false, message: 'Please select your date of birth from the calendar.' };
    }

    const trimmed = dobString.trim();
    let day, month, year;
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10);
      day = parseInt(isoMatch[3], 10);
    } else if (ddmmyyyyMatch) {
      day = parseInt(ddmmyyyyMatch[1], 10);
      month = parseInt(ddmmyyyyMatch[2], 10);
      year = parseInt(ddmmyyyyMatch[3], 10);
    } else {
      return { valid: false, message: 'Please select a valid date (YYYY-MM-DD or DD/MM/YYYY).' };
    }

    if (month < 1 || month > 12) {
      return { valid: false, message: 'Month must be between 1 and 12.' };
    }

    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const daysInMonth = [0, 31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maxAllowedDays = daysInMonth[month];

    if (day < 1 || day > maxAllowedDays) {
      if (month === 2) {
        return {
          valid: false,
          message: isLeapYear
            ? `February ${year} had 29 days.`
            : `February ${year} had 28 days (not a leap year).`
        };
      }
      return { valid: false, message: `This month has ${maxAllowedDays} days.` };
    }

    const birthDate = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (birthDate > today) {
      return { valid: false, message: 'Birth date cannot be in the future.' };
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 5) {
      return { valid: false, message: 'AI Jyotish is designed for ages 5 and older.' };
    }

    if (age > 105) {
      return { valid: false, message: 'Please verify the birth year entered.' };
    }

    // Normalized DD/MM/YYYY representation
    const normalizedDob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

    return { valid: true, age, day, month, year, normalizedDob };
  }

  function deriveSunSign(day, month) {
    const signs = [
      { id: 'Capricorn', name: 'Capricorn ♑', startM: 12, startD: 22, endM: 1, endD: 19 },
      { id: 'Aquarius', name: 'Aquarius ♒', startM: 1, startD: 20, endM: 2, endD: 18 },
      { id: 'Pisces', name: 'Pisces ♓', startM: 2, startD: 19, endM: 3, endD: 20 },
      { id: 'Aries', name: 'Aries ♈', startM: 3, startD: 21, endM: 4, endD: 19 },
      { id: 'Taurus', name: 'Taurus ♉', startM: 4, startD: 20, endM: 5, endD: 20 },
      { id: 'Gemini', name: 'Gemini ♊', startM: 5, startD: 21, endM: 6, endD: 20 },
      { id: 'Cancer', name: 'Cancer ♋', startM: 6, startD: 21, endM: 7, endD: 22 },
      { id: 'Leo', name: 'Leo ♌', startM: 7, startD: 23, endM: 8, endD: 22 },
      { id: 'Virgo', name: 'Virgo ♍', startM: 8, startD: 23, endM: 9, endD: 22 },
      { id: 'Libra', name: 'Libra ♎', startM: 9, startD: 23, endM: 10, endD: 22 },
      { id: 'Scorpio', name: 'Scorpio ♏', startM: 10, startD: 23, endM: 11, endD: 21 },
      { id: 'Sagittarius', name: 'Sagittarius ♐', startM: 11, startD: 22, endM: 12, endD: 21 }
    ];

    for (const s of signs) {
      if ((month === s.startM && day >= s.startD) || (month === s.endM && day <= s.endD)) {
        return s.id;
      }
    }
    return 'Aries';
  }

  function deriveLifePathNumber(day, month, year) {
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
    return reduce(reduce(day) + reduce(month) + reduce(year));
  }

  // -------------------------------------------------------------
  // 5. Details Form Submission -> Proceed to Palm Screen
  // -------------------------------------------------------------
  if (detailsForm) {
    detailsForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isFormValid = true;
      let firstInvalidInput = null;

      const firstNameVal = (inputFirstName ? inputFirstName.value : '').trim();
      if (!firstNameVal || firstNameVal.length < 2) {
        showHint(inputFirstName, hintFirstName, 'Please enter your first name.');
        isFormValid = false;
        if (!firstInvalidInput) firstInvalidInput = inputFirstName;
      } else {
        clearHint(inputFirstName, hintFirstName);
      }

      const dobVal = (inputDob ? inputDob.value : '').trim();
      const dobValidation = validateDob(dobVal);
      if (!dobValidation.valid) {
        showHint(inputDob, hintDob, dobValidation.message);
        isFormValid = false;
        if (!firstInvalidInput) firstInvalidInput = inputDob;
      } else {
        clearHint(inputDob, hintDob);
      }

      // Birthplace is OPTIONAL
      const birthplaceVal = (inputBirthplace ? inputBirthplace.value : '').trim();
      if (birthplaceVal.length > 50) {
        showHint(inputBirthplace, hintBirthplace, 'Please keep city name under 50 characters.');
        isFormValid = false;
        if (!firstInvalidInput) firstInvalidInput = inputBirthplace;
      } else {
        clearHint(inputBirthplace, hintBirthplace);
      }

      if (!isFormValid) {
        if (firstInvalidInput) firstInvalidInput.focus();
        return;
      }

      // Save to sessionStorage (Rule 3)
      sessionStorage.setItem(STORAGE_KEYS.FIRST_NAME, firstNameVal);
      sessionStorage.setItem(STORAGE_KEYS.DOB, dobValidation.normalizedDob || dobVal);
      sessionStorage.setItem(STORAGE_KEYS.BIRTHPLACE, birthplaceVal || 'Not specified');
      sessionStorage.setItem(STORAGE_KEYS.TIME_BUCKET, selectedTimeBucket);

      // Derive traits client-side (Rule 3)
      const sunSign = deriveSunSign(dobValidation.day, dobValidation.month);
      const lifePath = deriveLifePathNumber(dobValidation.day, dobValidation.month, dobValidation.year);
      sessionStorage.setItem(STORAGE_KEYS.SUN_SIGN, sunSign);
      sessionStorage.setItem(STORAGE_KEYS.LIFE_PATH, lifePath.toString());

      console.log(`[event] details_completed sunSign=${sunSign} lifePath=${lifePath}`);
      showScreen('palm');
    });
  }

  // -------------------------------------------------------------
  // 6. In-Browser Palm Image Sanitization (HTML5 Canvas, Rule 4)
  // -------------------------------------------------------------
  function sanitizeImageViaCanvas(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 768px on longest side
        const MAX_DIM = 768;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw image onto canvas (strips EXIF metadata automatically)
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 0.85 quality
        const sanitizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(null, sanitizedDataUrl);
      };
      img.onerror = () => callback(new Error('Failed to decode image file.'));
      img.src = e.target.result;
    };
    reader.onerror = () => callback(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  }

  /**
   * Generates a realistic synthetic demo palm with contours aligned to 500x700 vector map
   */
  function generateDemoPalmDataUrl() {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    // Cosmic deep space backdrop
    const bgGrad = ctx.createRadialGradient(250, 350, 40, 250, 350, 340);
    bgGrad.addColorStop(0, '#1E174D');
    bgGrad.addColorStop(1, '#07051A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 500, 700);

    // Realistic palm silhouette
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(250, 640);
    ctx.bezierCurveTo(200, 640, 160, 620, 150, 560);
    ctx.bezierCurveTo(140, 500, 120, 420, 105, 360); // thumb base
    ctx.bezierCurveTo(90, 310, 105, 250, 130, 260);  // thumb
    ctx.bezierCurveTo(155, 270, 160, 330, 175, 360);
    ctx.bezierCurveTo(175, 280, 180, 150, 205, 140); // index finger
    ctx.bezierCurveTo(230, 130, 235, 240, 245, 310);
    ctx.bezierCurveTo(250, 210, 255, 100, 280, 95);  // middle finger
    ctx.bezierCurveTo(305, 90, 315, 220, 320, 315);
    ctx.bezierCurveTo(325, 230, 335, 130, 360, 135); // ring finger
    ctx.bezierCurveTo(385, 140, 380, 250, 375, 330);
    ctx.bezierCurveTo(385, 280, 400, 210, 420, 220); // pinky finger
    ctx.bezierCurveTo(440, 230, 425, 330, 405, 410);
    ctx.bezierCurveTo(385, 490, 380, 580, 345, 620);
    ctx.bezierCurveTo(315, 650, 280, 640, 250, 640);
    ctx.closePath();

    ctx.fillStyle = 'rgba(243, 209, 122, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(243, 209, 122, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Natural crease lines matching the 4 primary neon lines
    ctx.save();
    ctx.lineWidth = 2.2;

    // Heart Line crease
    ctx.strokeStyle = 'rgba(255, 45, 141, 0.35)';
    ctx.beginPath();
    ctx.moveTo(370, 335);
    ctx.bezierCurveTo(310, 295, 240, 265, 180, 250);
    ctx.stroke();

    // Head Line crease
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(115, 370);
    ctx.bezierCurveTo(185, 385, 260, 405, 355, 440);
    ctx.stroke();

    // Life Line crease
    ctx.strokeStyle = 'rgba(255, 179, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(115, 372);
    ctx.bezierCurveTo(145, 435, 168, 505, 162, 580);
    ctx.stroke();

    // Fate Line crease
    ctx.strokeStyle = 'rgba(179, 136, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(225, 600);
    ctx.lineTo(225, 450);
    ctx.bezierCurveTo(225, 390, 226, 340, 226, 315);
    ctx.stroke();

    ctx.restore();

    // Watermark label
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(243, 209, 122, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('Cosmic Demo Palm · Ready for Scan', 250, 675);

    return canvas.toDataURL('image/jpeg', 0.85);
  }

  // -------------------------------------------------------------
  // 7. Palm Screen Interaction & Handlers
  // -------------------------------------------------------------
  if (btnPickPhoto && palmInput) {
    btnPickPhoto.addEventListener('click', () => {
      palmInput.click();
    });
  }

  if (palmInput) {
    palmInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // Validate image type
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }

      // Check excessive file size (> 15MB)
      if (file.size > 15 * 1024 * 1024) {
        showToast('Image file is too large. Please select an image under 15MB.');
        return;
      }

      // Update button text while sanitizing
      if (pickPhotoText) pickPhotoText.textContent = 'Processing photo...';

      sanitizeImageViaCanvas(file, (err, dataUrl) => {
        if (err) {
          showToast('Could not process photo. Please try another image.');
          if (pickPhotoText) pickPhotoText.textContent = 'Take or Upload Palm Photo';
          return;
        }

        sanitizedPalmDataUrl = dataUrl;
        isDemoPalm = false;

        // Update preview
        if (palmPreviewImg) {
          palmPreviewImg.src = dataUrl;
          palmPreviewImg.style.display = 'block';
        }

        if (palmStatusBadge) {
          const dot = palmStatusBadge.querySelector('.status-dot');
          if (dot) dot.classList.add('active');
          palmStatusText.textContent = 'Palm Photo Ready';
        }

        if (btnAnalyzePalm) {
          btnAnalyzePalm.style.display = 'inline-flex';
        }

        if (pickPhotoText) pickPhotoText.textContent = 'Change Photo 📷';
        console.log('[event] palm_photo_sanitized_ready');
      });
    });
  }

  // Demo Palm option
  if (btnDemoPalm) {
    btnDemoPalm.addEventListener('click', () => {
      const demoUrl = generateDemoPalmDataUrl();
      sanitizedPalmDataUrl = demoUrl;
      isDemoPalm = true;

      if (palmPreviewImg) {
        palmPreviewImg.src = demoUrl;
        palmPreviewImg.style.display = 'block';
      }

      if (palmStatusBadge) {
        const dot = palmStatusBadge.querySelector('.status-dot');
        if (dot) dot.classList.add('active');
        palmStatusText.textContent = 'Demo Palm Configured';
      }

      if (btnAnalyzePalm) {
        btnAnalyzePalm.style.display = 'inline-flex';
      }

      if (pickPhotoText) pickPhotoText.textContent = 'Upload Own Photo Instead';
      console.log('[event] demo_palm_selected');
      showToast('Demo palm loaded! Click Analyze Palm to continue.');
    });
  }

  // -------------------------------------------------------------
  // 8. Analyze Palm -> Trigger Loading & Backend API
  // -------------------------------------------------------------
  if (btnAnalyzePalm) {
    btnAnalyzePalm.addEventListener('click', () => {
      startCosmicReading();
    });
  }

  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      startCosmicReading();
    });
  }

  let animationTimeouts = [];

  function resetNeonScanner() {
    animationTimeouts.forEach(t => clearTimeout(t));
    animationTimeouts = [];

    if (handScannerViewport) {
      handScannerViewport.classList.remove('scanning');
      handScannerViewport.classList.remove('mapped');
    }

    if (loadingProgressBar) loadingProgressBar.style.width = '6%';
    if (scannerKicker) scannerKicker.innerHTML = '<span class="pulse-star">✦</span> Neural Palmistry Scan';
    if (scannerTitle) scannerTitle.textContent = 'Scanning Palm Geometry';
    if (scannerSubtitle) scannerSubtitle.textContent = 'Laser sweep active · Aligning hand contours';
    if (scannerStatus) scannerStatus.textContent = 'Initializing optical palm sweep...';
  }

  function startCosmicReading() {
    showScreen('loading');
    resetNeonScanner();

    // Display the full photo of the user's hand (or demo hand)
    if (scannerPalmPhoto && sanitizedPalmDataUrl) {
      scannerPalmPhoto.src = sanitizedPalmDataUrl;
    }

    // Step 1: Start 4-second active laser scan
    if (handScannerViewport) {
      handScannerViewport.classList.add('scanning');
    }

    // Progress and status during the 4-second scanning phase
    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) scannerStatus.textContent = 'Analyzing skin topography & biometric depth vectors...';
      if (loadingProgressBar) loadingProgressBar.style.width = '24%';
    }, 1400));

    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) scannerStatus.textContent = 'Aligning palmar creases with celestial house coordinates...';
      if (loadingProgressBar) loadingProgressBar.style.width = '44%';
    }, 2800));

    // Step 2: EXACTLY AT 4.0 SECONDS -> STOP SCANNING & REVEAL NEON LINES & BADGES
    animationTimeouts.push(setTimeout(() => {
      if (handScannerViewport) {
        handScannerViewport.classList.remove('scanning'); // Stop and remove laser sweep!
        handScannerViewport.classList.add('mapped');      // Reveal the 4 neon lines and badges!
      }
      if (scannerKicker) scannerKicker.innerHTML = '<span class="pulse-star">✨</span> Celestial Alignment Complete';
      if (scannerTitle) scannerTitle.textContent = 'Major Palm Lines Mapped';
      if (scannerSubtitle) scannerSubtitle.textContent = '4 Primary Lines Identified · Heart, Head, Life & Fate';
      if (scannerStatus) scannerStatus.textContent = 'Heart line, Head line, Life line & Fate line mapped';
      if (loadingProgressBar) loadingProgressBar.style.width = '68%';
    }, 4000));

    // Post-mapping synthesis updates
    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) scannerStatus.textContent = 'Synthesizing planetary archetype with Hast Rekha contours...';
      if (loadingProgressBar) loadingProgressBar.style.width = '88%';
    }, 5500));

    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) scannerStatus.textContent = 'Cosmic reflection ready · Finalizing personalized report...';
      if (loadingProgressBar) loadingProgressBar.style.width = '98%';
    }, 6800));

    // Gather form traits
    const firstName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Seeker';
    const dob = sessionStorage.getItem(STORAGE_KEYS.DOB) || '';
    const sunSign = sessionStorage.getItem(STORAGE_KEYS.SUN_SIGN) || 'Aries';
    const lifePath = parseInt(sessionStorage.getItem(STORAGE_KEYS.LIFE_PATH) || '7', 10);
    const birthplace = sessionStorage.getItem(STORAGE_KEYS.BIRTHPLACE) || 'Not specified';
    const timeBucket = sessionStorage.getItem(STORAGE_KEYS.TIME_BUCKET) || selectedTimeBucket || 'unknown';

    const payload = {
      name: firstName,
      dob: dob,
      sunSign,
      lifePath,
      birthplace,
      timeBucket,
      palmImage: sanitizedPalmDataUrl,
      isDemoPalm: isDemoPalm
    };

    const requestStart = Date.now();

    fetch('/api/reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Invalid reading response structure.');
        }

        // Validate required sections on client
        const data = response.data;
        const hasSections = data.personalityReflection &&
          data.strengthsAndGrowth &&
          data.careerAndLearning &&
          data.relationshipsAndCommunication &&
          data.futurePossibilities &&
          data.practicalSuggestions &&
          data.archetype;

        if (!hasSections) {
          throw new Error('Reading response is missing one or more required reflection sections.');
        }

        // Enforce full 4s scan + 3.2s mapped contemplation = 7.2s minimum duration
        const elapsed = Date.now() - requestStart;
        const remainingDelay = Math.max(0, 7200 - elapsed);

        setTimeout(() => {
          if (loadingProgressBar) loadingProgressBar.style.width = '100%';
          if (scannerStatus) scannerStatus.textContent = 'Harmonizing cosmic reflection...';
          setTimeout(() => {
            currentReadingData = data;
            renderResults(data);
            showScreen('results');
          }, 450);
        }, remainingDelay);
      })
      .catch(err => {
        console.error('[reading_error]', err);
        animationTimeouts.forEach(t => clearTimeout(t));
        if (errorMessageText) {
          errorMessageText.textContent = 'We could not complete your reflection due to a temporary connection delay. Please try again.';
        }
        showScreen('error');
      });
  }

  // -------------------------------------------------------------
  // 9. Results Dashboard Rendering
  // -------------------------------------------------------------
  function renderResults(data) {
    const firstName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Seeker';
    if (rUserName) rUserName.textContent = firstName;

    // Archetype Hero Card
    if (data.archetype) {
      if (rArchetypeTitle) rArchetypeTitle.textContent = data.archetype.title || 'The Inquisitive Wayfarer';
      if (rArchetypeGift) rArchetypeGift.textContent = `Core Gift: ${data.archetype.coreGift || 'Reflective Wisdom'}`;
      if (rTagZodiac) rTagZodiac.textContent = `${data.archetype.zodiacSign || 'Aries'} ♈`;
      if (rTagLifepath) rTagLifepath.textContent = `Path ${data.archetype.lifePathNumber || 7} 🌟`;
      if (rTagTime) rTagTime.textContent = data.archetype.solarAlignment || 'Morning';
    }

    // Palm Highlights
    if (rPalmLines) {
      rPalmLines.innerHTML = '';
      const lines = Array.isArray(data.palmHighlights) ? data.palmHighlights : [];
      lines.forEach(item => {
        const lineEl = document.createElement('div');
        lineEl.className = 'palm-line-item';
        lineEl.innerHTML = `
          <div class="line-name">${escapeHtml(item.line || 'Palm Line')}</div>
          <div class="line-obs">${escapeHtml(item.observation || '')}</div>
          <div class="line-meaning">${escapeHtml(item.meaning || '')}</div>
        `;
        rPalmLines.appendChild(lineEl);
      });
    }

    // 1. Personality Reflection
    if (data.personalityReflection) {
      if (rPersonalityTitle) rPersonalityTitle.textContent = data.personalityReflection.title || 'Personality Reflection';
      if (rPersonalitySummary) rPersonalitySummary.textContent = data.personalityReflection.summary || '';

      if (rPersonalityTraits) {
        rPersonalityTraits.innerHTML = '';
        const traits = Array.isArray(data.personalityReflection.traits) ? data.personalityReflection.traits : [];
        traits.forEach(trait => {
          const li = document.createElement('li');
          li.textContent = trait;
          rPersonalityTraits.appendChild(li);
        });
      }
    }

    // 2. Strengths & Areas for Growth
    if (data.strengthsAndGrowth) {
      if (rStrengthsText) rStrengthsText.textContent = data.strengthsAndGrowth.coreStrengths || '';
      if (rGrowthAreasText) rGrowthAreasText.textContent = data.strengthsAndGrowth.areasForGrowth || '';
    }

    // 3. Career & Learning Reflections
    if (data.careerAndLearning) {
      if (rCareerTitle) rCareerTitle.textContent = data.careerAndLearning.title || 'Career & Learning Reflections';
      if (rCareerSummary) rCareerSummary.textContent = data.careerAndLearning.summary || '';
      if (rCareerEnvironments) rCareerEnvironments.textContent = data.careerAndLearning.idealEnvironments || '';
      if (rCareerLearning) rCareerLearning.textContent = data.careerAndLearning.learningStyle || '';
    }

    // 4. Relationships & Communication Reflections
    if (data.relationshipsAndCommunication) {
      if (rRelationshipsTitle) rRelationshipsTitle.textContent = data.relationshipsAndCommunication.title || 'Relationships & Communication';
      if (rRelationshipsSummary) rRelationshipsSummary.textContent = data.relationshipsAndCommunication.summary || '';
      if (rRelationshipsCommunication) rRelationshipsCommunication.textContent = data.relationshipsAndCommunication.communicationStyle || '';
      if (rRelationshipsTip) rRelationshipsTip.textContent = data.relationshipsAndCommunication.connectionTip || '';
    }

    // 5. General Future Possibilities
    if (data.futurePossibilities) {
      if (rFutureTitle) rFutureTitle.textContent = data.futurePossibilities.title || 'General Future Possibilities';
      if (rFutureSummary) rFutureSummary.textContent = data.futurePossibilities.summary || '';

      if (rFutureThemes) {
        rFutureThemes.innerHTML = '';
        const themes = Array.isArray(data.futurePossibilities.upcomingThemes) ? data.futurePossibilities.upcomingThemes : [];
        themes.forEach(theme => {
          const li = document.createElement('li');
          li.textContent = theme;
          rFutureThemes.appendChild(li);
        });
      }
    }

    // 6. Positive, Practical Suggestions
    if (data.practicalSuggestions) {
      if (rPracticalTitle) rPracticalTitle.textContent = data.practicalSuggestions.title || 'Positive, Practical Suggestions';

      if (rPracticalPractices) {
        rPracticalPractices.innerHTML = '';
        const practices = Array.isArray(data.practicalSuggestions.dailyPractices) ? data.practicalSuggestions.dailyPractices : [];
        practices.forEach(practice => {
          const li = document.createElement('li');
          li.textContent = practice;
          rPracticalPractices.appendChild(li);
        });
      }

      if (rPracticalPrompt) rPracticalPrompt.textContent = `"${data.practicalSuggestions.reflectionPrompt || 'What path brings you calm momentum?'}"`;
      if (rPracticalAffirmation) rPracticalAffirmation.textContent = `"${data.practicalSuggestions.cosmicAffirmation || 'I walk forward with quiet confidence and clear purpose.'}"`;
    }

    // Provider / Mode Footer
    if (rModeInfo) {
      const mode = data?.meta?.mode === 'live' ? 'Live Gemini AI' : 'Cosmic Synthesis Engine';
      rModeInfo.textContent = `Engine: ${mode} · Strictly Private & In-Memory`;
    }
  }

  // -------------------------------------------------------------
  // 10. Copy Summary to Clipboard
  // -------------------------------------------------------------
  if (btnCopySummary) {
    btnCopySummary.addEventListener('click', () => {
      if (!currentReadingData) return;

      const firstName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Seeker';
      const arch = currentReadingData.archetype || {};
      const summaryText = `✨ AI Jyotish Reflection for ${firstName} ✨\n` +
        `Archetype: ${arch.title || ''} (${arch.zodiacSign || ''} · Life Path ${arch.lifePathNumber || ''})\n` +
        `Core Gift: ${arch.coreGift || ''}\n\n` +
        `🌟 Personality: ${currentReadingData.personalityReflection?.summary || ''}\n\n` +
        `⚡ Strengths: ${currentReadingData.strengthsAndGrowth?.coreStrengths || ''}\n` +
        `🌱 Growth Focus: ${currentReadingData.strengthsAndGrowth?.areasForGrowth || ''}\n\n` +
        `🧭 Career & Learning: ${currentReadingData.careerAndLearning?.summary || ''}\n\n` +
        `🤍 Relationships & Communication: ${currentReadingData.relationshipsAndCommunication?.summary || ''}\n\n` +
        `🔮 Future Possibilities: ${currentReadingData.futurePossibilities?.summary || ''}\n\n` +
        `☀️ Affirmation: ${currentReadingData.practicalSuggestions?.cosmicAffirmation || ''}\n\n` +
        `(For entertainment & self-reflection only · AI Jyotish)`;

      navigator.clipboard.writeText(summaryText)
        .then(() => showToast('Summary copied to clipboard! ✨'))
        .catch(() => showToast('Unable to copy summary automatically.'));
    });
  }

  // Toast Notification Helper
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // HTML sanitization helper
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
