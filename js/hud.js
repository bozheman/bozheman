/**
 * BOZHEMAN ≡ PROTOCOL — Unified HUD, Interactive CLI Terminal & Achievement System v3.0
 * Shared across all 6 pages:
 *  - Persistent CRT toggle (hotkey: C)
 *  - Persistent Sound & Ambient Audio toggle (hotkey: M)
 *  - Interactive Cyberpunk Terminal CLI (hotkey: ` or ~)
 *  - Achievement Toast notifications
 */

import { State, ACHIEVEMENTS_CATALOG } from './state.js';
import { t, getCurrentLang, setLanguage } from './i18n.js';
import { AudioEngine } from './engine/audio.js';

const CLI_COMMANDS = [
  'help', 'status', 'home', 'games', 'slots', 'support',
  'manual', 'illusion', 'balance', 'stats', 'achievements',
  'hack', 'crt', 'sound', 'matrix', 'lang', 'export', 'clear'
];

export function appendLog(text, type = 'sys') {
  if (typeof window.bzpTerminalLog === 'function') {
    window.bzpTerminalLog(text, type);
  }
}

export function initHUD() {
  const hud = document.getElementById('hud-controls');
  let crtOverlay = document.getElementById('crt-overlay');
  if (!crtOverlay) {
    crtOverlay = document.createElement('div');
    crtOverlay.id = 'crt-overlay';
    crtOverlay.className = 'crt-overlay';
    document.body.appendChild(crtOverlay);
  }

  // Ensure HUD container exists on every page
  let hudContainer = hud;
  if (!hudContainer) {
    hudContainer = document.createElement('div');
    hudContainer.id = 'hud-controls';
    const existingLang = document.getElementById('lang-select');
    if (existingLang) hudContainer.appendChild(existingLang);
    document.body.appendChild(hudContainer);
  }

  // Ensure CRT toggle button exists
  let crtToggle = document.getElementById('crt-toggle');
  if (!crtToggle) {
    crtToggle = document.createElement('button');
    crtToggle.id = 'crt-toggle';
    crtToggle.className = 'hud-btn';
    crtToggle.setAttribute('aria-label', 'Toggle CRT');
    hudContainer.appendChild(crtToggle);
  }

  // Ensure Sound toggle button exists
  let soundToggle = document.getElementById('sound-toggle');
  if (!soundToggle) {
    soundToggle = document.createElement('button');
    soundToggle.id = 'sound-toggle';
    soundToggle.className = 'hud-btn sound-toggle';
    soundToggle.setAttribute('aria-label', 'Toggle sound');
    soundToggle.innerHTML = `
      <span data-i18n="sound_off">SOUND: OFF</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="sound-icon" aria-hidden="true">
        <path class="sound-on-icon" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        <path class="sound-off-icon" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      </svg>
    `;
    hudContainer.appendChild(soundToggle);
  }

  // Ensure Terminal toggle button exists in HUD
  let termToggle = document.getElementById('term-toggle');
  if (!termToggle) {
    termToggle = document.createElement('button');
    termToggle.id = 'term-toggle';
    termToggle.className = 'hud-btn term-toggle-btn';
    termToggle.setAttribute('data-i18n', 'term_toggle');
    termToggle.setAttribute('aria-label', 'Toggle Interactive Terminal');
    termToggle.textContent = t('term_toggle');
    hudContainer.appendChild(termToggle);
  }

  const ambientAudio = document.getElementById('ambient-audio');
  let wasPlayingOnHide = false;

  function syncCRT() {
    const enabled = State.read('crtEnabled') !== false;
    if (crtOverlay) crtOverlay.style.display = enabled ? 'block' : 'none';
    if (crtToggle) {
      const key = enabled ? 'crt_on' : 'crt_off';
      crtToggle.textContent = t(key);
      crtToggle.setAttribute('data-i18n', key);
      crtToggle.classList.toggle('active-hud', enabled);
    }
  }

  function syncSound(tryPlayAmbient = false) {
    const muted = State.read('audioMuted') !== false;
    const labelSpan = soundToggle ? soundToggle.querySelector('span') : null;
    if (soundToggle) {
      soundToggle.classList.toggle('muted', muted);
      soundToggle.classList.toggle('active-hud', !muted);
    }
    if (labelSpan) {
      const key = muted ? 'sound_off' : 'sound_on';
      labelSpan.setAttribute('data-i18n', key);
      labelSpan.textContent = t(key);
    }
    if (ambientAudio) {
      if (muted) {
        ambientAudio.pause();
      } else if (tryPlayAmbient && ambientAudio.paused) {
        ambientAudio.volume = 0.45;
        ambientAudio.play().catch(() => {});
      }
    }
  }

  function toggleCRT() {
    const next = !(State.read('crtEnabled') !== false);
    State.set({ crtEnabled: next });
    syncCRT();
    AudioEngine.click();
  }

  function toggleSound() {
    const nextMuted = !(State.read('audioMuted') !== false);
    State.set({ audioMuted: nextMuted });
    syncSound(true);
    if (!nextMuted) AudioEngine.click();
  }

  // Remove duplicate inline listeners by cloning if needed, or bind once
  if (!crtToggle.dataset.hudBound) {
    crtToggle.dataset.hudBound = '1';
    crtToggle.addEventListener('click', toggleCRT);
  }
  if (!soundToggle.dataset.hudBound) {
    soundToggle.dataset.hudBound = '1';
    soundToggle.addEventListener('click', toggleSound);
  }

  document.addEventListener('visibilitychange', () => {
    if (!ambientAudio) return;
    if (document.hidden) {
      if (!ambientAudio.paused) {
        ambientAudio.pause();
        wasPlayingOnHide = true;
      }
    } else if (wasPlayingOnHide && !State.read('audioMuted')) {
      ambientAudio.play().catch(() => {});
      wasPlayingOnHide = false;
    }
  });

  // Auto-resume ambient audio on first user interaction if sound is unmuted
  document.addEventListener('pointerdown', () => {
    if (!State.read('audioMuted') && ambientAudio && ambientAudio.paused) {
      ambientAudio.volume = 0.45;
      ambientAudio.play().catch(() => {});
    }
  }, { once: true, passive: true });

  // Build Interactive Terminal Widget
  setupInteractiveTerminal(termToggle, { toggleCRT, toggleSound });

  // Setup Achievement Toast Listener
  window.addEventListener('bzp:achievement', (e) => {
    if (e.detail) showAchievementToast(e.detail);
  });

  // Sync on language or state change
  document.addEventListener('languagechange', () => {
    syncCRT();
    syncSound(false);
    if (termToggle) termToggle.textContent = t('term_toggle');
  });

  window.addEventListener('bzp:statechange', () => {
    syncCRT();
    syncSound(false);
  });

  syncCRT();
  syncSound(false);

  // Unlock FIRST_CONTACT achievement on first session
  setTimeout(() => {
    State.unlockAchievement('FIRST_CONTACT');
  }, 1200);
}

