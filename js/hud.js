/**
 * BOZHEMAN ≡ PROTOCOL — Unified HUD, Top Telemetry Bar, Interactive CLI & Achievements v4.0
 * Shared across all 6 pages:
 *  - Top Protocol Telemetry Bar (Node status, Grower ID, Live Balance, @GrowerSim_bot direct link)
 *  - Persistent CRT toggle (hotkey: C)
 *  - Persistent Sound & Ambient Audio toggle (hotkey: M)
 *  - Interactive Cyberpunk Terminal CLI with Quick-Chips & 100% 8-language i18n (hotkey: ` or ~)
 *  - Protocol Achievements Modal & Toast notifications
 */

import { State, ACHIEVEMENTS_CATALOG } from './state.js';
import { t, getCurrentLang, setLanguage } from './i18n.js';
import { AudioEngine } from './engine/audio.js';

const CLI_COMMANDS = [
  'help', 'status', 'bot', 'grower', 'home', 'games', 'slots', 'support',
  'manual', 'illusion', 'balance', 'stats', 'achievements', 'ach',
  'hack', 'crt', 'sound', 'matrix', 'lang', 'export', 'import', 'reset', 'clear'
];

export function appendLog(text, type = 'sys') {
  if (typeof window.bzpTerminalLog === 'function') {
    window.bzpTerminalLog(text, type);
  }
}

