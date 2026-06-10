/* ═══════════════════════════════════════
   AR Vision – Application Logic
   ═══════════════════════════════════════ */

'use strict';

// ─── State ───
let arActive = false;
let markersFound = { hiro: false, kanji: false };

// ─── Elements ───
const splash      = document.getElementById('splash');
const arContainer = document.getElementById('ar-container');
const markerPage  = document.getElementById('marker-page');
const hudStatus   = document.getElementById('hud-status');
const statusText  = document.getElementById('status-text');
const statusDot   = hudStatus.querySelector('.status-dot');
const instructPill = document.getElementById('instruction-pill');
const miHiro      = document.getElementById('mi-hiro');
const miKanji     = document.getElementById('mi-kanji');
const printOverlay = document.getElementById('print-overlay');
const printImg    = document.getElementById('print-img');

// ════════════════════════════════
// Start AR
// ════════════════════════════════
async function startAR() {
  // Request camera permission first
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    // Stop the test stream, A-Frame will handle its own
    stream.getTracks().forEach(t => t.stop());
  } catch (err) {
    showPermissionError(err);
    return;
  }

  // Transition out splash
  splash.classList.add('exit');
  setTimeout(() => splash.classList.add('hidden'), 600);

  // Show AR container
  arContainer.classList.remove('hidden');
  arActive = true;

  // Setup marker events after scene loads
  const scene = document.getElementById('ar-scene');
  if (scene.hasLoaded) {
    setupMarkerEvents();
  } else {
    scene.addEventListener('loaded', setupMarkerEvents);
  }
}

// ════════════════════════════════
// Marker Events
// ════════════════════════════════
function setupMarkerEvents() {
  const hiroEl   = document.getElementById('marker-hiro-el');
  const kanjiEl  = document.getElementById('marker-kanji-el');

  if (hiroEl) {
    hiroEl.addEventListener('markerFound', () => onMarkerFound('hiro'));
    hiroEl.addEventListener('markerLost',  () => onMarkerLost('hiro'));
  }

  if (kanjiEl) {
    kanjiEl.addEventListener('markerFound', () => onMarkerFound('kanji'));
    kanjiEl.addEventListener('markerLost',  () => onMarkerLost('kanji'));
  }
}

function onMarkerFound(name) {
  markersFound[name] = true;
  updateHUD();

  // Highlight indicator
  if (name === 'hiro')  miHiro.classList.add('active');
  if (name === 'kanji') miKanji.classList.add('active');

  // Haptic feedback (mobile)
  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
}

function onMarkerLost(name) {
  markersFound[name] = false;
  updateHUD();

  if (name === 'hiro')  miHiro.classList.remove('active');
  if (name === 'kanji') miKanji.classList.remove('active');
}

function updateHUD() {
  const anyFound = markersFound.hiro || markersFound.kanji;

  if (anyFound) {
    statusDot.className = 'status-dot found';
    statusText.textContent = '✓ Marker Terdeteksi';
    hudStatus.classList.add('found');
    instructPill.textContent = '🎉 AR aktif – gerakkan kamera perlahan';
    instructPill.classList.add('found');
  } else {
    statusDot.className = 'status-dot scanning';
    statusText.textContent = 'Mencari marker…';
    hudStatus.classList.remove('found');
    instructPill.innerHTML = '📷 Arahkan ke <strong>Hiro</strong> atau <strong>Kanji</strong> marker';
    instructPill.classList.remove('found');
  }
}

// ════════════════════════════════
// Exit AR
// ════════════════════════════════
function exitAR() {
  arActive = false;

  // Hide AR
  arContainer.classList.add('hidden');

  // Reload scene to stop camera (clean approach)
  const scene = document.getElementById('ar-scene');
  if (scene) {
    // Stop all video tracks
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      if (v.srcObject) v.srcObject.getTracks().forEach(t => t.stop());
    });
  }

  // Show splash
  splash.classList.remove('hidden', 'exit');
  splash.style.opacity = '0';
  splash.style.transform = 'scale(0.97)';
  requestAnimationFrame(() => {
    splash.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    splash.style.opacity = '1';
    splash.style.transform = 'scale(1)';
  });

  // Reset state
  markersFound = { hiro: false, kanji: false };
  miHiro.classList.remove('active');
  miKanji.classList.remove('active');
  updateHUD();
}

// ════════════════════════════════
// Marker Page
// ════════════════════════════════
function showMarkerPage() {
  markerPage.classList.remove('hidden');
}

function hidePage(id) {
  document.getElementById(id).classList.add('hidden');
}

function printMarker(type) {
  const urls = {
    hiro:  'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png',
    kanji: 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/kanji.png',
  };
  printImg.src = urls[type];
  printOverlay.classList.remove('hidden');
}

// ════════════════════════════════
// Permission Error
// ════════════════════════════════
function showPermissionError(err) {
  const msg = err.name === 'NotAllowedError'
    ? 'Akses kamera ditolak. Izinkan kamera di pengaturan browser Anda, lalu coba lagi.'
    : 'Kamera tidak tersedia. Pastikan perangkat Anda memiliki kamera yang terhubung.';

  // Create toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
    background:#1a0a0a; border:1.5px solid #ff006e; border-radius:50px;
    padding:14px 28px; color:#fff; font-family:'Outfit',sans-serif;
    font-size:0.9rem; z-index:9999; max-width:90%; text-align:center;
    box-shadow: 0 0 30px rgba(255,0,110,0.4);
    animation: fadeUp 0.4s ease both;
  `;
  toast.textContent = '⚠️ ' + msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// ════════════════════════════════
// Keyboard shortcuts
// ════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (arActive) exitAR();
    if (!markerPage.classList.contains('hidden')) hidePage('marker-page');
    if (!printOverlay.classList.contains('hidden')) printOverlay.classList.add('hidden');
  }
});

// Close print overlay on backdrop click
printOverlay.addEventListener('click', e => {
  if (e.target === printOverlay) printOverlay.classList.add('hidden');
});

// ════════════════════════════════
// Device orientation check
// ════════════════════════════════
window.addEventListener('load', () => {
  // Warn if iOS and not HTTPS
  const isIOS  = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isHTTP = location.protocol === 'http:' && location.hostname !== 'localhost';

  if (isIOS && isHTTP) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:9999;
      background:linear-gradient(90deg,#ff006e,#7b2ff7);
      color:#fff; font-family:'Outfit',sans-serif; font-size:0.82rem;
      text-align:center; padding:8px 16px;
    `;
    banner.innerHTML = '⚠️ Di iPhone/iPad diperlukan <strong>HTTPS</strong> untuk akses kamera AR';
    document.body.prepend(banner);
  }
});

// A-Frame custom component: register marker events via attribute
AFRAME.registerComponent('registerevents', {
  init: function () {
    const el = this.el;
    el.addEventListener('markerFound', function () {
      // handled by id-based listeners above
    });
  }
});