function showAchievementToast(ach) {
  AudioEngine.achievement();
  const existing = document.getElementById('bzp-ach-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'bzp-ach-toast';
  toast.className = 'ach-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const iconDiv = document.createElement('div');
  iconDiv.className = 'ach-toast-icon';
  iconDiv.textContent = ach.icon || '⚡';

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'ach-toast-body';

  const labelDiv = document.createElement('div');
  labelDiv.className = 'ach-toast-label';
  labelDiv.textContent = t('ach_unlocked');

  const titleDiv = document.createElement('div');
  titleDiv.className = 'ach-toast-title';
  titleDiv.textContent = t(ach.titleKey);

  const descDiv = document.createElement('div');
  descDiv.className = 'ach-toast-desc';
  descDiv.textContent = t(ach.descKey);

  bodyDiv.appendChild(labelDiv);
  bodyDiv.appendChild(titleDiv);
  bodyDiv.appendChild(descDiv);
  toast.appendChild(iconDiv);
  toast.appendChild(bodyDiv);
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

function setupInteractiveTerminal(termToggleBtn, controls) {
  let widget = document.getElementById('terminal-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'terminal-widget';
    document.body.appendChild(widget);
  }

  widget.removeAttribute('aria-hidden');
  widget.className = 'cyber-terminal';
  widget.innerHTML = `
    <div class="cyber-term-header" id="cyber-term-header">
      <span class="cyber-term-title">BOZHEMAN ≡ CLI v7.0</span>
      <div class="cyber-term-actions">
        <span class="cyber-term-ping" id="cyber-term-ping">12ms</span>
        <button type="button" class="cyber-term-expand" id="cyber-term-close" aria-label="Toggle console">[×]</button>
      </div>
    </div>
    <div class="cyber-term-logs" id="cyber-term-logs"></div>
    <form class="cyber-term-form" id="cyber-term-form" autocomplete="off">
      <span class="cyber-term-prompt">&gt;_</span>
      <input type="text" id="cyber-term-input" class="cyber-term-input" placeholder="${t('term_placeholder')}" aria-label="Protocol CLI command input" />
    </form>
  `;

  const logsEl  = document.getElementById('cyber-term-logs');
  const formEl  = document.getElementById('cyber-term-form');
  const inputEl = document.getElementById('cyber-term-input');
  const closeEl = document.getElementById('cyber-term-close');
  const headerEl = document.getElementById('cyber-term-header');
  const pingEl  = document.getElementById('cyber-term-ping');

  const cmdHistory = [];
  let historyIdx = -1;
  let isExpanded = false;

  function appendLog(text, type = 'sys') {
    if (!logsEl) return;
    const line = document.createElement('div');
    line.className = `cyber-log-line log-${type}`;
    line.textContent = text;
    logsEl.appendChild(line);
    const maxLines = isExpanded ? 60 : 6;
    while (logsEl.children.length > maxLines) {
      logsEl.removeChild(logsEl.firstChild);
    }
    logsEl.scrollTop = logsEl.scrollHeight;
  }

  window.bzpTerminalLog = appendLog;

  function setExpanded(next) {
    isExpanded = Boolean(next);
    widget.classList.toggle('expanded', isExpanded);
    if (termToggleBtn) termToggleBtn.classList.toggle('active-hud', isExpanded);
    AudioEngine.click();
    if (isExpanded && inputEl) {
      setTimeout(() => inputEl.focus(), 50);
    }
  }

  if (termToggleBtn) {
    termToggleBtn.addEventListener('click', () => setExpanded(!isExpanded));
  }
  if (closeEl) {
    closeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      setExpanded(!isExpanded);
    });
  }
  if (headerEl) {
    headerEl.addEventListener('click', () => {
      if (!isExpanded) setExpanded(true);
    });
  }

  // Ambient live telemetry logs when idle
  const AMBIENT_LOGS = [
    () => `> INIT_CONNECTION... [OK]`,
    () => `> NODE_BALANCE: ${State.read('balance')} COINS`,
    () => `> BYPASSING_ICE... [SECURE]`,
    () => `> SLOTS_SPINS: ${State.get().rouletteStats.spins} | WINRATE: ${State.getWinRate()}%`,
    () => `> PROTOCOL_BOZHEMAN: v7.0 ACTIVE`,
    () => `> TYPE 'help' OR PRESS [~] FOR CLI`,
  ];
  let ambIdx = 0;
  appendLog('> BOZHEMAN ≡ PROTOCOL CLI READY. Type "help".', 'highlight');

  setInterval(() => {
    if (document.hidden || isExpanded) return;
    const fn = AMBIENT_LOGS[ambIdx % AMBIENT_LOGS.length];
    appendLog(fn(), 'sys');
    if (pingEl) pingEl.textContent = `${8 + Math.floor(Math.random() * 14)}ms`;
    ambIdx++;
  }, 3200);

  if (formEl && inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      AudioEngine.terminalKey();
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdHistory.length > 0 && historyIdx < cmdHistory.length - 1) {
          historyIdx++;
          inputEl.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx > 0) {
          historyIdx--;
          inputEl.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
        } else {
          historyIdx = -1;
          inputEl.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const cur = inputEl.value.trim().toLowerCase();
        if (!cur) return;
        const match = CLI_COMMANDS.find(c => c.startsWith(cur));
        if (match) inputEl.value = match + ' ';
      } else if (e.key === 'Escape') {
        setExpanded(false);
      }
    });

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = inputEl.value.trim();
      if (!raw) return;
      inputEl.value = '';
      cmdHistory.push(raw);
      historyIdx = -1;
      appendLog(`>_ ${raw}`, 'cmd');
      executeCommand(raw, appendLog, controls);
    });
  }

  // Global keyboard shortcuts (when not focused in an input)
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

    if (e.key === '`' || e.key === '~' || e.code === 'Backquote') {
      if (!inInput || document.activeElement === inputEl) {
        e.preventDefault();
        setExpanded(!isExpanded);
      }
      return;
    }

    if (inInput) return;

    if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      controls.toggleSound();
    } else if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      controls.toggleCRT();
    }
  });
}

