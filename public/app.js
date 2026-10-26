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
  BIRTH_TIME: 'ai_jyotish_birth_time',
  SUN_SIGN: 'ai_jyotish_sun_sign',
  LIFE_PATH: 'ai_jyotish_life_path',
  CARD_FOCUS: 'ai_jyotish_card_focus',
  P2_NAME: 'ai_jyotish_p2_name',
  P2_DOB: 'ai_jyotish_p2_dob',
  P2_BIRTHPLACE: 'ai_jyotish_p2_birthplace',
  P2_TIME_BUCKET: 'ai_jyotish_p2_time_bucket',
  P2_BIRTH_TIME: 'ai_jyotish_p2_birth_time',
  P2_SUN_SIGN: 'ai_jyotish_p2_sun_sign',
  P2_LIFE_PATH: 'ai_jyotish_p2_life_path'
};

// Metadata for the 4 Celestial Cards featured in the video
const CARD_FOCUS_META = {
  dating_mood_on: {
    key: 'dating_mood_on',
    name: 'Dating Mood On',
    emoji: '💕',
    subtitle: 'Romantic Vibe, Chemistry & Dating Tips',
    targetCardId: 'card-witty-present',
    isTwoPerson: true
  },
  future_millionaire: {
    key: 'future_millionaire',
    name: 'Future Millionaire',
    emoji: '💰',
    subtitle: 'Career Breakthroughs & Money Habits',
    targetCardId: 'card-witty-present',
    isTwoPerson: false
  },
  karma_is_loading: {
    key: 'karma_is_loading',
    name: 'Karma is Loading',
    emoji: '🔥',
    subtitle: 'Personal Growth, Habits & Fate',
    targetCardId: 'card-witty-present',
    isTwoPerson: false
  },
  bond_check: {
    key: 'bond_check',
    name: 'Bond Check',
    emoji: '⭐',
    subtitle: 'Cosmic Harmony & Dual Palm Resonance',
    targetCardId: 'card-witty-present',
    isTwoPerson: true
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('[app_init] AI Jyotish cosmic reflection system active');

  // DOM Elements - Screens
  const screens = {
    intro: document.getElementById('screen-intro'),
    welcome: document.getElementById('screen-welcome'),
    details: document.getElementById('screen-details'),
    palm: document.getElementById('screen-palm'),
    loading: document.getElementById('screen-loading'),
    results: document.getElementById('screen-results'),
    error: document.getElementById('screen-error')
  };

  // DOM Elements - Intro Video & Cards
  const introVideo = document.getElementById('intro-video');
  const btnIntroReplay = document.getElementById('btn-intro-replay');
  const btnIntroSound = document.getElementById('btn-intro-sound');
  const soundIcon = document.getElementById('sound-icon');
  const soundText = document.getElementById('sound-text');
  const btnIntroSkip = document.getElementById('btn-intro-skip');
  const introSoundPrompt = document.getElementById('intro-sound-prompt');
  const cardsReadyBanner = document.getElementById('cards-ready-banner');
  const introCardsOverlay = document.getElementById('intro-cards-overlay');
  const cardHotspots = document.querySelectorAll('.card-hotspot');
  const cardChips = document.querySelectorAll('.card-chip');
  const btnExploreAll = document.getElementById('btn-explore-all');
  const btnWatchIntro = document.getElementById('btn-watch-intro');

  // DOM Elements - Details Focus Banner
  const activeFocusContainer = document.getElementById('active-focus-container');
  const focusBadgeEmoji = document.getElementById('focus-badge-emoji');
  const focusBadgeTitle = document.getElementById('focus-badge-title');
  const btnChangeFocus = document.getElementById('btn-change-focus');

  // DOM Elements - Results Focus Highlight Banner
  const resultsFocusBanner = document.getElementById('results-focus-banner');
  const resultsFocusText = document.getElementById('results-focus-text');

  // DOM Elements - Welcome Screen
  const btnStart = document.getElementById('btn-start');

  // DOM Elements - Details Screen
  const btnBackToWelcome = document.getElementById('btn-back-to-welcome');
  const detailsForm = document.getElementById('details-form');
  const inputFirstName = document.getElementById('input-first-name');
  const inputDob = document.getElementById('input-dob');
  const inputBirthplace = document.getElementById('input-birthplace');
  const inputTime = document.getElementById('input-time');
  const btnNextToPalm = document.getElementById('btn-next-to-palm');
  const btnNextToPalmText = document.getElementById('btn-next-to-palm-text');

  const hintFirstName = document.getElementById('hint-first-name');
  const hintDob = document.getElementById('hint-dob');
  const hintBirthplace = document.getElementById('hint-birthplace');
  const hintTime = document.getElementById('hint-time');

  // DOM Elements - Screen 2 Two-Person Details
  const sectionPerson2 = document.getElementById('section-person-2');
  const p1TagPill = document.getElementById('p1-tag-pill');
  const p2TagPill = document.getElementById('p2-tag-pill');
  const inputP2Name = document.getElementById('input-p2-name');
  const inputP2Dob = document.getElementById('input-p2-dob');
  const inputP2Birthplace = document.getElementById('input-p2-birthplace');
  const inputP2Time = document.getElementById('input-p2-time');
  const hintP2Name = document.getElementById('hint-p2-name');
  const hintP2Dob = document.getElementById('hint-p2-dob');
  const hintP2Birthplace = document.getElementById('hint-p2-birthplace');
  const hintP2Time = document.getElementById('hint-p2-time');

  // DOM Elements - Palm Screen (Single & Dual Mode)
  const palmHeading = document.getElementById('palm-heading');
  const palmSubheading = document.getElementById('palm-subheading');
  const palmSingleContainer = document.getElementById('palm-single-container');
  const palmDualContainer = document.getElementById('palm-dual-container');

  const btnBackToDetails = document.getElementById('btn-back-to-details');
  const palmInput = document.getElementById('palm-input');
  const btnPickPhoto = document.getElementById('btn-pick-photo');
  const pickPhotoText = document.getElementById('pick-photo-text');
  const btnDemoPalm = document.getElementById('btn-demo-palm');
  const btnAnalyzePalm = document.getElementById('btn-analyze-palm');
  const btnAnalyzePalmText = document.getElementById('btn-analyze-palm-text');
  const palmPreviewContainer = document.getElementById('palm-preview-container');
  const palmPreviewImg = document.getElementById('palm-preview-img');
  const palmStatusBadge = document.getElementById('palm-status-badge');
  const palmStatusText = document.getElementById('palm-status-text');

  // Dual Palm Elements
  const palmInputP1 = document.getElementById('palm-input-p1');
  const btnPickPhotoP1 = document.getElementById('btn-pick-photo-p1');
  const pickPhotoTextP1 = document.getElementById('pick-photo-text-p1');
  const btnDemoPalmP1 = document.getElementById('btn-demo-palm-p1');
  const palmPreviewImgP1 = document.getElementById('palm-preview-img-p1');
  const palmStatusBadgeP1 = document.getElementById('palm-status-badge-p1');
  const palmStatusTextP1 = document.getElementById('palm-status-text-p1');
  const dualP1Label = document.getElementById('dual-p1-label');

  const palmInputP2 = document.getElementById('palm-input-p2');
  const btnPickPhotoP2 = document.getElementById('btn-pick-photo-p2');
  const pickPhotoTextP2 = document.getElementById('pick-photo-text-p2');
  const btnDemoPalmP2 = document.getElementById('btn-demo-palm-p2');
  const palmPreviewImgP2 = document.getElementById('palm-preview-img-p2');
  const palmStatusBadgeP2 = document.getElementById('palm-status-badge-p2');
  const palmStatusTextP2 = document.getElementById('palm-status-text-p2');
  const dualP2Label = document.getElementById('dual-p2-label');

  const btnDemoPalmsBoth = document.getElementById('btn-demo-palms-both');

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

  // DOM Elements - Witty Top Summary & Snappy Cards
  const summaryCategoryTitle = document.getElementById('summary-category-title');
  const summarySeekerSubtitle = document.getElementById('summary-seeker-subtitle');
  const summaryVibeScore = document.getElementById('summary-vibe-score');
  const summaryVibeLabel = document.getElementById('summary-vibe-label');
  const summaryMetricsList = document.getElementById('summary-metrics-list');
  const rPastText = document.getElementById('r-past-text');
  const rPresentText = document.getElementById('r-present-text');
  const rFutureWittyText = document.getElementById('r-future-text');
  const rStrengthsList = document.getElementById('r-strengths-list');
  const rWatchOutList = document.getElementById('r-watch-out-list');
  const rNextMoveText = document.getElementById('r-next-move-text');
  const rFinalVerdictText = document.getElementById('r-final-verdict-text');

  // DOM Elements - New Screenshot Design Elements
  const btnResultsBack = document.getElementById('btn-results-back');
  const btnResultsDownload = document.getElementById('btn-results-download');
  const btnResultsShare = document.getElementById('btn-results-share');
  const resultsCategoryIcon = document.getElementById('results-category-icon');
  const resultsCategoryName = document.getElementById('results-category-name');
  const resultsSubtitlePill = document.getElementById('results-subtitle-pill');
  const summaryReportIcon = document.getElementById('summary-report-icon');
  const summaryReportTitle = document.getElementById('summary-report-title');
  const summaryScoreLabel = document.getElementById('summary-score-label');
  const summaryPersonaLabel = document.getElementById('summary-persona-label');
  const rStrengthsIcon = document.getElementById('r-strengths-icon');
  const rStrengthsTitle = document.getElementById('r-strengths-title');
  const rWatchOutTitle = document.getElementById('r-watch-out-title');
  const rNextMoveTitle = document.getElementById('r-next-move-title');
  const rNextMoveList = document.getElementById('r-next-move-list');
  const verdictBadgeImg = document.getElementById('verdict-badge-img');
  const rVerdictHeadline = document.getElementById('r-verdict-headline');

  // DOM Elements - Error Screen
  const errorMessageText = document.getElementById('error-message-text');
  const btnRetry = document.getElementById('btn-retry');
  const btnErrorBack = document.getElementById('btn-error-back');

  // Toast
  const toast = document.getElementById('toast');

  // State
  let selectedTimeBucket = 'unsure';
  let selectedTimeBucketP2 = 'unknown';
  let sanitizedPalmDataUrl = null;
  let sanitizedPalmDataUrlP1 = null;
  let sanitizedPalmDataUrlP2 = null;
  let isDemoPalm = false;
  let isDemoPalmP1 = false;
  let isDemoPalmP2 = false;
  let currentReadingData = null;
  let loadingInterval = null;
  let selectedCardFocus = null;

  function isTwoPersonMode() {
    return Boolean(
      selectedCardFocus &&
      (selectedCardFocus.key === 'dating_mood_on' || selectedCardFocus.key === 'bond_check' || selectedCardFocus.isTwoPerson === true)
    );
  }

  function updateTwoPersonModeUI() {
    const twoPerson = isTwoPersonMode();
    if (sectionPerson2) {
      sectionPerson2.style.display = twoPerson ? 'block' : 'none';
    }
    if (p1TagPill) {
      p1TagPill.style.display = twoPerson ? 'inline-flex' : 'none';
    }
    if (btnNextToPalmText) {
      btnNextToPalmText.textContent = twoPerson ? 'Continue to Dual Palm Reading' : 'Continue to Palm Reading';
    }

    if (palmSingleContainer && palmDualContainer) {
      if (twoPerson) {
        palmSingleContainer.style.display = 'none';
        palmDualContainer.style.display = 'flex';
        if (palmHeading) palmHeading.textContent = 'Upload 2 Palms ✋✋';
        if (palmSubheading) {
          palmSubheading.textContent = (selectedCardFocus && selectedCardFocus.key === 'dating_mood_on')
            ? 'Upload clear palm photos for both Person 1 and Person 2 for celestial romantic chemistry analysis.'
            : 'Upload clear palm photos for both Person 1 and Person 2 for celestial hand analysis.';
        }
        const p1Name = (inputFirstName && inputFirstName.value.trim()) || sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Person 1';
        const p2Name = (inputP2Name && inputP2Name.value.trim()) || sessionStorage.getItem(STORAGE_KEYS.P2_NAME) || 'Person 2';
        if (dualP1Label) dualP1Label.textContent = `${p1Name}'s Palm`;
        if (dualP2Label) dualP2Label.textContent = `${p2Name}'s Palm`;
        if (btnAnalyzePalmText) {
          btnAnalyzePalmText.textContent = (selectedCardFocus && selectedCardFocus.key === 'dating_mood_on')
            ? 'Analyze Both Palms & Romantic Chemistry ✨'
            : 'Analyze Both Palms & Compatibility ✨';
        }
        checkDualPalmCompletion();
      } else {
        palmSingleContainer.style.display = 'block';
        palmDualContainer.style.display = 'none';
        if (palmHeading) palmHeading.textContent = 'Show Your Palm ✋';
        if (palmSubheading) palmSubheading.textContent = 'Upload your clear palm photo for celestial hand analysis.';
        if (btnAnalyzePalmText) btnAnalyzePalmText.textContent = 'Analyze Palm & Stars ✨';
        if (btnAnalyzePalm) {
          btnAnalyzePalm.style.display = sanitizedPalmDataUrl ? 'inline-flex' : 'none';
        }
      }
    }
  }

  function checkDualPalmCompletion() {
    if (!isTwoPersonMode()) return;
    const p1Ready = Boolean(sanitizedPalmDataUrlP1);
    const p2Ready = Boolean(sanitizedPalmDataUrlP2);
    if (btnAnalyzePalm) {
      btnAnalyzePalm.style.display = (p1Ready && p2Ready) ? 'inline-flex' : 'none';
    }
  }

  // -------------------------------------------------------------
  // 1. Screen Router
  // -------------------------------------------------------------
  function showScreen(screenKey) {
    if (screenKey === 'details' || screenKey === 'palm') {
      updateTwoPersonModeUI();
    }
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

  // -------------------------------------------------------------
  // 1B. Intro Video & Interactive Cards Controller
  // -------------------------------------------------------------
  function initIntroVideo() {
    if (!introVideo) return;

    // Try unmuted playback first on initial website visit
    introVideo.currentTime = 0;
    introVideo.muted = false;

    const playPromise = introVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[intro_video] Autoplay with sound succeeded');
          updateSoundUI(true);
          if (introSoundPrompt) introSoundPrompt.style.display = 'none';
        })
        .catch((err) => {
          console.log('[intro_video] Browser blocked unmuted autoplay. Falling back to muted autoplay.', err);
          introVideo.muted = true;
          introVideo.play().then(() => {
            updateSoundUI(false);
            if (introSoundPrompt) introSoundPrompt.style.display = 'flex';
          }).catch(e => {
            console.warn('[intro_video] Autoplay failed entirely:', e);
            if (introSoundPrompt) {
              const label = introSoundPrompt.querySelector('.prompt-label');
              if (label) label.textContent = 'Tap to Play Video ▶';
              introSoundPrompt.style.display = 'flex';
            }
          });
        });
    }

    // Unmute on clicking sound prompt
    if (introSoundPrompt) {
      introSoundPrompt.addEventListener('click', (e) => {
        e.stopPropagation();
        unmuteVideo();
      });
    }

    // Also tapping video directly when muted attempts to unmute
    introVideo.addEventListener('click', () => {
      if (introVideo.muted) {
        unmuteVideo();
      }
    });

    // Sound toggle button in top bar
    if (btnIntroSound) {
      btnIntroSound.addEventListener('click', (e) => {
        e.stopPropagation();
        if (introVideo.muted) {
          unmuteVideo();
        } else {
          introVideo.muted = true;
          updateSoundUI(false);
          showToast('🔇 Video muted');
        }
      });
    }

    // Replay button in top bar
    if (btnIntroReplay) {
      btnIntroReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        replayIntroVideo();
      });
    }

    // Skip button in top bar
    if (btnIntroSkip) {
      btnIntroSkip.addEventListener('click', (e) => {
        e.stopPropagation();
        skipIntroVideo();
      });
    }

    // When cards animate and settle (around 2.5 seconds), activate card hotspots
    introVideo.addEventListener('timeupdate', () => {
      if (introVideo.currentTime >= 2.5) {
        unlockCardsOverlay();
      }
    });

    // When video ends, pause on final frame and ensure cards are unlocked
    introVideo.addEventListener('ended', () => {
      console.log('[intro_video] Video completed. Cards fully interactive.');
      unlockCardsOverlay();
    });
  }

  function unmuteVideo() {
    if (!introVideo) return;
    introVideo.muted = false;
    updateSoundUI(true);
    if (introSoundPrompt) introSoundPrompt.style.display = 'none';
    if (introVideo.paused) introVideo.play().catch(() => {});
    showToast('🔊 Sound enabled!');
  }

  function updateSoundUI(isUnmuted) {
    if (soundIcon) soundIcon.textContent = isUnmuted ? '🔊' : '🔇';
    if (soundText) soundText.textContent = isUnmuted ? 'Sound' : 'Muted';
  }

  function replayIntroVideo() {
    if (!introVideo) return;
    if (introCardsOverlay) introCardsOverlay.classList.remove('cards-ready');
    if (cardsReadyBanner) cardsReadyBanner.style.display = 'none';
    introVideo.currentTime = 0;
    introVideo.play().catch(() => {});
    showToast('↺ Replaying intro');
  }

  function skipIntroVideo() {
    if (!introVideo) return;
    const skipTarget = Math.max(2.5, (introVideo.duration && !isNaN(introVideo.duration)) ? introVideo.duration - 0.5 : 8.5);
    introVideo.currentTime = skipTarget;
    introVideo.pause();
    unlockCardsOverlay();
    showToast('✨ Cards unlocked!');
  }

  function unlockCardsOverlay() {
    if (introCardsOverlay && !introCardsOverlay.classList.contains('cards-ready')) {
      introCardsOverlay.classList.add('cards-ready');
      if (cardsReadyBanner) cardsReadyBanner.style.display = 'flex';
      console.log('[intro_cards] Cards overlay unlocked and clickable');
    }
  }

  function handleCardSelected(cardKey) {
    const meta = CARD_FOCUS_META[cardKey] || CARD_FOCUS_META.future_millionaire;
    selectedCardFocus = meta;
    sessionStorage.setItem(STORAGE_KEYS.CARD_FOCUS, cardKey);

    console.log(`[event] card_selected card=${cardKey} target=${meta.targetCardId}`);

    if (introVideo && !introVideo.paused) {
      introVideo.pause();
    }

    updateTwoPersonModeUI();

    // Update Details Screen focus banner
    if (activeFocusContainer) {
      if (focusBadgeEmoji) focusBadgeEmoji.textContent = meta.emoji;
      if (focusBadgeTitle) focusBadgeTitle.textContent = `${meta.name} · ${meta.subtitle}`;
      activeFocusContainer.style.display = 'flex';
    }

    const toastMsg = meta.isTwoPerson
      ? `✨ Selected: ${meta.name}! Enter details for Person 1 and Person 2 below.`
      : `✨ Selected: ${meta.name}! Enter your details below.`;
    showToast(toastMsg);

    // Open Step 1 (Details Form) directly with chosen card focus
    showScreen('details');
    setTimeout(() => {
      if (inputFirstName) inputFirstName.focus();
    }, 250);
  }

  // Bind click handlers to all hotspots directly on the video
  cardHotspots.forEach(hotspot => {
    hotspot.addEventListener('click', (e) => {
      e.stopPropagation();
      const cardKey = hotspot.getAttribute('data-card');
      handleCardSelected(cardKey);
    });
  });

  // Bind click handlers to quick-tap card chips
  cardChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const cardKey = chip.getAttribute('data-card');
      handleCardSelected(cardKey);
    });
  });

  // Continue without focus button
  if (btnExploreAll) {
    btnExploreAll.addEventListener('click', () => {
      selectedCardFocus = null;
      sessionStorage.removeItem(STORAGE_KEYS.CARD_FOCUS);
      if (activeFocusContainer) activeFocusContainer.style.display = 'none';
      if (introVideo && !introVideo.paused) introVideo.pause();
      updateTwoPersonModeUI();
      showScreen('details');
    });
  }

  // Change focus button on details form
  if (btnChangeFocus) {
    btnChangeFocus.addEventListener('click', () => {
      showScreen('intro');
      unlockCardsOverlay();
    });
  }

  // Watch intro button on welcome screen
  if (btnWatchIntro) {
    btnWatchIntro.addEventListener('click', () => {
      showScreen('intro');
      replayIntroVideo();
    });
  }

  // Navigation Event Listeners
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      updateTwoPersonModeUI();
      showScreen('details');
      setTimeout(() => inputFirstName && inputFirstName.focus(), 150);
    });
  }

  if (btnBackToWelcome) {
    btnBackToWelcome.addEventListener('click', () => {
      // If a card was chosen, return to intro cards; otherwise welcome
      if (selectedCardFocus) {
        showScreen('intro');
        unlockCardsOverlay();
      } else {
        showScreen('welcome');
      }
    });
  }

  if (btnBackToDetails) {
    btnBackToDetails.addEventListener('click', () => showScreen('details'));
  }

  if (btnErrorBack) {
    btnErrorBack.addEventListener('click', () => showScreen('details'));
  }

  if (btnResultsBack) {
    btnResultsBack.addEventListener('click', () => {
      showScreen('intro');
      unlockCardsOverlay();
    });
  }

  if (btnResultsDownload) {
    btnResultsDownload.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnResultsShare) {
    btnResultsShare.addEventListener('click', async () => {
      const shareData = {
        title: 'My AI Jyotish Reflection',
        text: `Check out my cosmic reading on AI Jyotish! ${window.location.href}`,
        url: window.location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {
          // Ignored if cancelled
        }
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast('Link copied to clipboard! ✨');
        } catch (e) {
          showToast('Sharing available in supported browsers ✨');
        }
      }
    });
  }

  if (btnStartNew) {
    btnStartNew.addEventListener('click', () => {
      // Clean reset
      sanitizedPalmDataUrl = null;
      sanitizedPalmDataUrlP1 = null;
      sanitizedPalmDataUrlP2 = null;
      isDemoPalm = false;
      isDemoPalmP1 = false;
      isDemoPalmP2 = false;
      currentReadingData = null;
      selectedCardFocus = null;
      sessionStorage.removeItem(STORAGE_KEYS.CARD_FOCUS);
      sessionStorage.removeItem(STORAGE_KEYS.P2_NAME);
      sessionStorage.removeItem(STORAGE_KEYS.P2_DOB);
      sessionStorage.removeItem(STORAGE_KEYS.P2_BIRTHPLACE);
      sessionStorage.removeItem(STORAGE_KEYS.P2_TIME_BUCKET);
      sessionStorage.removeItem(STORAGE_KEYS.P2_SUN_SIGN);
      sessionStorage.removeItem(STORAGE_KEYS.P2_LIFE_PATH);

      if (inputP2Name) inputP2Name.value = '';
      if (inputP2Dob) inputP2Dob.value = '';
      if (inputP2Birthplace) inputP2Birthplace.value = '';

      if (activeFocusContainer) activeFocusContainer.style.display = 'none';
      if (resultsFocusBanner) resultsFocusBanner.style.display = 'none';
      document.querySelectorAll('.result-card').forEach(c => c.classList.remove('card-focus-highlighted'));

      if (palmPreviewImg) {
        palmPreviewImg.src = '';
        palmPreviewImg.style.display = 'none';
      }
      if (palmPreviewImgP1) {
        palmPreviewImgP1.src = '';
        palmPreviewImgP1.style.display = 'none';
      }
      if (palmPreviewImgP2) {
        palmPreviewImgP2.src = '';
        palmPreviewImgP2.style.display = 'none';
      }
      if (btnAnalyzePalm) btnAnalyzePalm.style.display = 'none';
      if (palmStatusBadge) {
        const dot = palmStatusBadge.querySelector('.status-dot');
        if (dot) dot.classList.remove('active');
        palmStatusText.textContent = 'No palm selected yet';
      }
      if (palmStatusBadgeP1) {
        const dot = palmStatusBadgeP1.querySelector('.status-dot');
        if (dot) dot.classList.remove('active');
        if (palmStatusTextP1) palmStatusTextP1.textContent = 'No palm selected';
      }
      if (palmStatusBadgeP2) {
        const dot = palmStatusBadgeP2.querySelector('.status-dot');
        if (dot) dot.classList.remove('active');
        if (palmStatusTextP2) palmStatusTextP2.textContent = 'No palm selected';
      }
      if (pickPhotoText) pickPhotoText.textContent = 'Take or Upload Palm Photo';
      if (pickPhotoTextP1) pickPhotoTextP1.textContent = 'Upload Palm 1';
      if (pickPhotoTextP2) pickPhotoTextP2.textContent = 'Upload Palm 2';
      updateTwoPersonModeUI();
      showScreen('intro');
      replayIntroVideo();
    });
  }

  // -------------------------------------------------------------
  // 2. Restore Saved Form Fields from sessionStorage
  // -------------------------------------------------------------
  function restoreSessionData() {
    const savedName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME);
    const savedDob = sessionStorage.getItem(STORAGE_KEYS.DOB);
    const savedPlace = sessionStorage.getItem(STORAGE_KEYS.BIRTHPLACE);
    const savedTime = sessionStorage.getItem(STORAGE_KEYS.BIRTH_TIME) || sessionStorage.getItem(STORAGE_KEYS.TIME_BUCKET);
    const savedFocusKey = sessionStorage.getItem(STORAGE_KEYS.CARD_FOCUS);

    const savedP2Name = sessionStorage.getItem(STORAGE_KEYS.P2_NAME);
    const savedP2Dob = sessionStorage.getItem(STORAGE_KEYS.P2_DOB);
    const savedP2Place = sessionStorage.getItem(STORAGE_KEYS.P2_BIRTHPLACE);
    const savedP2Time = sessionStorage.getItem(STORAGE_KEYS.P2_BIRTH_TIME) || sessionStorage.getItem(STORAGE_KEYS.P2_TIME_BUCKET);

    if (savedName && inputFirstName) inputFirstName.value = savedName;
    if (savedDob && inputDob) inputDob.value = savedDob;
    if (savedPlace && inputBirthplace && savedPlace !== 'Not specified') inputBirthplace.value = savedPlace;
    if (savedTime && inputTime && savedTime !== 'unknown') inputTime.value = savedTime;

    if (savedP2Name && inputP2Name) inputP2Name.value = savedP2Name;
    if (savedP2Dob && inputP2Dob) inputP2Dob.value = savedP2Dob;
    if (savedP2Place && inputP2Birthplace && savedP2Place !== 'Not specified') inputP2Birthplace.value = savedP2Place;
    if (savedP2Time && inputP2Time && savedP2Time !== 'unknown') inputP2Time.value = savedP2Time;

    if (savedFocusKey && CARD_FOCUS_META[savedFocusKey]) {
      selectedCardFocus = CARD_FOCUS_META[savedFocusKey];
      if (activeFocusContainer) {
        if (focusBadgeEmoji) focusBadgeEmoji.textContent = selectedCardFocus.emoji;
        if (focusBadgeTitle) focusBadgeTitle.textContent = `${selectedCardFocus.name} · ${selectedCardFocus.subtitle}`;
        activeFocusContainer.style.display = 'flex';
      }
    }

    updateTwoPersonModeUI();
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

  // Birthplace is REQUIRED
  if (inputBirthplace) {
    inputBirthplace.addEventListener('input', (e) => {
      sessionStorage.setItem(STORAGE_KEYS.BIRTHPLACE, e.target.value.slice(0, 50));
      clearHint(inputBirthplace, hintBirthplace);
    });

    inputBirthplace.addEventListener('blur', () => {
      const val = (inputBirthplace.value || '').trim();
      if (!val) {
        showHint(inputBirthplace, hintBirthplace, 'Please enter your birthplace (city).');
      } else if (val.length > 50) {
        showHint(inputBirthplace, hintBirthplace, 'Please keep city name within 50 characters.');
      }
    });
  }

  // Time of Birth (Accurate Time Picker - REQUIRED)
  if (inputTime) {
    const handleTimeInput = (e) => {
      const val = e.target.value;
      sessionStorage.setItem(STORAGE_KEYS.BIRTH_TIME, val);
      sessionStorage.setItem(STORAGE_KEYS.TIME_BUCKET, val);
      clearHint(inputTime, hintTime);
    };

    inputTime.addEventListener('input', handleTimeInput);
    inputTime.addEventListener('change', handleTimeInput);

    inputTime.addEventListener('blur', () => {
      const val = (inputTime.value || '').trim();
      if (!val) {
        showHint(inputTime, hintTime, 'Please enter your accurate time of birth.');
      }
    });
  }

  // Person 2 Input Handlers (Active in Dating Mood On & Bond Check modes)
  if (inputP2Name) {
    inputP2Name.addEventListener('input', (e) => {
      sessionStorage.setItem(STORAGE_KEYS.P2_NAME, e.target.value);
      clearHint(inputP2Name, hintP2Name);
      if (dualP2Label) dualP2Label.textContent = `${e.target.value.trim() || 'Person 2'}'s Palm`;
    });

    inputP2Name.addEventListener('blur', () => {
      const val = (inputP2Name.value || '').trim();
      if (isTwoPersonMode() && val.length > 0 && val.length < 2) {
        showHint(inputP2Name, hintP2Name, 'Please enter at least 2 characters for Person 2.');
      }
    });
  }

  if (inputP2Dob) {
    const handleP2DobInput = (e) => {
      const val = e.target.value;
      sessionStorage.setItem(STORAGE_KEYS.P2_DOB, val);
      clearHint(inputP2Dob, hintP2Dob);
    };

    inputP2Dob.addEventListener('input', handleP2DobInput);
    inputP2Dob.addEventListener('change', handleP2DobInput);

    inputP2Dob.addEventListener('blur', () => {
      const val = (inputP2Dob.value || '').trim();
      if (isTwoPersonMode() && val) {
        const res = validateDob(val);
        if (!res.valid) {
          showHint(inputP2Dob, hintP2Dob, res.message);
        }
      }
    });
  }

  if (inputP2Birthplace) {
    inputP2Birthplace.addEventListener('input', (e) => {
      sessionStorage.setItem(STORAGE_KEYS.P2_BIRTHPLACE, e.target.value.slice(0, 50));
      clearHint(inputP2Birthplace, hintP2Birthplace);
    });

    inputP2Birthplace.addEventListener('blur', () => {
      const val = (inputP2Birthplace.value || '').trim();
      if (isTwoPersonMode()) {
        if (!val) {
          showHint(inputP2Birthplace, hintP2Birthplace, 'Please enter Person 2 birthplace (city).');
        } else if (val.length > 50) {
          showHint(inputP2Birthplace, hintP2Birthplace, 'Please keep city name within 50 characters.');
        }
      }
    });
  }

  // Person 2 Time of Birth (Accurate Time Picker - REQUIRED)
  if (inputP2Time) {
    const handleP2TimeInput = (e) => {
      const val = e.target.value;
      sessionStorage.setItem(STORAGE_KEYS.P2_BIRTH_TIME, val);
      sessionStorage.setItem(STORAGE_KEYS.P2_TIME_BUCKET, val);
      clearHint(inputP2Time, hintP2Time);
    };

    inputP2Time.addEventListener('input', handleP2TimeInput);
    inputP2Time.addEventListener('change', handleP2TimeInput);

    inputP2Time.addEventListener('blur', () => {
      const val = (inputP2Time.value || '').trim();
      if (isTwoPersonMode() && !val) {
        showHint(inputP2Time, hintP2Time, 'Please enter Person 2 accurate time of birth.');
      }
    });
  }

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

      // Birthplace is REQUIRED
      const birthplaceVal = (inputBirthplace ? inputBirthplace.value : '').trim();
      if (!birthplaceVal || birthplaceVal.length < 2) {
        showHint(inputBirthplace, hintBirthplace, 'Please enter your birthplace (city).');
        isFormValid = false;
        if (!firstInvalidInput) firstInvalidInput = inputBirthplace;
      } else if (birthplaceVal.length > 50) {
        showHint(inputBirthplace, hintBirthplace, 'Please keep city name under 50 characters.');
        isFormValid = false;
        if (!firstInvalidInput) firstInvalidInput = inputBirthplace;
      } else {
        clearHint(inputBirthplace, hintBirthplace);
      }

      // Time of Birth is REQUIRED
      const timeVal = (inputTime ? inputTime.value : '').trim();
      if (!timeVal) {
        showHint(inputTime, hintTime, 'Please enter your accurate time of birth.');
        isFormValid = false;
        if (!firstInvalidInput) firstInvalidInput = inputTime;
      } else {
        clearHint(inputTime, hintTime);
      }

      // Person 2 Validation in Two-Person Mode (Dating Mood On & Bond Check)
      let p2DobValidation = null;
      let p2NameVal = '';
      let p2BirthplaceVal = '';
      let p2TimeVal = '';

      if (isTwoPersonMode()) {
        p2NameVal = (inputP2Name ? inputP2Name.value : '').trim();
        if (!p2NameVal || p2NameVal.length < 2) {
          showHint(inputP2Name, hintP2Name, 'Please enter Person 2\'s first name.');
          isFormValid = false;
          if (!firstInvalidInput) firstInvalidInput = inputP2Name;
        } else {
          clearHint(inputP2Name, hintP2Name);
        }

        const p2DobVal = (inputP2Dob ? inputP2Dob.value : '').trim();
        p2DobValidation = validateDob(p2DobVal);
        if (!p2DobValidation.valid) {
          showHint(inputP2Dob, hintP2Dob, p2DobValidation.message);
          isFormValid = false;
          if (!firstInvalidInput) firstInvalidInput = inputP2Dob;
        } else {
          clearHint(inputP2Dob, hintP2Dob);
        }

        p2BirthplaceVal = (inputP2Birthplace ? inputP2Birthplace.value : '').trim();
        if (!p2BirthplaceVal || p2BirthplaceVal.length < 2) {
          showHint(inputP2Birthplace, hintP2Birthplace, 'Please enter Person 2\'s birthplace (city).');
          isFormValid = false;
          if (!firstInvalidInput) firstInvalidInput = inputP2Birthplace;
        } else if (p2BirthplaceVal.length > 50) {
          showHint(inputP2Birthplace, hintP2Birthplace, 'Please keep city name under 50 characters.');
          isFormValid = false;
          if (!firstInvalidInput) firstInvalidInput = inputP2Birthplace;
        } else {
          clearHint(inputP2Birthplace, hintP2Birthplace);
        }

        p2TimeVal = (inputP2Time ? inputP2Time.value : '').trim();
        if (!p2TimeVal) {
          showHint(inputP2Time, hintP2Time, 'Please enter Person 2\'s accurate time of birth.');
          isFormValid = false;
          if (!firstInvalidInput) firstInvalidInput = inputP2Time;
        } else {
          clearHint(inputP2Time, hintP2Time);
        }
      }

      if (!isFormValid) {
        if (firstInvalidInput) firstInvalidInput.focus();
        return;
      }

      // Save Person 1 to sessionStorage (Rule 3)
      sessionStorage.setItem(STORAGE_KEYS.FIRST_NAME, firstNameVal);
      sessionStorage.setItem(STORAGE_KEYS.DOB, dobValidation.normalizedDob || dobVal);
      sessionStorage.setItem(STORAGE_KEYS.BIRTHPLACE, birthplaceVal);
      sessionStorage.setItem(STORAGE_KEYS.BIRTH_TIME, timeVal);
      sessionStorage.setItem(STORAGE_KEYS.TIME_BUCKET, timeVal);

      // Derive traits client-side (Rule 3)
      const sunSign = deriveSunSign(dobValidation.day, dobValidation.month);
      const lifePath = deriveLifePathNumber(dobValidation.day, dobValidation.month, dobValidation.year);
      sessionStorage.setItem(STORAGE_KEYS.SUN_SIGN, sunSign);
      sessionStorage.setItem(STORAGE_KEYS.LIFE_PATH, lifePath.toString());

      // Save Person 2 if in two-person mode
      if (isTwoPersonMode() && p2DobValidation && p2DobValidation.valid) {
        sessionStorage.setItem(STORAGE_KEYS.P2_NAME, p2NameVal);
        sessionStorage.setItem(STORAGE_KEYS.P2_DOB, p2DobValidation.normalizedDob || (inputP2Dob ? inputP2Dob.value : ''));
        sessionStorage.setItem(STORAGE_KEYS.P2_BIRTHPLACE, p2BirthplaceVal);
        sessionStorage.setItem(STORAGE_KEYS.P2_BIRTH_TIME, p2TimeVal);
        sessionStorage.setItem(STORAGE_KEYS.P2_TIME_BUCKET, p2TimeVal);

        const p2SunSign = deriveSunSign(p2DobValidation.day, p2DobValidation.month);
        const p2LifePath = deriveLifePathNumber(p2DobValidation.day, p2DobValidation.month, p2DobValidation.year);
        sessionStorage.setItem(STORAGE_KEYS.P2_SUN_SIGN, p2SunSign);
        sessionStorage.setItem(STORAGE_KEYS.P2_LIFE_PATH, p2LifePath.toString());

        if (dualP1Label) dualP1Label.textContent = `${firstNameVal}'s Palm`;
        if (dualP2Label) dualP2Label.textContent = `${p2NameVal}'s Palm`;
      }

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
  // 7. Palm Screen Interaction & Handlers (Single & Dual Modes)
  // -------------------------------------------------------------
  // Single Mode Photo Pick
  if (btnPickPhoto && palmInput) {
    btnPickPhoto.addEventListener('click', () => {
      palmInput.click();
    });
  }

  if (palmInput) {
    palmInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        showToast('Image file is too large. Please select an image under 15MB.');
        return;
      }

      if (pickPhotoText) pickPhotoText.textContent = 'Processing photo...';

      sanitizeImageViaCanvas(file, (err, dataUrl) => {
        if (err) {
          showToast('Could not process photo. Please try another image.');
          if (pickPhotoText) pickPhotoText.textContent = 'Take or Upload Palm Photo';
          return;
        }

        sanitizedPalmDataUrl = dataUrl;
        isDemoPalm = false;

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

  // --- DUAL MODE: Person 1 Palm Handlers ---
  if (btnPickPhotoP1 && palmInputP1) {
    btnPickPhotoP1.addEventListener('click', () => {
      palmInputP1.click();
    });
  }

  if (palmInputP1) {
    palmInputP1.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file for Person 1.');
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        showToast('Image is too large. Please select an image under 15MB.');
        return;
      }

      if (pickPhotoTextP1) pickPhotoTextP1.textContent = 'Processing...';

      sanitizeImageViaCanvas(file, (err, dataUrl) => {
        if (err) {
          showToast('Could not process Person 1 photo.');
          if (pickPhotoTextP1) pickPhotoTextP1.textContent = 'Upload Palm 1';
          return;
        }

        sanitizedPalmDataUrlP1 = dataUrl;
        sanitizedPalmDataUrl = dataUrl; // fallback for loading preview
        isDemoPalmP1 = false;

        if (palmPreviewImgP1) {
          palmPreviewImgP1.src = dataUrl;
          palmPreviewImgP1.style.display = 'block';
        }

        if (palmStatusBadgeP1) {
          const dot = palmStatusBadgeP1.querySelector('.status-dot');
          if (dot) dot.classList.add('active');
          if (palmStatusTextP1) palmStatusTextP1.textContent = 'Palm 1 Ready';
        }

        if (pickPhotoTextP1) pickPhotoTextP1.textContent = 'Change Palm 1 📷';
        checkDualPalmCompletion();
        showToast('Person 1 palm uploaded! Now upload Person 2 palm.');
      });
    });
  }

  // --- DUAL MODE: Person 2 Palm Handlers ---
  if (btnPickPhotoP2 && palmInputP2) {
    btnPickPhotoP2.addEventListener('click', () => {
      palmInputP2.click();
    });
  }

  if (palmInputP2) {
    palmInputP2.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file for Person 2.');
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        showToast('Image is too large. Please select an image under 15MB.');
        return;
      }

      if (pickPhotoTextP2) pickPhotoTextP2.textContent = 'Processing...';

      sanitizeImageViaCanvas(file, (err, dataUrl) => {
        if (err) {
          showToast('Could not process Person 2 photo.');
          if (pickPhotoTextP2) pickPhotoTextP2.textContent = 'Upload Palm 2';
          return;
        }

        sanitizedPalmDataUrlP2 = dataUrl;
        isDemoPalmP2 = false;

        if (palmPreviewImgP2) {
          palmPreviewImgP2.src = dataUrl;
          palmPreviewImgP2.style.display = 'block';
        }

        if (palmStatusBadgeP2) {
          const dot = palmStatusBadgeP2.querySelector('.status-dot');
          if (dot) dot.classList.add('active');
          if (palmStatusTextP2) palmStatusTextP2.textContent = 'Palm 2 Ready';
        }

        if (pickPhotoTextP2) pickPhotoTextP2.textContent = 'Change Palm 2 📷';
        checkDualPalmCompletion();
        showToast('Person 2 palm uploaded!');
      });
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
    const isTwo = isTwoPersonMode();

    if (isTwo) {
      if (!sanitizedPalmDataUrlP1 || !sanitizedPalmDataUrlP2) {
        showToast('Please upload palm photos for both Person 1 and Person 2.');
        return;
      }
    } else {
      if (!sanitizedPalmDataUrl) {
        showToast('Please upload your palm photo to continue.');
        return;
      }
    }

    showScreen('loading');
    resetNeonScanner();

    // Display photo on scanner
    const displayPhoto = isTwo
      ? (sanitizedPalmDataUrlP1 || sanitizedPalmDataUrl)
      : sanitizedPalmDataUrl;
    if (scannerPalmPhoto && displayPhoto) {
      scannerPalmPhoto.src = displayPhoto;
    }

    if (isTwo) {
      const p1Name = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Person 1';
      const p2Name = sessionStorage.getItem(STORAGE_KEYS.P2_NAME) || 'Person 2';
      if (scannerKicker) scannerKicker.innerHTML = '<span class="pulse-star">✦</span> Dual Palmistry Scan';
      if (scannerTitle) scannerTitle.textContent = 'Scanning Both Palms';
      if (scannerSubtitle) scannerSubtitle.textContent = `Aligning compatibility vectors for ${p1Name} & ${p2Name}`;
    }

    // Step 1: Start 4-second active laser scan
    if (handScannerViewport) {
      handScannerViewport.classList.add('scanning');
    }

    // Progress and status during the 4-second scanning phase
    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) {
        scannerStatus.textContent = isTwo
          ? 'Scanning Person 1 & Person 2 skin topography & biometric contours...'
          : 'Analyzing skin topography & biometric depth vectors...';
      }
      if (loadingProgressBar) loadingProgressBar.style.width = '24%';
    }, 1400));

    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) {
        scannerStatus.textContent = isTwo
          ? 'Cross-referencing Heart & Life lines for mutual cosmic synergy...'
          : 'Aligning palmar creases with celestial house coordinates...';
      }
      if (loadingProgressBar) loadingProgressBar.style.width = '44%';
    }, 2800));

    // Step 2: EXACTLY AT 4.0 SECONDS -> STOP SCANNING & REVEAL NEON LINES & BADGES
    animationTimeouts.push(setTimeout(() => {
      if (handScannerViewport) {
        handScannerViewport.classList.remove('scanning'); // Stop and remove laser sweep!
        handScannerViewport.classList.add('mapped');      // Reveal the 4 neon lines and badges!
      }
      if (scannerKicker) scannerKicker.innerHTML = '<span class="pulse-star">✨</span> Celestial Alignment Complete';
      if (scannerTitle) scannerTitle.textContent = isTwo ? 'Dual Palm Contours Mapped' : 'Major Palm Lines Mapped';
      if (scannerSubtitle) scannerSubtitle.textContent = isTwo
        ? 'Heart lines & Venus mounts aligned for compatibility'
        : '4 Primary Lines Identified · Heart, Head, Life & Fate';
      if (scannerStatus) scannerStatus.textContent = isTwo
        ? 'Heart, Head, Life and Venus synergies mapped for both partners'
        : 'Heart line, Head line, Life line & Fate line mapped';
      if (loadingProgressBar) loadingProgressBar.style.width = '68%';
    }, 4000));

    // Post-mapping synthesis updates
    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) {
        scannerStatus.textContent = isTwo
          ? 'Synthesizing two-chart astrology with dual Hast Rekha contours...'
          : 'Synthesizing planetary archetype with Hast Rekha contours...';
      }
      if (loadingProgressBar) loadingProgressBar.style.width = '88%';
    }, 5500));

    animationTimeouts.push(setTimeout(() => {
      if (scannerStatus) scannerStatus.textContent = 'Cosmic reflection ready · Finalizing personalized report...';
      if (loadingProgressBar) loadingProgressBar.style.width = '98%';
    }, 6800));

    // Gather Person 1 traits
    const firstName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Seeker';
    const dob = sessionStorage.getItem(STORAGE_KEYS.DOB) || '';
    const sunSign = sessionStorage.getItem(STORAGE_KEYS.SUN_SIGN) || 'Aries';
    const lifePath = parseInt(sessionStorage.getItem(STORAGE_KEYS.LIFE_PATH) || '7', 10);
    const birthplace = sessionStorage.getItem(STORAGE_KEYS.BIRTHPLACE) || 'Not specified';
    const birthTime = sessionStorage.getItem(STORAGE_KEYS.BIRTH_TIME) || sessionStorage.getItem(STORAGE_KEYS.TIME_BUCKET) || '12:00';

    let payload;
    if (isTwo) {
      const p2Name = sessionStorage.getItem(STORAGE_KEYS.P2_NAME) || 'Partner';
      const p2Dob = sessionStorage.getItem(STORAGE_KEYS.P2_DOB) || '';
      const p2SunSign = sessionStorage.getItem(STORAGE_KEYS.P2_SUN_SIGN) || 'Libra';
      const p2LifePath = parseInt(sessionStorage.getItem(STORAGE_KEYS.P2_LIFE_PATH) || '6', 10);
      const p2Birthplace = sessionStorage.getItem(STORAGE_KEYS.P2_BIRTHPLACE) || 'Not specified';
      const p2BirthTime = sessionStorage.getItem(STORAGE_KEYS.P2_BIRTH_TIME) || sessionStorage.getItem(STORAGE_KEYS.P2_TIME_BUCKET) || '12:00';

      payload = {
        isTwoPerson: true,
        cardFocus: selectedCardFocus ? selectedCardFocus.key : 'dating_mood_on',
        person1: {
          name: firstName,
          dob: dob,
          sunSign: sunSign,
          lifePath: lifePath,
          birthplace: birthplace,
          birthTime: birthTime,
          timeBucket: birthTime,
          palmImage: sanitizedPalmDataUrlP1 || sanitizedPalmDataUrl,
          isDemoPalm: false
        },
        person2: {
          name: p2Name,
          dob: p2Dob,
          sunSign: p2SunSign,
          lifePath: p2LifePath,
          birthplace: p2Birthplace,
          birthTime: p2BirthTime,
          timeBucket: p2BirthTime,
          palmImage: sanitizedPalmDataUrlP2,
          isDemoPalm: false
        }
      };
    } else {
      payload = {
        name: firstName,
        dob: dob,
        sunSign,
        lifePath,
        birthplace,
        birthTime,
        timeBucket: birthTime,
        palmImage: sanitizedPalmDataUrl,
        isDemoPalm: false,
        cardFocus: selectedCardFocus ? selectedCardFocus.key : 'general'
      };
    }

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
    const isTwo = isTwoPersonMode();
    const firstName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Seeker';
    const p2Name = sessionStorage.getItem(STORAGE_KEYS.P2_NAME) || 'Partner';
    if (rUserName) {
      rUserName.textContent = isTwo ? `${firstName} & ${p2Name}` : firstName;
    }

    // 1. Hero Atmosphere Header
    const summary = data.summary || {};
    const catKey = summary.categoryKey || (selectedCardFocus ? selectedCardFocus.key : 'karma_is_loading');

    if (resultsCategoryIcon) {
      resultsCategoryIcon.textContent = summary.categoryIcon || (selectedCardFocus ? selectedCardFocus.emoji : '🪷');
    }
    if (resultsCategoryName) {
      resultsCategoryName.textContent = summary.categoryName || (selectedCardFocus ? selectedCardFocus.name : 'Karma Is Loading');
    }
    if (resultsSubtitlePill) {
      resultsSubtitlePill.textContent = summary.subtitle || 'Your Life Lessons & Growth Report';
    }

    // Legacy Titles for compatibility
    if (summaryCategoryTitle) {
      summaryCategoryTitle.textContent = summary.title || (selectedCardFocus ? selectedCardFocus.name : 'Cosmic Vibe Summary');
    }
    if (summarySeekerSubtitle) {
      summarySeekerSubtitle.textContent = isTwo
        ? `Bond Synergy Reflections for ${firstName} & ${p2Name}`
        : `Personal Reflections for ${firstName}`;
    }

    // Top Summary Card
    const reportTitles = {
      karma_is_loading: 'Your Karma Report',
      future_millionaire: 'Your Career Report',
      bond_check: 'Your Bond Report',
      dating_mood_on: 'Your Compatibility Report'
    };
    if (summaryReportIcon) {
      summaryReportIcon.textContent = summary.reportIcon || '⚖️';
    }
    if (summaryReportTitle) {
      summaryReportTitle.textContent = reportTitles[catKey] || 'Your Report';
    }
    if (summaryScoreLabel) {
      summaryScoreLabel.textContent = summary.scoreLabel || 'Overall Balance Score';
    }
    if (summaryVibeScore) {
      summaryVibeScore.textContent = summary.score || 85;
    }
    if (summaryPersonaLabel) {
      summaryPersonaLabel.textContent = summary.personaLabel || 'Your Karma Persona';
    }
    if (summaryVibeLabel) {
      summaryVibeLabel.textContent = summary.label || (selectedCardFocus ? selectedCardFocus.subtitle : 'The Self-Growth Explorer 🌱');
    }

    // 5 Horizontal Progress Bars with Neon Purple Fills
    if (summaryMetricsList) {
      summaryMetricsList.innerHTML = '';
      const metrics = Array.isArray(summary.metrics) ? summary.metrics : [];
      metrics.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = 'summary-metric-row';
        const fillId = `metric-fill-bar-${idx}`;
        const labelText = escapeHtml(m.displayLabel || m.label || 'Synergy');
        const iconText = escapeHtml(m.icon || '✨');
        item.innerHTML = `
          <div class="metric-info-col">
            <span class="metric-emoji">${iconText}</span>
            <span class="metric-name">${labelText}</span>
          </div>
          <div class="metric-bar-track">
            <div class="metric-bar-fill" id="${fillId}" style="width: 0%;"></div>
          </div>
          <div class="metric-percent-col">${m.value}%</div>
        `;
        summaryMetricsList.appendChild(item);

        // Animate progression smoothly
        setTimeout(() => {
          const fillEl = document.getElementById(fillId);
          if (fillEl) {
            fillEl.style.width = `${Math.min(100, Math.max(10, m.value))}%`;
          }
        }, 80 + idx * 60);
      });
    }

    // 2. The 6 Core Content Cards
    const sec = data.sections || {};
    if (rPastText) {
      rPastText.textContent = sec.past || 'Valuable past experiences have helped shape your instincts.';
    }
    if (rPresentText) {
      rPresentText.textContent = sec.present || 'You are standing in a grounded space of clear awareness and positive energy.';
    }
    if (rFutureWittyText) {
      rFutureWittyText.textContent = sec.future || 'Encouraging possibilities are taking shape right on schedule.';
    }

    if (rStrengthsIcon) {
      rStrengthsIcon.textContent = summary.strengthsIcon || '💪';
    }
    if (rStrengthsTitle) {
      rStrengthsTitle.textContent = summary.strengthsTitle || 'Your Strengths';
    }
    if (rWatchOutTitle) {
      rWatchOutTitle.textContent = summary.watchOutTitle || 'Watch Out For';
    }
    if (rNextMoveTitle) {
      rNextMoveTitle.textContent = summary.nextMoveTitle || 'Your Next Move';
    }

    if (rStrengthsList) {
      rStrengthsList.innerHTML = '';
      const strengths = Array.isArray(sec.strengths) ? sec.strengths : ['Resilient and adaptable', 'Learn from mistakes'];
      strengths.forEach(st => {
        const li = document.createElement('li');
        li.className = 'tile-bullet-item';
        li.innerHTML = `<span class="bullet-dot" aria-hidden="true">•</span><span class="bullet-text">${escapeHtml(st.replace(/^[•\-\*]\s*/, ''))}</span>`;
        rStrengthsList.appendChild(li);
      });
    }

    if (rWatchOutList) {
      rWatchOutList.innerHTML = '';
      const watchOuts = Array.isArray(sec.watchOutFor) ? sec.watchOutFor : ['Repeating old habits', 'Getting affected by negativity'];
      watchOuts.forEach(wo => {
        const li = document.createElement('li');
        li.className = 'tile-bullet-item';
        li.innerHTML = `<span class="bullet-dot" aria-hidden="true">•</span><span class="bullet-text">${escapeHtml(wo.replace(/^[•\-\*]\s*/, ''))}</span>`;
        rWatchOutList.appendChild(li);
      });
    }

    if (rNextMoveList) {
      rNextMoveList.innerHTML = '';
      const moves = Array.isArray(sec.nextMoveList) && sec.nextMoveList.length > 0
        ? sec.nextMoveList
        : (sec.nextMove ? sec.nextMove.split(/,\s*|\.\s*/).filter(Boolean) : ['Pick one main goal', 'Keep consistent']);
      moves.forEach(mv => {
        const li = document.createElement('li');
        li.className = 'tile-bullet-item';
        li.innerHTML = `<span class="bullet-dot" aria-hidden="true">•</span><span class="bullet-text">${escapeHtml(mv.replace(/^[•\-\*]\s*/, ''))}</span>`;
        rNextMoveList.appendChild(li);
      });
    }

    if (rNextMoveText) {
      rNextMoveText.textContent = sec.nextMove || 'Take a clear, intentional step forward today.';
    }

    // 3. Final Verdict Banner
    if (verdictBadgeImg) {
      const badgeMap = {
        karma_is_loading: 'verdict_lotus.jpg',
        future_millionaire: 'verdict_trophy.jpg',
        bond_check: 'verdict_hearts.jpg',
        dating_mood_on: 'verdict_couple.jpg'
      };
      const badgeFile = summary.badgeImg || badgeMap[catKey] || 'verdict_lotus.jpg';
      verdictBadgeImg.src = `/${badgeFile}`;
    }

    if (rVerdictHeadline) {
      rVerdictHeadline.textContent = sec.verdictHeadline || summary.verdictHeadline || 'Your karma is in a "Reset & Grow" phase!';
    }

    if (rFinalVerdictText) {
      rFinalVerdictText.textContent = sec.finalVerdict || 'The universe is clearing old baggage and preparing you for a better, brighter you.';
    }

    // 3. Palm Highlights
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

    // 4. Archetype Hero Card & Legacy Fields for Full Backward Compatibility
    if (data.archetype) {
      if (rArchetypeTitle) rArchetypeTitle.textContent = data.archetype.title || 'The Inquisitive Wayfarer';
      if (rArchetypeGift) rArchetypeGift.textContent = `Core Gift: ${data.archetype.coreGift || 'Reflective Wisdom'}`;
      if (rTagZodiac) rTagZodiac.textContent = `${data.archetype.zodiacSign || 'Aries'} ♈`;
      if (rTagLifepath) rTagLifepath.textContent = `Path ${data.archetype.lifePathNumber || 7} 🌟`;
      if (rTagTime) rTagTime.textContent = data.archetype.solarAlignment || 'Morning';
    }

    if (data.personalityReflection && rPersonalitySummary) {
      rPersonalitySummary.textContent = data.personalityReflection.summary || '';
    }
    if (data.strengthsAndGrowth && rStrengthsText) {
      rStrengthsText.textContent = data.strengthsAndGrowth.coreStrengths || '';
    }
    if (data.relationshipsAndCommunication && rRelationshipsSummary) {
      rRelationshipsSummary.textContent = data.relationshipsAndCommunication.summary || '';
    }

    // Provider / Mode Footer
    if (rModeInfo) {
      const mode = data?.meta?.mode === 'live' ? 'Live Gemini AI' : 'Cosmic Synthesis Engine';
      rModeInfo.textContent = `Engine: ${mode} · Strictly Private & In-Memory`;
    }

    // Highlight Chosen Card Focus in Results if selected
    if (selectedCardFocus) {
      if (resultsFocusBanner && resultsFocusText) {
        resultsFocusText.textContent = `${selectedCardFocus.emoji} ${selectedCardFocus.name}`;
        resultsFocusBanner.style.display = 'inline-flex';
      }

      const targetCardEl = document.getElementById(selectedCardFocus.targetCardId);
      if (targetCardEl) {
        document.querySelectorAll('.witty-card, .result-card').forEach(c => c.classList.remove('card-focus-highlighted'));
        targetCardEl.classList.add('card-focus-highlighted');

        setTimeout(() => {
          targetCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 650);
      }
    } else {
      if (resultsFocusBanner) resultsFocusBanner.style.display = 'none';
      document.querySelectorAll('.witty-card, .result-card').forEach(c => c.classList.remove('card-focus-highlighted'));
    }
  }

  // -------------------------------------------------------------
  // 10. Copy Summary to Clipboard
  // -------------------------------------------------------------
  if (btnCopySummary) {
    btnCopySummary.addEventListener('click', () => {
      if (!currentReadingData) return;

      const isTwo = isTwoPersonMode();
      const firstName = sessionStorage.getItem(STORAGE_KEYS.FIRST_NAME) || 'Seeker';
      const p2Name = sessionStorage.getItem(STORAGE_KEYS.P2_NAME) || 'Partner';
      const summary = currentReadingData.summary || {};
      const sec = currentReadingData.sections || {};

      const metricsText = Array.isArray(summary.metrics)
        ? summary.metrics.map(m => `  • ${m.label}: ${m.value}%`).join('\n')
        : '';

      const strengthsText = Array.isArray(sec.strengths)
        ? sec.strengths.map(s => `  ${s}`).join('\n')
        : '';

      const watchOutText = Array.isArray(sec.watchOutFor)
        ? sec.watchOutFor.map(w => `  ${w}`).join('\n')
        : '';

      const fullReportText =
`✨ ${summary.title || 'Cosmic Reflection Report'} ✨
👤 ${isTwo ? `${firstName} & ${p2Name}` : firstName}
⭐ Overall Vibe Score: ${summary.score || 88}/100
🏷️ Vibe Label: ${summary.label || 'Cosmic Seeker'}

📊 SYNERGY METRICS:
${metricsText}

⏳ THE PAST:
${sec.past || ''}

⚡ THE PRESENT:
${sec.present || ''}

🔮 THE FUTURE:
${sec.future || ''}

🌟 YOUR STRENGTHS:
${strengthsText}

⚠️ WATCH OUT FOR:
${watchOutText}

🎯 YOUR NEXT MOVE:
${sec.nextMove || ''}

🏆 A FUNNY FINAL VERDICT:
${sec.finalVerdict || ''}

(For entertainment & self-reflection only · AI Jyotish)`;

      navigator.clipboard.writeText(fullReportText)
        .then(() => showToast('Complete reflection copied to clipboard! ✨'))
        .catch(() => showToast('Unable to copy summary automatically.'));
    });
  }

  // -------------------------------------------------------------
  // 11. Start New Reading & State Reset
  // -------------------------------------------------------------
  if (btnStartNew) {
    btnStartNew.addEventListener('click', () => {
      resetToStart();
    });
  }

  function resetToStart() {
    // 1. Reset all form inputs
    if (inputFirstName) inputFirstName.value = '';
    if (inputDob) inputDob.value = '';
    if (inputBirthplace) inputBirthplace.value = '';
    if (inputTime) inputTime.value = '';
    if (inputP2Name) inputP2Name.value = '';
    if (inputP2Dob) inputP2Dob.value = '';
    if (inputP2Birthplace) inputP2Birthplace.value = '';
    if (inputP2Time) inputP2Time.value = '';

    // Clear validation hints
    [hintFirstName, hintDob, hintBirthplace, hintTime, hintP2Name, hintP2Dob, hintP2Birthplace, hintP2Time].forEach(h => {
      if (h) h.textContent = '';
    });

    // 2. Clear session storage
    Object.values(STORAGE_KEYS).forEach(k => {
      try { sessionStorage.removeItem(k); } catch {}
    });

    // 3. Reset internal memory state
    sanitizedPalmDataUrl = null;
    sanitizedPalmDataUrlP1 = null;
    sanitizedPalmDataUrlP2 = null;
    isDemoPalm = false;
    isDemoPalmP1 = false;
    isDemoPalmP2 = false;
    currentReadingData = null;
    selectedCardFocus = null;

    // 4. Reset palm uploads & previews
    if (palmPreviewImg) {
      palmPreviewImg.src = '';
      palmPreviewImg.style.display = 'none';
    }
    if (palmPreviewImgP1) {
      palmPreviewImgP1.src = '';
      palmPreviewImgP1.style.display = 'none';
    }
    if (palmPreviewImgP2) {
      palmPreviewImgP2.src = '';
      palmPreviewImgP2.style.display = 'none';
    }

    if (palmStatusText) palmStatusText.textContent = 'No photo selected';
    if (palmStatusTextP1) palmStatusTextP1.textContent = 'No palm selected';
    if (palmStatusTextP2) palmStatusTextP2.textContent = 'No palm selected';

    if (palmStatusBadge) palmStatusBadge.querySelector('.status-dot')?.classList.remove('active');
    if (palmStatusBadgeP1) palmStatusBadgeP1.querySelector('.status-dot')?.classList.remove('active');
    if (palmStatusBadgeP2) palmStatusBadgeP2.querySelector('.status-dot')?.classList.remove('active');

    if (pickPhotoText) pickPhotoText.textContent = 'Take or Upload Palm Photo';
    if (pickPhotoTextP1) pickPhotoTextP1.textContent = 'Upload Palm 1';
    if (pickPhotoTextP2) pickPhotoTextP2.textContent = 'Upload Palm 2';

    if (btnAnalyzePalm) btnAnalyzePalm.style.display = 'none';

    // 5. Navigate back to welcome screen cleanly
    showScreen('welcome');
    showToast('Ready for a new reading! ✨');
    console.log('[event] reading_reset_completed');
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

  // Initialize and play Intro Video on site open
  initIntroVideo();
});
