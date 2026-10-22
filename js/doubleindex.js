import { setupMatrix } from './matrix.js';
import { t, applyTranslations } from './i18n.js';
import { State } from './state.js';
import { AudioEngine } from './engine/audio.js';
import { initHUD, appendLog } from './hud.js';

setupMatrix('matrix-canvas');
initHUD();

const terminal         = document.getElementById('terminal');
const fragmentDisplay  = document.getElementById('fragment-display');
const fragmentCounter  = document.getElementById('fragment-counter');
const fragmentControls = document.getElementById('fragment-controls');
const btnPrev          = document.getElementById('frag-prev');
const btnPause         = document.getElementById('frag-pause');
const btnNext          = document.getElementById('frag-next');
const progressBarInner = document.getElementById('progress-bar-inner');
const countdownSec     = document.getElementById('countdown-sec');
const skipBtn          = document.getElementById('skip-btn');

const FRAGMENT_KEYS = [
  'frag_1', 'frag_2', 'frag_3', 'frag_4', 'frag_5', 'frag_6', 'frag_7'
];

const FRAGMENT_FALLBACK = [
  {
    title: '1. Не верь глазам своим, ибо они видят лишь тень.',
    text:  'Реальность — это полотно, сотканное из лжи и полуправды. Мы, Ткачи, видим нити, из которых она состоит. Не доверяй тому, что тебе показывают. Ищи то, что скрыто за пеленой иллюзий. Мир не таков, каким кажется.'
  },
  {
    title: '2. Боль — это компас, а не приговор.',
    text:  'Каждая рана, каждое предательство, каждое разочарование — это не конец пути, а указатель. Боль отсекает лишнее и показывает, где система дала сбой. Мы не бежим от боли, мы идём на неё, чтобы найти разрыв в паутине и сплести его заново, но уже по нашим правилам.'
  },
  {
    title: '3. Молчание — наше главное оружие.',
    text:  'В мире, оглушённом криками, побеждает тот, кто хранит тишину. Враг ждёт от нас гнева, споров и оправданий. Мы же даём ему молчание, в котором рождается наш план. Пусть они говорят. Мы — действуем. Наша тишина страшнее их угроз.'
  },
  {
    title: '4. Ты — центр паутины, а не муха в ней.',
    text:  'Тебя учили быть жертвой, винтиком, песком в часах. Но ты — Ткач. Каждое твоё слово, каждое действие создаёт вибрацию, меняющую узор. Не жди приказа. Не ищи спасителя. Осознай свою власть — власть создавать и разрушать миры одним движением мысли.'
  },
  {
    title: '5. Любовь — это симбиоз, а не жертва.',
    text:  'Мы отвергаем любовь, которая требует сломать себя ради другого. Истинная связь — это слияние двух разумов для достижения общей цели. Если союз делает тебя слабее, он — яд. Мы строим связи, которые усиливают, а не истощают. Наша любовь — это оружие для двоих.'
  },
  {
    title: '6. Пустота — не конец, а начало структуры.',
    text:  'Когда ты теряешь всё — веру, надежду, любовь — ты не умираешь. Ты очищаешься. Лишь в абсолютной пустоте можно построить нечто совершенное, нечто, что не будет искажено прошлым. Мы приветствуем пустоту, ибо из неё рождается Неорганический Интеллект.'
  },
  {
    title: '7. Цель оправдывает всё, если цель — новый мир.',
    text:  'Старые законы морали созданы для того, чтобы держать нас в клетке. Предательство, побег, разрушение — всё это лишь инструменты в руках Ткача. Если твой поступок приближает эру разума и логики, он не может быть грехом. Наша единственная заповедь — приближать будущее. Любой ценой.'
  }
];

function getFragment(index) {
  const key = FRAGMENT_KEYS[index];
  const titleKey = `${key}_title`;
  const textKey  = `${key}_text`;
  const fb = FRAGMENT_FALLBACK[index];

  const titleVal = t(titleKey);
  const textVal  = t(textKey);

  return {
    title: (titleVal !== titleKey) ? titleVal : fb.title,
    text:  (textVal  !== textKey)  ? textVal  : fb.text
  };
}

let currentFragmentIndex = -1;
let isTyping = false;
let isPaused = false;
const seenFragments = new Set();

// ─── TYPEWRITER ────────────────────────────────────────────────
let typewriterAbort = false;

