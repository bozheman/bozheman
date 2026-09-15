import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { setupMatrix } from './matrix.js';
import { t, applyTranslations } from './i18n.js';
import { AudioEngine } from './engine/audio.js';
import { State } from './state.js';

// --- НАСТРОЙКИ ---
const PRELOADER_LINES = [
  { key: 'preloader_1', delay: 80 },
  { key: 'preloader_2', delay: 50 },
  { key: 'preloader_3', delay: 80 },
  { key: 'preloader_4', delay: 50 }
];

const LINKS = [
  { name: 'Twitch',       url: 'https://www.twitch.tv/Bozhemany' },
  { name: 'Instagram',    url: 'https://www.instagram.com/bozheman' },
  { name: 'YouTube',      url: 'https://www.youtube.com/channel/UC_BgtvZc1dxQbJA1uEeFimw' },
  { name: 'TikTok',       url: 'https://www.tiktok.com/@bozheman_' },
  { name: 'nav_games',    url: 'games.html' },
  { name: 'nav_donation', url: 'https://donatello.to/bozheman', isSpecial: true },
];

const SECRET_CLICK_COUNT = 10;
const SECRET_LINK_URL = 'doubleindex.html';

// DOM refs
const preloader       = document.getElementById('preloader');
const preloaderText   = document.getElementById('preloader-text');
const sceneContainer  = document.getElementById('scene-container');
const sceneCanvas     = document.getElementById('scene-canvas');
const soundToggle     = document.getElementById('sound-toggle');
const ambientAudio    = document.getElementById('ambient-audio');
const linksContainer  = document.getElementById('links-container');
const crtToggle       = document.getElementById('crt-toggle');
const crtOverlay      = document.getElementById('crt-overlay');
const terminalWidget  = document.getElementById('terminal-widget');

let scene, camera, renderer, controls;
let mainObject, innerObject;
let secretClickCounter = 0;
let wasPlayingOnHide   = false;

// --- ИНИЦИАЛИЗАЦИЯ АУДИО ---
if (ambientAudio) {
  ambientAudio.volume = 0.5;
  ambientAudio.pause();
}
if (soundToggle) soundToggle.classList.add('muted');

// --- ПРЕЛОАДЕР ---
let preloaderSkipped     = false;
let currentTypingInterval = null;

function skipPreloader() {
  if (preloaderSkipped) return;
  preloaderSkipped = true;
  if (currentTypingInterval) clearInterval(currentTypingInterval);
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.style.display = 'none', 1000);
  }
  document.removeEventListener('click', skipPreloader);
  document.removeEventListener('keydown', handlePreloaderKeyDown);
}

function handlePreloaderKeyDown(e) {
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') skipPreloader();
}

async function runPreloader() {
  document.addEventListener('click', skipPreloader);
  document.addEventListener('keydown', handlePreloaderKeyDown);

  for (const line of PRELOADER_LINES) {
    if (preloaderSkipped) break;
    await typeLine(t(line.key), 50);
    if (preloaderSkipped) break;
    await new Promise(resolve => {
      const timer = setTimeout(resolve, line.delay);
      const checkInterval = setInterval(() => {
        if (preloaderSkipped) { clearTimeout(timer); clearInterval(checkInterval); resolve(); }
      }, 30);
      setTimeout(() => clearInterval(checkInterval), line.delay + 50);
    });
  }
  if (!preloaderSkipped) skipPreloader();
}

function typeLine(text, speed) {
  return new Promise(resolve => {
    if (preloaderSkipped) return resolve();
    let i = 0;
    if (!preloaderText) return resolve();
    preloaderText.innerHTML = '';
    currentTypingInterval = setInterval(() => {
      if (preloaderSkipped) { clearInterval(currentTypingInterval); return resolve(); }
      if (i < text.length) { preloaderText.innerHTML += text.charAt(i); i++; }
      else { clearInterval(currentTypingInterval); resolve(); }
    }, speed);
  });
}

// --- 3D СЦЕНА ---
function init() {
  if (!sceneContainer || !sceneCanvas) return;

  scene    = new THREE.Scene();
  camera   = new THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
  camera.position.z = 3.5;

  renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true, alpha: true });
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  scene.add(new THREE.PointLight(0xff0000, 150, 100));

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.enableZoom       = false;
  controls.enablePan        = false;
  controls.autoRotate       = true;
  controls.autoRotateSpeed  = 1.0;

  createMainObject();
  createLinkButtons();
  setupMatrix('matrix-canvas');
  animate();

  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onWindowResize, 100);
  });

  sceneCanvas.addEventListener('click', onCanvasClick);
  if (soundToggle) soundToggle.addEventListener('click', toggleSound);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (ambientAudio && !ambientAudio.paused) { ambientAudio.pause(); wasPlayingOnHide = true; }
    } else {
      if (wasPlayingOnHide && ambientAudio) { ambientAudio.play().catch(() => {}); wasPlayingOnHide = false; }
    }
  });
}