export function initHUD() {
  if (document.body.dataset.hudInitialized === '1') return;
  document.body.dataset.hudInitialized = '1';

  // 1. Ensure CRT overlay exists
  let crtOverlay = document.getElementById('crt-overlay');
  if (!crtOverlay) {
    crtOverlay = document.createElement('div');
    crtOverlay.id = 'crt-overlay';
    crtOverlay.className = 'crt-overlay';
    document.body.appendChild(crtOverlay);
  }

  // 2. Ensure Top Protocol Telemetry Bar exists
  setupTopTelemetryBar();

  // 3. Ensure HUD container exists
  let hudContainer = document.getElementById('hud-controls');
  if (!hudContainer) {
    hudContainer = document.createElement('div');
    hudContainer.id = 'hud-controls';
    const existingLang = document.getElementById('lang-select');
    if (existingLang) hudContainer.appendChild(existingLang);
    document.body.appendChild(hudContainer);
  }

  // Upgrade language select labels with protocol codes
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    const langLabels = {
      ru: '[RU] Русский',
      en: '[EN] English',
      uk: '[UK] Українська',
      be: '[BE] Беларуская',
      pl: '[PL] Polski',
      de: '[DE] Deutsch',
      fr: '[FR] Français',
      es: '[ES] Español'
    };
    Array.from(langSelect.options).forEach(opt => {
      if (langLabels[opt.value]) opt.textContent = langLabels[opt.value];
    });
    langSelect.addEventListener('change', () => AudioEngine.click());
  }

  // Ensure CRT toggle button exists
  let crtToggle = document.getElementById('crt-toggle');
  if (!crtToggle) {
    crtToggle = document.createElement('button');
    crtToggle.id = 'crt-toggle';
    crtToggle.className = 'hud-btn';
    hudContainer.appendChild(crtToggle);
  }

  // Ensure Sound toggle button exists
  let soundToggle = document.getElementById('sound-toggle');
  if (!soundToggle) {
    soundToggle = document.createElement('button');
    soundToggle.id = 'sound-toggle';
    soundToggle.className = 'hud-btn sound-toggle';
    soundToggle.innerHTML = `
      <span data-i18n="sound_off">SOUND: OFF</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="sound-icon" aria-hidden="true">
        <path class="sound-on-icon" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        <path class="sound-off-icon" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      </svg>
    `;
    hudContainer.appendChild(soundToggle);
  }

  // Ensure Achievements HUD button exists
  let achToggle = document.getElementById('ach-toggle');
  if (!achToggle) {
    achToggle = document.createElement('button');
    achToggle.id = 'ach-toggle';
    achToggle.className = 'hud-btn ach-toggle-btn';
    hudContainer.appendChild(achToggle);
  }

  // Ensure Terminal toggle button exists in HUD
  let termToggle = document.getElementById('term-toggle');
  if (!termToggle) {
    termToggle = document.createElement('button');
    termToggle.id = 'term-toggle';
    termToggle.className = 'hud-btn term-toggle-btn';
    termToggle.setAttribute('data-i18n', 'term_toggle');
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
      crtToggle.setAttribute('aria-pressed', String(enabled));
      crtToggle.classList.toggle('active-hud', enabled);
    }
  }

  function syncSound(tryPlayAmbient = false) {
    const muted = State.read('audioMuted') !== false;
    const labelSpan = soundToggle ? soundToggle.querySelector('span') : null;
    if (soundToggle) {
      soundToggle.classList.toggle('muted', muted);
      soundToggle.classList.toggle('active-hud', !muted);
      soundToggle.setAttribute('aria-pressed', String(!muted));
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

  function syncAchButton() {
    if (!achToggle) return;
    const unlockedCount = (State.read('achievements') || []).length;
    const totalCount = Object.keys(ACHIEVEMENTS_CATALOG).length;
    achToggle.textContent = `${t('ach_btn_label')} [${unlockedCount}/${totalCount}]`;
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

  if (!crtToggle.dataset.hudBound) {
    crtToggle.dataset.hudBound = '1';
    crtToggle.addEventListener('click', toggleCRT);
  }
  if (!soundToggle.dataset.hudBound) {
    soundToggle.dataset.hudBound = '1';
    soundToggle.addEventListener('click', toggleSound);
  }
  if (!achToggle.dataset.hudBound) {
    achToggle.dataset.hudBound = '1';
    achToggle.addEventListener('click', () => {
      AudioEngine.modalOpen();
      openAchievementsModal();
    });
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
    syncAchButton();
    if (e.detail) showAchievementToast(e.detail);
  });

  document.addEventListener('languagechange', () => {
    syncCRT();
    syncSound(false);
    syncAchButton();
    syncTopTelemetryBar();
    if (termToggle) termToggle.textContent = t('term_toggle');
  });

  window.addEventListener('bzp:statechange', () => {
    syncCRT();
    syncSound(false);
    syncAchButton();
    syncTopTelemetryBar();
  });

  syncCRT();
  syncSound(false);
  syncAchButton();
  syncTopTelemetryBar();

  setTimeout(() => {
    State.unlockAchievement('FIRST_CONTACT');
  }, 1000);
}

function setupTopTelemetryBar() {
  if (document.getElementById('protocol-top-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'protocol-top-bar';
  bar.className = 'protocol-top-bar';
  bar.innerHTML = `
    <div class="top-bar-inner">
      <div class="top-bar-left">
        <span class="top-dot"></span>
        <span class="top-node-text" data-i18n="top_node_online">${t('top_node_online')}</span>
        <span class="top-sep">|</span>
        <span class="top-id-text" id="top-grower-id">${State.read('growerId')}</span>
      </div>
      <div class="top-bar-right">
        <a href="roulet.html" class="top-bal-chip" id="top-bal-link">
          <span data-i18n="top_balance">${t('top_balance')}</span>:
          <strong id="top-bal-val">${State.read('balance')} ₿</strong>
        </a>
        <a href="https://t.me/GrowerSim_bot" target="_blank" rel="noopener noreferrer" class="top-bot-chip">
          <span data-i18n="top_bot_link">🌱 @GrowerSim_bot</span>
        </a>
      </div>
    </div>
  `;
  document.body.prepend(bar);
}

function syncTopTelemetryBar() {
  const idEl  = document.getElementById('top-grower-id');
  const balEl = document.getElementById('top-bal-val');
  if (idEl)  idEl.textContent  = State.read('growerId');
  if (balEl) balEl.textContent = `${State.read('balance')} ₿`;
}

function openAchievementsModal() {
  let modal = document.getElementById('bzp-ach-modal');
  if (modal) modal.remove();

  const unlocked = State.read('achievements') || [];
  const total = Object.keys(ACHIEVEMENTS_CATALOG).length;

  modal = document.createElement('div');
  modal.id = 'bzp-ach-modal';
  modal.className = 'modal-overlay active';
  modal.style.opacity = '1';
  modal.style.pointerEvents = 'all';

  const itemsHtml = Object.values(ACHIEVEMENTS_CATALOG).map(ach => {
    const done = unlocked.includes(ach.id);
    return `
      <div class="ach-card-item ${done ? 'ach-done' : 'ach-locked'}">
        <div class="ach-card-icon">${ach.icon}</div>
        <div class="ach-card-info">
          <div class="ach-card-title">${t(ach.titleKey)} ${done ? '<span class="ach-check">✓</span>' : ''}</div>
          <div class="ach-card-desc">${t(ach.descKey)}</div>
        </div>
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="ach-modal-box">
      <div class="ach-modal-header">
        <span>🏆 ${t('ach_modal_title')} [${unlocked.length}/${total}]</span>
        <button type="button" class="ach-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="ach-modal-grid">${itemsHtml}</div>
      <div class="ach-modal-footer">
        <button type="button" class="btn-glitch ach-close-btn">${t('close_manual')}</button>
      </div>
    </div>
  `;

  const closeFn = () => {
    AudioEngine.modalClose();
    modal.remove();
  };

  modal.querySelector('.ach-modal-close').addEventListener('click', closeFn);
  modal.querySelector('.ach-close-btn').addEventListener('click', closeFn);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeFn();
  });

  document.body.appendChild(modal);
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
        <span class="cyber-term-ping" id="cyber-term-ping">60 FPS • 11ms</span>
        <button type="button" class="cyber-term-expand" id="cyber-term-close" aria-label="Toggle console">[×]</button>
      </div>
    </div>
    <div class="cyber-term-logs" id="cyber-term-logs"></div>
    <div class="cyber-term-chips" id="cyber-term-chips">
      <button type="button" class="term-chip" data-cmd="help">help</button>
      <button type="button" class="term-chip" data-cmd="status">status</button>
      <button type="button" class="term-chip" data-cmd="bot">@GrowerSim_bot</button>
      <button type="button" class="term-chip" data-cmd="hack">hack +250</button>
      <button type="button" class="term-chip" data-cmd="slots">slots 777</button>
      <button type="button" class="term-chip" data-cmd="ach">ach</button>
      <button type="button" class="term-chip" data-cmd="clear">clear</button>
    </div>
    <form class="cyber-term-form" id="cyber-term-form" autocomplete="off">
      <span class="cyber-term-prompt">&gt;_</span>
      <input type="text" id="cyber-term-input" class="cyber-term-input" data-i18n-attr="placeholder" data-i18n="term_placeholder" placeholder="${t('term_placeholder')}" aria-label="Protocol CLI command input" />
    </form>
    <div class="cyber-term-hint" data-i18n="term_hotkeys_hint">${t('term_hotkeys_hint')}</div>
  `;

  const logsEl   = document.getElementById('cyber-term-logs');
  const formEl   = document.getElementById('cyber-term-form');
  const inputEl  = document.getElementById('cyber-term-input');
  const closeEl  = document.getElementById('cyber-term-close');
  const headerEl = document.getElementById('cyber-term-header');
  const pingEl   = document.getElementById('cyber-term-ping');
  const chipsEl  = document.getElementById('cyber-term-chips');

  const cmdHistory = [];
  let historyIdx = -1;
  let isExpanded = false;

  function localAppendLog(text, type = 'sys') {
    if (!logsEl) return;
    const line = document.createElement('div');
    line.className = `cyber-log-line log-${type}`;
    line.textContent = text;
    logsEl.appendChild(line);
    const maxLines = isExpanded ? 60 : 5;
    while (logsEl.children.length > maxLines) {
      logsEl.removeChild(logsEl.firstChild);
    }
    logsEl.scrollTop = logsEl.scrollHeight;
  }

  window.bzpTerminalLog = localAppendLog;

  function setExpanded(next) {
    isExpanded = Boolean(next);
    widget.classList.toggle('expanded', isExpanded);
    if (termToggleBtn) {
      termToggleBtn.classList.toggle('active-hud', isExpanded);
      termToggleBtn.setAttribute('aria-pressed', String(isExpanded));
    }
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

  if (chipsEl) {
    chipsEl.querySelectorAll('.term-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (!cmd) return;
        AudioEngine.click();
        localAppendLog(`>_ ${cmd}`, 'cmd');
        executeCommand(cmd, localAppendLog, controls);
      });
    });
  }

  const AMBIENT_LOGS = [
    () => t('amb_log_1'),
    () => t('amb_log_2', { bal: State.read('balance') }),
    () => t('amb_log_3'),
    () => t('amb_log_4', { spins: State.get().rouletteStats.spins, winrate: State.getWinRate() }),
    () => t('amb_log_5'),
    () => t('amb_log_6'),
  ];
  let ambIdx = 0;
  localAppendLog(t('term_ready'), 'highlight');

  setInterval(() => {
    if (document.hidden || isExpanded) return;
    const fn = AMBIENT_LOGS[ambIdx % AMBIENT_LOGS.length];
    localAppendLog(fn(), 'sys');
    if (pingEl) pingEl.textContent = `60 FPS • ${8 + Math.floor(Math.random() * 11)}ms`;
    ambIdx++;
  }, 3400);

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
      localAppendLog(`>_ ${raw}`, 'cmd');
      executeCommand(raw, localAppendLog, controls);
    });
  }

  // Global keyboard shortcuts
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
  const arg   = (parts[1] || '');

  switch (cmd) {
    case 'help':
    case '?':
      log(t('cli_help_header'), 'highlight');
      log(t('cli_help_status'), 'info');
      log(t('cli_help_bot'), 'info');
      log(t('cli_help_nav'), 'info');
      log(t('cli_help_slots'), 'info');
      log(t('cli_help_support'), 'info');
      log(t('cli_help_manual'), 'info');
      log(t('cli_help_illusion'), 'info');
      log(t('cli_help_stats'), 'info');
      log(t('cli_help_ach'), 'info');
      log(t('cli_help_hack'), 'info');
      log(t('cli_help_matrix'), 'info');
      log(t('cli_help_crt'), 'info');
      log(t('cli_help_export'), 'info');
      log(t('cli_help_clear'), 'info');
      break;

    case 'status': {
      const s = State.get();
      log(`> PROTOCOL: v7.0 | ID: ${s.growerId} | LANG: ${getCurrentLang().toUpperCase()}`, 'highlight');
      log(`> ${t('top_balance')}: ${s.balance} ₿ | ${t('ach_btn_label')}: ${s.achievements.length}/${Object.keys(ACHIEVEMENTS_CATALOG).length}`, 'info');
      log(`> SLOTS: ${s.rouletteStats.spins} | WINRATE: ${State.getWinRate()}% | PROFIT: ${State.getNetProfit()}`, 'info');
      log(`> TG BOT: @GrowerSim_bot (https://t.me/GrowerSim_bot) [ONLINE]`, 'info');
      break;
    }

    case 'bot':
    case 'grower':
    case 'growersim':
    case 'tg':
      log(t('cli_bot_opening'), 'highlight');
      window.open('https://t.me/GrowerSim_bot', '_blank', 'noopener,noreferrer');
      break;

    case 'balance':
      log(`> ${t('top_balance')}: ${State.read('balance')} ₿`, 'highlight');
      break;

    case 'stats': {
      const st = State.get().rouletteStats;
      log('=== SLOTS 777 TELEMETRY ===', 'highlight');
      log(`  Spins  : ${st.spins} (Wins: ${st.wins} | ${State.getWinRate()}%)`, 'info');
      log(`  Wagered: ${st.totalWagered} | Won: ${st.totalWon}`, 'info');
      log(`  Profit : ${State.getNetProfit()} | Max Win: ${st.maxWin}`, 'info');
      log(`  Streak : ${st.currentStreak} | Best: ${st.bestStreak}`, 'info');
      break;
    }

    case 'achievements':
    case 'ach': {
      const unlocked = State.get().achievements;
      log(`=== ${t('ach_modal_title')} (${unlocked.length}/${Object.keys(ACHIEVEMENTS_CATALOG).length}) ===`, 'highlight');
      Object.values(ACHIEVEMENTS_CATALOG).forEach(a => {
        const done = unlocked.includes(a.id);
        log(`  ${done ? '[✓]' : '[ ]'} ${a.icon} ${t(a.titleKey)} — ${t(a.descKey)}`, done ? 'highlight' : 'sys');
      });
      break;
    }

    case 'hack': {
      if (State.read('hackClaimed')) {
        log(t('cli_hack_done'), 'err');
        AudioEngine.error();
        break;
      }
      log(t('cli_hack_start'), 'info');
      AudioEngine.glitch();
      setTimeout(() => log('> BYPASSING QUANTUM HASH [██████████] 100%', 'info'), 350);
      setTimeout(() => {
        const nextBal = State.read('balance') + 250;
        State.set({ balance: nextBal, hackClaimed: true });
        State.unlockAchievement('ICE_HACKER');
        log(t('cli_hack_granted', { bal: nextBal }), 'highlight');
      }, 750);
      break;
    }

    case 'home':
    case 'index':
      window.location.href = 'index.html';
      break;

    case 'games':
      window.location.href = 'games.html';
      break;

    case 'slots':
    case '777':
    case 'roulette':
      window.location.href = 'roulet.html';
      break;

    case 'support':
    case 'refer':
    case 'crypto':
      window.location.href = 'refer.html';
      break;

    case 'manual':
      window.location.href = 'grower_manual.html';
      break;

    case 'illusion':
    case 'secret':
      State.set({ secretUnlocked: true });
      State.unlockAchievement('CORE_BREAKER');
      window.location.href = 'doubleindex.html';
      break;

    case 'crt':
      controls.toggleCRT();
      break;

    case 'sound':
    case 'audio':
      controls.toggleSound();
      break;

    case 'matrix': {
      const mArg = arg.toLowerCase();
      if (['slow', 'normal', 'fast'].includes(mArg)) {
        State.set({ matrixSpeed: mArg });
        log(`> MATRIX SPEED: ${mArg.toUpperCase()}`, 'highlight');
      } else {
        log('> Usage: matrix slow | normal | fast', 'err');
      }
      break;
    }

    case 'lang':
      if (arg) {
        setLanguage(arg.toLowerCase());
      } else {
        log('> Usage: lang ru|en|uk|be|pl|de|fr|es', 'info');
      }
      break;

    case 'export':
      log(`> TOKEN: ${State.exportData()}`, 'highlight');
      break;

    case 'import':
      if (arg && State.importData(arg)) {
        log(t('cli_import_ok'), 'highlight');
      } else {
        log(t('cli_import_err'), 'err');
      }
      break;

    case 'reset':
      State.reset();
      log(t('cli_reset_ok'), 'highlight');
      break;

    case 'clear':
    case 'cls': {
      const logsEl = document.getElementById('cyber-term-logs');
      if (logsEl) logsEl.innerHTML = '';
      break;
    }

    default:
      log(t('cli_unknown', { cmd }), 'err');
      AudioEngine.error();
      break;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHUD);
} else {
  initHUD();
}