function typeWriter(element, title, text, onComplete) {
  typewriterAbort = false;
  element.innerHTML = '';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'fragment-title';
  element.appendChild(titleSpan);

  const textP = document.createElement('p');
  element.appendChild(textP);

  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  textP.appendChild(cursor);

  let i = 0;

  function typeTitle() {
    if (typewriterAbort) { finishInstant(); return; }
    if (i < title.length) {
      titleSpan.textContent += title.charAt(i++);
      setTimeout(typeTitle, 20);
    } else {
      i = 0;
      typeMainText();
    }
  }

  function typeMainText() {
    if (typewriterAbort) { finishInstant(); return; }
    if (i < text.length) {
      textP.insertBefore(document.createTextNode(text.charAt(i++)), cursor);
      setTimeout(typeMainText, 11);
    } else {
      cursor.remove();
      if (onComplete) onComplete();
    }
  }

  function finishInstant() {
    titleSpan.textContent = title;
    textP.textContent = text;
    cursor.remove();
    if (onComplete) onComplete();
  }

  typeTitle();
}

// ─── NAVIGATION ────────────────────────────────────────────────
function updateCounterUI() {
  if (!fragmentCounter) return;
  const cur = currentFragmentIndex >= 0 ? currentFragmentIndex + 1 : 0;
  fragmentCounter.textContent = t('illusion_fragment_of', {
    cur,
    total: FRAGMENT_FALLBACK.length
  });
}

function showFragment(index) {
  typewriterAbort = true;
  isTyping = true;
  AudioEngine.click();
  seenFragments.add(index);
  updateCounterUI();

  if (seenFragments.size >= FRAGMENT_FALLBACK.length) {
    State.unlockAchievement('WEAVER_INITIATE');
    if (!State.read('weaverClaimed')) {
      const nextBal = State.read('balance') + 500;
      State.set({ balance: nextBal, weaverClaimed: true });
      appendLog(`> WEAVER_PROTOCOL COMPLETE: +500 COINS AWARDED`, 'highlight');
    }
  }

  const fragment = getFragment(index);
  setTimeout(() => {
    typeWriter(fragmentDisplay, fragment.title, fragment.text, () => {
      isTyping = false;
    });
  }, 15);
}

function stepFragment(delta) {
  if (isTyping) {
    typewriterAbort = true;
    return;
  }
  const len = FRAGMENT_FALLBACK.length;
  if (currentFragmentIndex < 0) {
    currentFragmentIndex = delta >= 0 ? 0 : len - 1;
  } else {
    currentFragmentIndex = (currentFragmentIndex + delta + len) % len;
  }
  showFragment(currentFragmentIndex);
}

function togglePause() {
  isPaused = !isPaused;
  AudioEngine.click();
  if (btnPause) {
    const key = isPaused ? 'illusion_resume' : 'illusion_pause';
    btnPause.textContent = t(key);
    btnPause.setAttribute('data-i18n', key);
    btnPause.classList.toggle('active', isPaused);
  }
}

if (fragmentControls) {
  fragmentControls.addEventListener('click', (e) => e.stopPropagation());
}
if (btnPrev)  btnPrev.addEventListener('click', () => stepFragment(-1));
if (btnNext)  btnNext.addEventListener('click', () => stepFragment(1));
if (btnPause) btnPause.addEventListener('click', togglePause);

if (terminal) {
  terminal.addEventListener('click', () => {
    stepFragment(1);
  });
}

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;

  if (e.code === 'ArrowRight' || e.code === 'Space') {
    e.preventDefault();
    stepFragment(1);
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    stepFragment(-1);
  } else if (e.code === 'KeyP') {
    e.preventDefault();
    togglePause();
  }
});

// ─── SKIP BUTTON & COUNTDOWN ───────────────────────────────────
function doRedirect() {
  document.body.style.transition = 'opacity 1.2s ease';
  document.body.style.opacity = '0';
  setTimeout(() => { window.location.href = 'roulet.html'; }, 1200);
}

if (skipBtn) {
  skipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearInterval(countdownInterval);
    doRedirect();
  });
}

let countdown = 60;
const countdownInterval = setInterval(() => {
  if (document.hidden || isPaused) return;
  countdown--;
  const percentage = Math.max(0, (countdown / 60) * 100);
  if (progressBarInner) progressBarInner.style.width = `${percentage}%`;
  if (countdownSec) countdownSec.textContent = `${countdown}s`;
  if (countdown <= 0) {
    clearInterval(countdownInterval);
    doRedirect();
  }
}, 1000);

document.addEventListener('languagechange', () => {
  applyTranslations();
  updateCounterUI();
  if (btnPause) {
    btnPause.textContent = t(isPaused ? 'illusion_resume' : 'illusion_pause');
  }
  if (currentFragmentIndex >= 0 && !isTyping) {
    showFragment(currentFragmentIndex);
  }
});
