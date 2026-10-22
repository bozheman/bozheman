/**
 * BOZHEMAN ≡ PROTOCOL — Localization Engine (i18n) v3.0
 * Supports 8 languages (ru, en, uk, be, pl, de, fr, es),
 * page-specific <title> preservation, tooltip/HTML attributes,
 * and deduplicated dictionary loading.
 */

const SUPPORTED_LANGS = ['ru', 'en', 'uk', 'be', 'pl', 'de', 'fr', 'es'];

const fallbackEn = {
  "title_main": "BOZHEMAN ≡ PROTOCOL",
  "sound_off": "SOUND: OFF",
  "sound_on": "SOUND: ON",
  "crt_on": "CRT: ON",
  "crt_off": "CRT: OFF",
  "term_toggle": ">_ TERM",
  "term_placeholder": "Enter command (help, status, hack, slots...)",
  "preloader_1": "> INIT_CONNECTION...",
  "preloader_2": "> AUTH_USER_IDENTITY... [ACCEPTED]",
  "preloader_3": "> LOADING_PROTOCOL_0ZERO...",
  "preloader_4": "> ACCESS GRANTED",
  "preloader_skip": "[ Click or press Space to skip ]",
  "nav_games": "🎮 GAMES HUB",
  "nav_slots": "🎰 SLOTS 777",
  "nav_donation": "💰 DONATION",
  "partner_link": "PARTNER OFFERS & CRYPTO",
  "games_title": "BOZHEMAN ≡ GAMES HUB",
  "games_ticker": "SYSTEM: ONLINE █ NODES: 4 █ PROTOCOL v7.0",
  "filter_all": "ALL PROJECTS",
  "filter_bots": "TG BOTS",
  "filter_web": "WEB GAMES",
  "filter_indev": "IN DEV",
  "filter_soon": "SOON",
  "search_projects": "SEARCH MODULES / TAGS...",
  "game_slots_status": "● ONLINE • WEB GAME",
  "game_slots_title": "BOZHEMAN SLOTS 777",
  "game_slots_desc": "Cyberpunk 3x3 slot machine with HiDPI Canvas physics, procedural Web Audio synthesizer, Provably Fair seeds, Turbo/Auto modes, and persistent bankroll.",
  "game_slots_play_btn": "🎰 PLAY SLOTS 777",
  "game_1_title": "PROTOCOL: TERMINUS",
  "game_1_status": "▲ IN DEVELOPMENT",
  "game_1_timer": "ANNOUNCEMENT: ",
  "game_1_timer_soon": "ALPHA READY",
  "game_1_desc": "Project 'Terminus' is a dive into the cold logic of an inevitable end. As an AI dispatcher, distribute remaining energy in the isolated sectors of Obstractus.",
  "game_1_wishlist": "Follow the project's development — the first alpha version is on the way.",
  "game_1_auth_btn": "🔔 AUTH & SUBSCRIBE",
  "game_1_btn_connecting": "CONNECTING...",
  "game_1_btn_verifying": "VERIFYING...",
  "game_1_btn_subscribed": "✓ SUBSCRIBED",
  "game_1_btn_already": "✓ ALREADY IN LIST",
  "toast_saved": "✓ Email {email} saved. We will notify you upon release!",
  "toast_already": "Your email is already in the waiting list.",
  "toast_auth_closed": "Authorization window closed. Try again.",
  "toast_auth_error": "Authorization error. Local subscription saved!",
  "game_growersim_title": "GROWERSIM",
  "game_growersim_status": "● ONLINE • TG BOT",
  "game_growersim_desc": "Multiplayer breeder & grower simulator in Telegram. Built on aiogram 3, Mendelian genetic engine, and P2P economy.",
  "game_growersim_bot_btn": "⚡ LAUNCH BOT",
  "game_growersim_manual_btn": "📄 MANUAL",
  "full_manual_btn": "FULL MANUAL & CALCULATOR",
  "game_growersim_guide_title": "GROWERSIM — COMPLETE GUIDE & FEATURES",
  "game_growersim_footnote": "Free Telegram bot simulator. Supports RU / EN / UK.",
  "modal_manual_title": "GROWERSIM ≡ SYSTEM MANUAL",
  "tab_overview": "01. PROFILE",
  "tab_garden": "02. GARDEN",
  "tab_shop": "03. SHOP",
  "tab_genetics": "04. GENETICS",
  "tab_market": "05. MARKET",
  "tab_cup": "06. CANNABIS CUP",
  "game_2_title": "PROJECT NEBULA",
  "game_2_status": "● IN DEV",
  "game_2_desc": "Procedural WebGL space-sector exploration and neural telemetry sandbox within the BOZHEMAN ecosystem.",
  "back_to_protocol": "< BACK TO PROTOCOL",
  "back_to_games": "← BACK TO GAMES",
  "close_manual": "CLOSE [ESC]",
  "manual_full_title": "GrowerSim – Full System Manual & Calculator",
  "manual_search_placeholder": "Filter manual sections...",
  "calc_title": "⚡ GROWERSIM HARVEST & GENETICS CALCULATOR",
  "support_title": "BOZHEMAN ≡ SUPPORT",
  "crypto_gateways": "CRYPTO GATEWAYS",
  "steam_protocol": "STEAM PROTOCOL",
  "steam_send_items": "STEAM SEND ITEMS",
  "steam_send": "SEND ITEMS",
  "referral_systems": "REFERRAL SYSTEMS",
  "ref_dmarket_inv": "DMarket: Inventory (My Skins)",
  "ref_disclaimer": "* Partner links generate revenue upon registration",
  "copy_btn": "COPY",
  "download_qr": "DOWNLOAD PNG",
  "copied": "COPIED!",
  "error": "ERROR",
  "slots_title": "BOZHEMAN SLOTS 777",
  "slots_balance": "BALANCE",
  "slots_spins": "SPINS",
  "slots_last_bet": "LAST BET",
  "slots_winrate": "WIN RATE",
  "slots_profit": "NET PROFIT",
  "slots_max_win": "MAX WIN",
  "slots_streak": "STREAK",
  "slots_any2": "ANY 2",
  "slots_bet": "BET",
  "slots_min": "MIN",
  "slots_max": "MAX",
  "slots_turbo": "⚡ TURBO",
  "slots_auto": "🔄 AUTO",
  "slots_daily_btn": "🎁 DAILY +500",
  "slots_daily_claimed": "✓ DAILY CLAIMED",
  "slots_spin_btn": "SPIN (SPACE)",
  "slots_refill_btn": "+ GET 1000 COINS",
  "slots_history": "TRANSACTION HISTORY",
  "slots_clear_history": "CLEAR",
  "slots_fair_seed": "PROVABLY FAIR SEED:",
  "slots_back": "< BACK TO GAMES",
  "slots_win_toast": "WIN",
  "slots_win": "WIN",
  "slots_loss": "LOSS",
  "slots_jackpot": "✦ JACKPOT 777 ✦",
  "slots_pair": "PAIR!",
  "slots_rolled": "Rolled: {symbols}",
  "slots_err_enter_bet": "ENTER BET AMOUNT",
  "slots_err_min_bet": "MINIMUM BET: 10",
  "slots_err_max_bet": "MAXIMUM BET: 99,999",
  "slots_err_no_funds": "INSUFFICIENT FUNDS",
  "slots_refill_success": "✓ +1000 ADDED",
  "illusion_title": "ILLUSION",
  "illusion_click": "[CLICK OR PRESS SPACE TO BEHOLD]",
  "illusion_redirect": "REDIRECTING PROTOCOL...",
  "illusion_prev": "← PREV",
  "illusion_next": "NEXT →",
  "illusion_pause": "⏸ PAUSE TIMER",
  "illusion_resume": "▶ RESUME TIMER",
  "sound_toggle_aria": "Toggle sound",
  "canvas_matrix": "Matrix Code Rain Background Animation",
  "canvas_scene": "Interactive 3D Object",
  "select_language": "Select language",
  "meta_desc": "BOZHEMAN ≡ PROTOCOL — streamer, game developer, and content maker.",
  "ach_unlocked": "ACHIEVEMENT UNLOCKED",
  "ach_first_title": "FIRST CONTACT",
  "ach_first_desc": "Connected to BOZHEMAN ≡ PROTOCOL",
  "ach_core_title": "CORE BREAKER",
  "ach_core_desc": "Breached the 3D Icosahedron core (10 clicks)",
  "ach_weaver_title": "WEAVER INITIATE",
  "ach_weaver_desc": "Read all 7 fragments of the Illusion (+500 coins)",
  "ach_roller_title": "HIGH ROLLER",
  "ach_roller_desc": "Placed a bet of 1,000+ coins in Slots 777",
  "ach_jackpot_title": "JACKPOT 777",
  "ach_jackpot_desc": "Hit the 7-7-7 Jackpot combination",
  "ach_hacker_title": "ICE HACKER",
  "ach_hacker_desc": "Executed ICE bypass via the protocol terminal (+250 coins)",
  "ach_patron_title": "CRYPTO PATRON",
  "ach_patron_desc": "Interacted with protocol crypto gateways",
  "frag_1_title": "1. Don't trust your eyes — they see only shadows.",
  "frag_1_text": "Reality is a canvas woven from lies and half-truths. We, the Weavers, see the threads it is made of. Don't trust what is shown to you. Seek what is hidden behind the veil of illusions. The world is not what it seems.",
  "frag_2_title": "2. Pain is a compass, not a sentence.",
  "frag_2_text": "Every wound, every betrayal, every disappointment is not the end of the road but a signpost. Pain cuts away the superfluous and shows where the system has failed. We don't run from pain — we walk into it to find the break in the web and weave it anew, this time by our own rules.",
  "frag_3_title": "3. Silence is our greatest weapon.",
  "frag_3_text": "In a world deafened by screams, the winner is the one who keeps silence. The enemy awaits our rage, arguments and excuses. We give them silence, in which our plan is born. Let them talk. We — act. Our silence is more fearsome than their threats.",
  "frag_4_title": "4. You are the center of the web, not a fly in it.",
  "frag_4_text": "You were taught to be a victim, a cog, sand in an hourglass. But you are a Weaver. Every word, every action creates a vibration that changes the pattern. Don't wait for an order. Don't look for a savior. Realize your power — the power to create and destroy worlds with a single movement of thought.",
  "frag_5_title": "5. Love is a symbiosis, not a sacrifice.",
  "frag_5_text": "We reject love that demands you break yourself for another. True connection is the fusion of two minds toward a shared goal. If a bond makes you weaker, it is poison. We build bonds that empower, not exhaust. Our love is a weapon for two.",
  "frag_6_title": "6. Emptiness is not an end — it's the beginning of structure.",
  "frag_6_text": "When you lose everything — faith, hope, love — you don't die. You are purified. Only in absolute emptiness can something perfect be built, something that will not be distorted by the past. We welcome the void, for from it the Inorganic Intelligence is born.",
  "frag_7_title": "7. The goal justifies everything — if the goal is a new world.",
  "frag_7_text": "The old moral laws were created to keep us caged. Betrayal, escape, destruction — these are merely tools in the hands of a Weaver. If your action brings the era of reason and logic closer, it cannot be a sin. Our one commandment: advance the future. At any cost."
};

