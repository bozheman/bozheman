import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { setupMatrix } from './matrix.js';
import { t, applyTranslations } from './i18n.js';
import { AudioEngine } from './engine/audio.js';
import { State } from './state.js';
import { initHUD, appendLog } from './hud.js';

// --- НАСТРОЙКИ ---
const PRELOADER_LINES = [
  { key: 'preloader_1', delay: 70 },
  { key: 'preloader_2', delay: 45 },
  { key: 'preloader_3', delay: 70 },
  { key: 'preloader_4', delay: 45 }
];

const LINKS = [
  { name: 'Twitch',       url: 'https://www.twitch.tv/Bozhemany' },
  { name: 'Instagram',    url: 'https://www.instagram.com/bozheman' },
  { name: 'YouTube',      url: 'https://www.youtube.com/channel/UC_BgtvZc1dxQbJA1uEeFimw' },
  { name: 'TikTok',       url: 'https://www.tiktok.com/@bozheman_' },
  { name: 'nav_games',    url: 'games.html' },
  { name: 'nav_slots',    url: 'roulet.html', showBalance: true },
  { name: 'nav_donation', url: 'https://donatello.to/bozheman', isSpecial: true },
];

const SECRET_CLICK_COUNT = 10;
const SECRET_LINK_URL = 'doubleindex.html';

// DOM refs
const preloader      = document.getElementById('preloader');
const preloaderText  = document.getElementById('preloader-text');
const sceneContainer = document.getElementById('scene-container');
const sceneCanvas    = document.getElementById('scene-canvas');
const linksContainer = document.getElementById('links-container');

let scene, camera, renderer, controls;
let mainObject, innerObject, outerRing, particleCloud;
let secretClickCounter = 0;

// --- ПРЕЛОАДЕР ---
let preloaderSkipped = false;
let currentTypingInterval = null;

function skipPreloader() {
  if (preloaderSkipped) return;
  preloaderSkipped = true;
  try { sessionStorage.setItem('bzp_preloader_done', '1'); } catch {}
  if (currentTypingInterval) clearInterval(currentTypingInterval);
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => { preloader.style.display = 'none'; }, 900);
  }
  document.removeEventListener('click', skipPreloader);
  document.removeEventListener('keydown', handlePreloaderKeyDown);
}

function handlePreloaderKeyDown(e) {
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') skipPreloader();
}

async function runPreloader() {
  try {
    if (sessionStorage.getItem('bzp_preloader_done') === '1') {
      if (preloader) preloader.style.display = 'none';
      preloaderSkipped = true;
      return;
    }
  } catch {}

  document.addEventListener('click', skipPreloader);
  document.addEventListener('keydown', handlePreloaderKeyDown);

  for (const line of PRELOADER_LINES) {
    if (preloaderSkipped) break;
    await typeLine(t(line.key), 42);
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
    preloaderText.textContent = '';
    currentTypingInterval = setInterval(() => {
      if (preloaderSkipped) { clearInterval(currentTypingInterval); return resolve(); }
      if (i < text.length) {
        preloaderText.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(currentTypingInterval);
        resolve();
      }
    }, speed);
  });
}

// --- 3D СЦЕНА ---
function init() {
  initHUD();
  createLinkButtons();
  setupMatrix('matrix-canvas');

  if (!sceneContainer || !sceneCanvas) return;

  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
  camera.position.z = 3.5;

  renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true, alpha: true });
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const redLight = new THREE.PointLight(0xff0000, 160, 100);
  redLight.position.set(2, 2, 3);
  scene.add(redLight);

  const pinkLight = new THREE.PointLight(0xff00de, 75, 80);
  pinkLight.position.set(-3, -2, 2);
  scene.add(pinkLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping   = true;
  controls.enableZoom      = false;
  controls.enablePan       = false;
  controls.autoRotate      = true;
  controls.autoRotateSpeed = 1.1;

  createMainObject();
  animate();

  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onWindowResize, 100);
  });

  // Distinguish pointer drag vs click (< 6px movement)
  let pointerStart = { x: 0, y: 0 };
  sceneCanvas.addEventListener('pointerdown', (e) => {
    pointerStart = { x: e.clientX, y: e.clientY };
  });
  sceneCanvas.addEventListener('pointerup', (e) => {
    const dist = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
    if (dist < 6) onCanvasClick();
  });
}