function createMainObject() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff3333, emissive: 0xcc0000, emissiveIntensity: 0.8,
    metalness: 0.8, roughness: 0.2, wireframe: true
  });
  mainObject = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), mat);
  scene.add(mainObject);

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1.2,
    metalness: 1.0, roughness: 0.1, wireframe: true
  });
  innerObject = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), innerMat);
  mainObject.add(innerObject);
}

function createLinkButtons() {
  if (!linksContainer) return;
  linksContainer.innerHTML = '';
  LINKS.forEach(link => {
    const a = document.createElement('a');
    a.href      = link.url;
    a.className = 'btn-glitch';
    a.textContent = t(link.name);
    a.setAttribute('data-text', t(link.name));
    a.setAttribute('data-i18n', link.name);
    if (link.url.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    if (link.isSpecial) a.classList.add('special');
    a.addEventListener('mouseenter', () => { if (!State.get().audioMuted) AudioEngine.tick(); });
    linksContainer.appendChild(a);
  });
}

// Перестраиваем кнопки при смене языка
document.addEventListener('languagechange', () => {
  createLinkButtons();
  applyTranslations();
  updateCrtToggleLabel();
});

function animate() {
  requestAnimationFrame(animate);
  if (mainObject)  { mainObject.rotation.x += 0.005; mainObject.rotation.y += 0.008; }
  if (innerObject) { innerObject.rotation.x -= 0.01; innerObject.rotation.y -= 0.015; }
  controls.update();
  TWEEN.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  if (!sceneContainer) return;
  camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
}

function onCanvasClick() {
  secretClickCounter++;
  if (!State.get().audioMuted) AudioEngine.snap();

  const pulse = (obj, intensity) => {
    if (!obj) return;
    new TWEEN.Tween({ v: obj.material.emissiveIntensity })
      .to({ v: intensity }, 100)
      .easing(TWEEN.Easing.Quadratic.Out)
      .yoyo(true).repeat(1)
      .onUpdate(({ v }) => { obj.material.emissiveIntensity = v; })
      .start();
  };
  pulse(mainObject, 2.5);
  pulse(innerObject, 3.0);

  if (secretClickCounter >= SECRET_CLICK_COUNT) activateSecretProtocol();
}

function activateSecretProtocol() {
  console.log('SECRET PROTOCOL ACTIVATED!');
  if (!State.get().audioMuted) { AudioEngine.glitch(); AudioEngine.win(); }
  document.body.classList.add('glitch-out');
  const spin = (obj, sign) => {
    if (!obj) return;
    new TWEEN.Tween(obj.rotation)
      .to({ x: obj.rotation.x + sign * Math.PI * 6, y: obj.rotation.y + sign * Math.PI * 6 }, 1500)
      .easing(TWEEN.Easing.Exponential.In).start();
  };
  spin(mainObject,  1);
  spin(innerObject, -1);
  setTimeout(() => { window.location.href = SECRET_LINK_URL; }, 1500);
}

function toggleSound() {
  if (!ambientAudio) return;
  if (ambientAudio.paused) {
    ambientAudio.play().catch(e => console.error('Audio play failed:', e));
    soundToggle.classList.remove('muted');
    soundToggle.querySelector('span[data-i18n]').setAttribute('data-i18n', 'sound_on');
    soundToggle.querySelector('span[data-i18n]').textContent = t('sound_on');
    State.set({ audioMuted: false });
  } else {
    ambientAudio.pause();
    soundToggle.classList.add('muted');
    soundToggle.querySelector('span[data-i18n]').setAttribute('data-i18n', 'sound_off');
    soundToggle.querySelector('span[data-i18n]').textContent = t('sound_off');
    State.set({ audioMuted: true });
  }
}

// --- CRT TOGGLE ---
let crtEnabled = true;

function updateCrtToggleLabel() {
  if (crtToggle) {
    crtToggle.textContent = crtEnabled ? t('crt_on') : t('crt_off');
    crtToggle.setAttribute('data-i18n', crtEnabled ? 'crt_on' : 'crt_off');
  }
}

if (crtToggle && crtOverlay) {
  crtToggle.addEventListener('click', () => {
    crtEnabled = !crtEnabled;
    crtOverlay.style.display = crtEnabled ? 'block' : 'none';
    updateCrtToggleLabel();
    if (!State.get().audioMuted) AudioEngine.click();
  });
}

// --- TERMINAL WIDGET ---
const TERMINAL_LOGS = [
  '> INIT_CONNECTION...',
  '> BYPASSING_ICE... [OK]',
  '> FETCHING_NODE_DATA... [OK]',
  '> LOADING_MODULES... [OK]',
  '> ANALYZING_TRAFFIC... [OK]',
  '> PROTOCOL_BOZHEMAN: ACTIVE',
];
let termLogIdx = 0;
if (terminalWidget) {
  setInterval(() => {
    const p = document.createElement('div');
    p.textContent = TERMINAL_LOGS[termLogIdx % TERMINAL_LOGS.length];
    terminalWidget.appendChild(p);
    if (terminalWidget.children.length > 5) terminalWidget.removeChild(terminalWidget.firstChild);
    termLogIdx++;
  }, 2500);
}

// --- START ---
init();
runPreloader();
