import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { setupMatrix } from './matrix.js';

// --- НАСТРОЙКИ ---
const PRELOADER_LINES = [
  { text: '> INIT_CONNECTION...', delay: 80 },
  { text: '> AUTH_USER_IDENTITY... [ACCEPTED]', delay: 50 },
  { text: '> LOADING_PROTOCOL_0ZERO...', delay: 80 },
  { text: '> ACCESS GRANTED', delay: 50 }
];

const LINKS = [
  { name: 'Twitch', url: 'https://www.twitch.tv/Bozhemany' },
  { name: 'Instagram', url: 'https://www.instagram.com/bozheman' },
  { name: 'YouTube', url: 'https://www.youtube.com/channel/UC_BgtvZc1dxQbJA1uEeFimw' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@bozheman_' },
  { name: '🎮 GAMES', url: 'games.html' },
  { name: '💰 DONATION', url: 'https://donatello.to/bozheman', isSpecial: true },
];

const SECRET_CLICK_COUNT = 10;
const SECRET_LINK_URL = 'doubleindex.html';

const preloader = document.getElementById('preloader');
const preloaderText = document.getElementById('preloader-text');
const sceneContainer = document.getElementById('scene-container');
const sceneCanvas = document.getElementById('scene-canvas');
const soundToggle = document.getElementById('sound-toggle');
const ambientAudio = document.getElementById('ambient-audio');
const glitchAudio = document.getElementById('glitch-audio');
const linksContainer = document.getElementById('links-container');

let scene, camera, renderer, controls;
let mainObject;
let secretClickCounter = 0;

// Установка громкости 50% и начального состояния
if (ambientAudio) {
  ambientAudio.volume = 0.5;
  ambientAudio.pause(); // выключено по дефолту
}
if (glitchAudio) {
  glitchAudio.volume = 0.5;
}
if (soundToggle) {
  soundToggle.classList.add('muted');
}

init();
runPreloader();

async function runPreloader() {
  for (const line of PRELOADER_LINES) {
    await typeLine(line.text, 50);
    await new Promise(resolve => setTimeout(resolve, line.delay));
  }
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.style.display = 'none', 1000);
  }
}

function typeLine(text, speed) {
  return new Promise(resolve => {
    let i = 0;
    if (!preloaderText) return resolve();
    preloaderText.innerHTML = '';
    const typing = setInterval(() => {
      if (i < text.length) {
        preloaderText.innerHTML += text.charAt(i);
        i++;
      } else {
        clearInterval(typing);
        resolve();
      }
    }, speed);
  });
}

function init() {
  if (!sceneContainer || !sceneCanvas) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
  camera.position.z = 3.5;
  
  renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true, alpha: true });
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xff0000, 150, 100);
  scene.add(pointLight);
  
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  
  createMainObject();
  createLinkButtons();
  setupMatrix('matrix-canvas');
  animate();
  
  window.addEventListener('resize', onWindowResize);
  sceneCanvas.addEventListener('click', onCanvasClick);
  if (soundToggle) soundToggle.addEventListener('click', toggleSound);
}

function createMainObject() {
  const geometry = new THREE.IcosahedronGeometry(1.2, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    emissive: 0xcc0000,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2,
    wireframe: true
  });
  mainObject = new THREE.Mesh(geometry, material);
  scene.add(mainObject);
}

function createLinkButtons() {
    if (!linksContainer) return;
    linksContainer.innerHTML = '';
    LINKS.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'btn-glitch';
        a.textContent = link.name;
        a.setAttribute('data-text', link.name);
        if (link.url.startsWith('http')) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
        if(link.isSpecial) {
            a.classList.add('special');
        }
        linksContainer.appendChild(a);
    });
}

function animate() {
  requestAnimationFrame(animate);
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
    
    const originalIntensity = mainObject.material.emissiveIntensity;
    new TWEEN.Tween({ intensity: originalIntensity })
        .to({ intensity: 2.0 }, 100)
        .easing(TWEEN.Easing.Quadratic.Out)
        .yoyo(true)
        .repeat(1)
        .onUpdate((obj) => { mainObject.material.emissiveIntensity = obj.intensity; })
        .start();

    if (secretClickCounter >= SECRET_CLICK_COUNT) {
        activateSecretProtocol();
    }
}

function activateSecretProtocol() {
    console.log("SECRET PROTOCOL ACTIVATED!");
    if (glitchAudio) {
        if(!glitchAudio.paused) {
            glitchAudio.currentTime = 0;
        } else {
            glitchAudio.play().catch(e => console.warn(e));
        }
    }
    document.body.classList.add('glitch-out');
    setTimeout(() => {
        window.location.href = SECRET_LINK_URL;
    }, 1500);
}

function toggleSound() {
    if (!ambientAudio) return;
    if (ambientAudio.paused) {
        ambientAudio.play().catch(e => console.error("Audio play failed:", e));
        soundToggle.classList.remove('muted');
        soundToggle.childNodes[0].nodeValue = 'SOUND: ON ';
    } else {
        ambientAudio.pause();
        soundToggle.classList.add('muted');
        soundToggle.childNodes[0].nodeValue = 'SOUND: OFF ';
    }
}