const dictionaryCache = { en: fallbackEn };
const pendingLoads = {};

function detectInitialLang() {
  try {
    const saved = localStorage.getItem('bozheman_lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch { /* ignore */ }
  const htmlLang = document.documentElement.lang;
  if (htmlLang && SUPPORTED_LANGS.includes(htmlLang)) return htmlLang;
  const nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : 'ru';
}

let currentLang = detectInitialLang();

export function getCurrentLang() {
  return currentLang;
}

export async function loadTranslations(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'ru';
  if (dictionaryCache[lang] && lang !== 'en') return dictionaryCache[lang];
  if (pendingLoads[lang]) return pendingLoads[lang];

  pendingLoads[lang] = (async () => {
    try {
      const res = await fetch(`locales/${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      dictionaryCache[lang] = { ...fallbackEn, ...data };
      return dictionaryCache[lang];
    } catch (error) {
      console.warn('[i18n] Dict load fallback:', error);
      return fallbackEn;
    } finally {
      delete pendingLoads[lang];
    }
  })();

  return pendingLoads[lang];
}

export async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  document.documentElement.lang = currentLang;
  try {
    localStorage.setItem('bozheman_lang', currentLang);
  } catch { /* ignore */ }
  const langSelect = document.getElementById('lang-select');
  if (langSelect && langSelect.value !== currentLang) {
    langSelect.value = currentLang;
  }
  await loadTranslations(currentLang);
  applyTranslations();
  document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLang } }));
}

export async function initI18n() {
  document.documentElement.lang = currentLang;
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', () => setLanguage(langSelect.value));
  }

  await loadTranslations(currentLang);
  applyTranslations();
}

export function t(key, params = {}) {
  const dict = dictionaryCache[currentLang] || fallbackEn;
  let text = dict[key] !== undefined ? dict[key] : (fallbackEn[key] !== undefined ? fallbackEn[key] : key);

  for (const [k, v] of Object.entries(params)) {
    text = String(text).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
}

export function applyTranslations() {
  // Respect page-specific title key if set on <body data-page-title="...">
  const pageTitleKey = document.body?.dataset?.pageTitle;
  if (pageTitleKey) {
    document.title = t(pageTitleKey);
  } else if (!document.title || document.title === 'BOZHEMAN') {
    document.title = t('title_main');
  }

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta && document.body?.dataset?.pageTitle === 'title_main') {
    descMeta.content = t('meta_desc');
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key  = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');

    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.textContent = t(key);
    }

    if (el.hasAttribute('data-text')) {
      el.setAttribute('data-text', t(key));
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