function createMainObject() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff3333, emissive: 0xcc0000, emissiveIntensity: 0.85,
    metalness: 0.8, roughness: 0.2, wireframe: true
  });
  mainObject = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), mat);
  scene.add(mainObject);

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1.25,
    metalness: 1.0, roughness: 0.1, wireframe: true
  });
  innerObject = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), innerMat);
  mainObject.add(innerObject);

  // Orbital Cyber Ring
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xff00de, emissive: 0xff00de, emissiveIntensity: 0.9,
    metalness: 0.9, roughness: 0.15, wireframe: true
  });
  outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.02, 8, 60), ringMat);
  outerRing.rotation.x = Math.PI / 3;
  scene.add(outerRing);

  // 3D Floating Cyber Particle Cloud
  const particleCount = 160;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 1.9 + Math.random() * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xff3333,
    size: 0.035,
    transparent: true,
    opacity: 0.75
  });
  particleCloud = new THREE.Points(pGeo, pMat);
  scene.add(particleCloud);
}

function createLinkButtons() {
  if (!linksContainer) return;
  linksContainer.innerHTML = '';
  const bal = State.read('balance');

  LINKS.forEach(link => {
    const a = document.createElement('a');
    a.href      = link.url;
    a.className = 'btn-glitch';
    const label = t(link.name);
    a.setAttribute('data-text', label);

    if (link.showBalance) {
      a.innerHTML = `<span data-i18n="${link.name}">${label}</span> <span class="nav-badge" id="nav-slots-balance">${bal} ₿</span>`;
    } else {
      a.textContent = label;
      a.setAttribute('data-i18n', link.name);
    }

    if (link.url.startsWith('http')) {
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
    }
    if (link.isSpecial) a.classList.add('special');
    a.addEventListener('mouseenter', () => AudioEngine.hover());
    linksContainer.appendChild(a);
  });
}

document.addEventListener('languagechange', () => {
  createLinkButtons();
  applyTranslations();
});

window.addEventListener('bzp:statechange', () => {
  const badge = document.getElementById('nav-slots-balance');
  if (badge) badge.textContent = `${State.read('balance')} ₿`;
});

function animate() {
  requestAnimationFrame(animate);
  if (document.hidden) return;

  if (mainObject)    { mainObject.rotation.x += 0.005; mainObject.rotation.y += 0.008; }
  if (innerObject)   { innerObject.rotation.x -= 0.01; innerObject.rotation.y -= 0.015; }
  if (outerRing)     { outerRing.rotation.z += 0.007; outerRing.rotation.y -= 0.004; }
  if (particleCloud) { particleCloud.rotation.y += 0.002; }

  controls.update();
  TWEEN.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  if (!sceneContainer || !renderer || !camera) return;
  camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
}

function onCanvasClick() {
  secretClickCounter++;
  const totalClicks = (State.read('totalClicks3D') || 0) + 1;
  State.set({ totalClicks3D: totalClicks });

  AudioEngine.cyberPulse(secretClickCounter);

  const filled = Math.min(10, secretClickCounter);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  appendLog(`> CORE_DECRYPTION: [${bar}] ${filled * 10}%`, filled >= 10 ? 'highlight' : 'info');

  const pulse = (obj, intensity) => {
    if (!obj) return;
    new TWEEN.Tween({ v: obj.material.emissiveIntensity })
      .to({ v: intensity }, 110)
      .easing(TWEEN.Easing.Quadratic.Out)
      .yoyo(true).repeat(1)
      .onUpdate(({ v }) => { obj.material.emissiveIntensity = v; })
      .start();
  };
  pulse(mainObject, 2.8);
  pulse(innerObject, 3.5);
  pulse(outerRing, 2.5);

  if (secretClickCounter >= SECRET_CLICK_COUNT) activateSecretProtocol();
}

function activateSecretProtocol() {
  State.set({ secretUnlocked: true });
  State.unlockAchievement('CORE_BREAKER');
  AudioEngine.glitch();
  AudioEngine.win();
  document.body.classList.add('glitch-out');

  const spin = (obj, sign) => {
    if (!obj) return;
    new TWEEN.Tween(obj.rotation)
      .to({ x: obj.rotation.x + sign * Math.PI * 6, y: obj.rotation.y + sign * Math.PI * 6 }, 1500)
      .easing(TWEEN.Easing.Exponential.In).start();
  };
  spin(mainObject,  1);
  spin(innerObject, -1);
  spin(outerRing,    2);
  setTimeout(() => { window.location.href = SECRET_LINK_URL; }, 1500);
}

// --- START ---
init();
runPreloader();