function executeCommand(raw, log, controls) {
  const parts = raw.trim().split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const arg   = (parts[1] || '').toLowerCase();

  switch (cmd) {
    case 'help':
    case '?':
      log('=== BOZHEMAN ≡ CLI COMMANDS ===', 'highlight');
      log('  status       - System & player telemetry', 'info');
      log('  home / games - Navigate to Main / Games Hub', 'info');
      log('  slots        - Launch BOZHEMAN SLOTS 777', 'info');
      log('  support      - Open Crypto & Partner Gateways', 'info');
      log('  manual       - Open GrowerSim Full Manual', 'info');
      log('  illusion     - Enter Secret Weaver Protocol', 'info');
      log('  stats        - Detailed Slots 777 analytics', 'info');
      log('  achievements - List protocol achievements', 'info');
      log('  hack         - Breach ICE firewall (+250 coins)', 'info');
      log('  matrix <spd> - Set rain speed: slow|normal|fast', 'info');
      log('  crt / sound  - Toggle CRT filter or Audio', 'info');
      log('  export       - Export profile state token', 'info');
      log('  clear        - Clear terminal output', 'info');
      break;

    case 'status': {
      const s = State.get();
      log(`> PROTOCOL: v7.0 ONLINE | LANG: ${getCurrentLang().toUpperCase()}`, 'highlight');
      log(`> BALANCE: ${s.balance} COINS | ACHIEVEMENTS: ${s.achievements.length}/${Object.keys(ACHIEVEMENTS_CATALOG).length}`, 'info');
      log(`> SPINS: ${s.rouletteStats.spins} | WINRATE: ${State.getWinRate()}% | PROFIT: ${State.getNetProfit()}`, 'info');
      log(`> CRT: ${s.crtEnabled ? 'ON' : 'OFF'} | AUDIO: ${s.audioMuted ? 'MUTED' : 'ACTIVE'} | MATRIX: ${s.matrixSpeed.toUpperCase()}`, 'info');
      break;
    }

    case 'balance':
      log(`> CURRENT BALANCE: ${State.read('balance')} COINS`, 'highlight');
      break;

    case 'stats': {
      const st = State.get().rouletteStats;
      log('=== SLOTS 777 TELEMETRY ===', 'highlight');
      log(`  Total Spins  : ${st.spins} (Wins: ${st.wins} | ${State.getWinRate()}%)`, 'info');
      log(`  Total Wagered: ${st.totalWagered} | Total Won: ${st.totalWon}`, 'info');
      log(`  Net Profit   : ${State.getNetProfit()} | Max Win: ${st.maxWin}`, 'info');
      log(`  Current Strk : ${st.currentStreak} | Best Streak: ${st.bestStreak}`, 'info');
      break;
    }

    case 'achievements':
    case 'ach': {
      const unlocked = State.get().achievements;
      log(`=== ACHIEVEMENTS (${unlocked.length}/${Object.keys(ACHIEVEMENTS_CATALOG).length}) ===`, 'highlight');
      Object.values(ACHIEVEMENTS_CATALOG).forEach(a => {
        const done = unlocked.includes(a.id);
        log(`  ${done ? '[✓]' : '[ ]'} ${a.icon} ${t(a.titleKey)} — ${t(a.descKey)}`, done ? 'highlight' : 'sys');
      });
      break;
    }

    case 'hack': {
      if (State.read('hackClaimed')) {
        log('> ICE_FIREWALL: Already breached in this profile.', 'err');
        AudioEngine.error();
        break;
      }
      log('> INJECTING PAYLOAD INTO SECTOR_0ZERO...', 'info');
      AudioEngine.glitch();
      setTimeout(() => log('> BYPASSING QUANTUM HASH [██████████] 100%', 'info'), 350);
      setTimeout(() => {
        const nextBal = State.read('balance') + 250;
        State.set({ balance: nextBal, hackClaimed: true });
        State.unlockAchievement('ICE_HACKER');
        log(`> ACCESS GRANTED! +250 COINS TRANSFERRED (BALANCE: ${nextBal})`, 'highlight');
      }, 750);
      break;
    }

    case 'home':
    case 'index':
      log('> NAVIGATING TO MAIN PROTOCOL...', 'highlight');
      setTimeout(() => { window.location.href = 'index.html'; }, 250);
      break;

    case 'games':
      log('> NAVIGATING TO GAMES HUB...', 'highlight');
      setTimeout(() => { window.location.href = 'games.html'; }, 250);
      break;

    case 'slots':
    case '777':
    case 'roulette':
      log('> LAUNCHING BOZHEMAN SLOTS 777...', 'highlight');
      setTimeout(() => { window.location.href = 'roulet.html'; }, 250);
      break;

    case 'support':
    case 'refer':
    case 'crypto':
      log('> OPENING CRYPTO & PARTNER GATEWAYS...', 'highlight');
      setTimeout(() => { window.location.href = 'refer.html'; }, 250);
      break;

    case 'manual':
      log('> OPENING GROWERSIM SYSTEM MANUAL...', 'highlight');
      setTimeout(() => { window.location.href = 'grower_manual.html'; }, 250);
      break;

    case 'illusion':
    case 'secret':
      State.set({ secretUnlocked: true });
      State.unlockAchievement('CORE_BREAKER');
      log('> ENTERING SECRET WEAVER PROTOCOL...', 'highlight');
      setTimeout(() => { window.location.href = 'doubleindex.html'; }, 250);
      break;

    case 'crt':
      controls.toggleCRT();
      log(`> CRT OVERLAY: ${State.read('crtEnabled') ? 'ENABLED' : 'DISABLED'}`, 'info');
      break;

    case 'sound':
    case 'audio':
      controls.toggleSound();
      log(`> AUDIO ENGINE: ${State.read('audioMuted') ? 'MUTED' : 'ACTIVE'}`, 'info');
      break;

    case 'matrix':
      if (['slow', 'normal', 'fast'].includes(arg)) {
        State.set({ matrixSpeed: arg });
        log(`> MATRIX SPEED SET TO: ${arg.toUpperCase()}`, 'highlight');
      } else {
        log('> Usage: matrix slow | normal | fast', 'err');
      }
      break;

    case 'lang':
      if (arg) {
        setLanguage(arg);
        log(`> LANGUAGE UPDATED: ${arg.toUpperCase()}`, 'highlight');
      } else {
        log('> Usage: lang ru|en|uk|be|pl|de|fr|es', 'info');
      }
      break;

    case 'export':
      log(`> PROFILE TOKEN: ${State.exportData()}`, 'highlight');
      break;

    case 'clear':
    case 'cls': {
      const logsEl = document.getElementById('cyber-term-logs');
      if (logsEl) logsEl.innerHTML = '';
      break;
    }

    default:
      log(`> UNKNOWN COMMAND: "${cmd}". Type "help" for available commands.`, 'err');
      AudioEngine.error();
      break;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHUD);
} else {
  initHUD();
}
