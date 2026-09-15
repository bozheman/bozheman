const fallbackEn = {
  "title_main": "BOZHEMAN",
  "sound_off": "SOUND: OFF ",
  "sound_on": "SOUND: ON ",
  "preloader_1": "> INIT_CONNECTION...",
  "preloader_2": "> AUTH_USER_IDENTITY... [ACCEPTED]",
  "preloader_3": "> LOADING_PROTOCOL_0ZERO...",
  "preloader_4": "> ACCESS GRANTED",
  "preloader_skip": "[ Click or press Space to skip ]",
  "nav_games": "🎮 GAMES",
  "nav_donation": "💰 DONATION",
  "partner_link": "PARTNER OFFERS",
  "games_title": "BOZHEMAN ≡ GAMES HUB",
  "games_ticker": "SYSTEM: ONLINE █ NODES: 3 █ PROTOCOL v6.2",
  "filter_all": "ALL PROJECTS [1]",
  "filter_bots": "TG BOTS [1]",
  "filter_indev": "IN DEV [0]",
  "filter_soon": "SOON [0]",
  "game_1_title": "UNKNOWN PROTOCOL",
  "game_1_status": "▲ IN DEVELOPMENT",
  "game_1_timer": "ANNOUNCEMENT: ",
  "game_1_timer_soon": "Soon!",
  "game_1_desc": "Project 'Terminus' is a dive into the cold logic of an inevitable end. As an AI dispatcher, distribute remaining energy in the isolated sectors of Obstractus.",
  "game_1_wishlist": "Follow the project's development — the first alpha version is on the way.",
  "game_1_auth_btn": "AUTH & SUBSCRIBE",
  "game_1_btn_connecting": "CONNECTING...",
  "game_1_btn_verifying": "VERIFYING...",
  "game_1_btn_subscribed": "✓ SUBSCRIBED",
  "game_1_btn_already": "✓ ALREADY IN LIST",
  "toast_saved": "✓ Email {email} saved. We will notify you upon release!",
  "toast_already": "Your email is already in the waiting list.",
  "toast_auth_closed": "Authorization window closed. Try again.",
  "toast_auth_error": "Authorization error. Try again.",
  "game_growersim_title": "GROWERSIM",
  "game_growersim_status": "● ONLINE • TG BOT",
  "game_growersim_desc": "Multiplayer breeder & grower simulator in Telegram. Built on aiogram 3, Mendelian genetic engine, and P2P economy.",
  "game_growersim_bot_btn": "⚡ LAUNCH BOT",
  "game_growersim_manual_btn": "📄 MANUAL",
  "full_manual_btn": "FULL MANUAL",
  "game_growersim_guide_title": "GROWERSIM — COMPLETE GUIDE & FEATURES",
  "game_growersim_footnote": "Free Telegram bot simulator. Supports RU / EN / UK.",
  "modal_manual_title": "GROWERSIM ≡ SYSTEM MANUAL",
  "tab_overview": "01. PROFILE",
  "tab_garden": "02. GARDEN",
  "tab_shop": "03. SHOP",
  "tab_genetics": "04. GENETICS",
  "tab_market": "05. MARKET",
  "tab_cup": "06. CUP & SLEEP",
  "game_2_title": "CLASSIFIED PROJECTS",
  "game_2_status": "■ MULTI-PLATFORM",
  "game_2_desc": "Announcements of new games and projects by BOZHEMAN protocol will be available later. Follow official channels for updates.",
  "back_to_protocol": "< BACK TO PROTOCOL",
  "back_to_games": "← BACK TO GAMES",
  "close_manual": "CLOSE",
  "manual_full_title": "GrowerSim – Full System Manual",
  "support_title": "BOZHEMAN ≡ SUPPORT",
  "crypto_gateways": "CRYPTO GATEWAYS",
  "steam_protocol": "STEAM PROTOCOL",
  "steam_send": "SEND ITEMS",
  "referral_systems": "REFERRAL SYSTEMS",
  "ref_dmarket_inv": "DMarket: Inventory (My Skins)",
  "ref_disclaimer": "* Partner links generate revenue upon registration",
  "copied": "COPIED!",
  "error": "ERROR",
  "slots_title": "BOZHEMAN SLOTS",
  "slots_balance": "BALANCE",
  "slots_spins": "SPINS",
  "slots_last_bet": "LAST BET",
  "slots_any2": "ANY 2",
  "slots_bet": "BET",
  "slots_min": "MIN",
  "slots_max": "MAX",
  "slots_spin_btn": "SPIN (SPACE)",
  "slots_refill_btn": "+ GET 1000 COINS",
  "slots_history": "TRANSACTION HISTORY",
  "slots_back": "< BACK TO GAMES",
  "slots_win_toast": "WIN",
  "slots_win": "WIN",
  "slots_loss": "LOSS",
  "slots_jackpot": "✦ JACKPOT ✦",
  "slots_pair": "PAIR!",
  "slots_rolled": "Rolled: {symbols}",
  "slots_err_enter_bet": "ENTER BET AMOUNT",
  "slots_err_min_bet": "MINIMUM BET: 10",
  "slots_err_max_bet": "MAXIMUM BET: 99,999",
  "slots_err_no_funds": "INSUFFICIENT FUNDS",
  "slots_refill_success": "✓ +1000 ADDED",
  "illusion_title": "ILLUSION",
  "illusion_click": "[CLICK TO BEHOLD]",
  "illusion_redirect": "REDIRECTING PROTOCOL...",
  "sound_toggle_aria": "Toggle sound",
  "canvas_matrix": "Matrix Code Rain Background Animation",
  "canvas_scene": "Interactive 3D Object",
  "select_language": "Select language",
  "meta_desc": "Streamer, game developer, and content maker.",
  "crt_on": "CRT: ON",
  "crt_off": "CRT: OFF",
  "support_title": "BOZHEMAN ≡ SUPPORT",
  "crypto_gateways": "CRYPTO GATEWAYS",
  "steam_send_items": "STEAM SEND ITEMS",
  "steam_send": "SEND ITEMS",
  "referral_systems": "REFERRAL SYSTEMS",
  "ref_dmarket_inv": "DMarket: Inventory (My Skins)",
  "ref_disclaimer": "* Partner links generate revenue upon registration",
  "back_to_protocol": "< BACK TO PROTOCOL",
  "copied": "COPIED!",
  "error": "ERROR"
};

const dictionaryCache = { en: fallbackEn };
let currentLang = localStorage.getItem('bozheman_lang') || 'en';

export async function loadTranslations(lang) {
  if (dictionaryCache[lang]) return dictionaryCache[lang];
  try {
    const res = await fetch(`locales/${lang}.json`);
    const data = await res.json();
    dictionaryCache[lang] = data;
    return data;
  } catch (error) {
    console.error('Dict load error', error);
    return fallbackEn;
  }
}

export async function initI18n() {
  document.documentElement.lang = currentLang;
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', async () => {
      currentLang = langSelect.value;
      document.documentElement.lang = currentLang;
      localStorage.setItem('bozheman_lang', currentLang);
      await loadTranslations(currentLang);
      applyTranslations();
      document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLang } }));
    });
  }
  
  await loadTranslations(currentLang);
  applyTranslations();
}

export function t(key, params = {}) {
  const dict = dictionaryCache[currentLang] || fallbackEn;
  let text = dict[key] !== undefined ? dict[key] : (fallbackEn[key] !== undefined ? fallbackEn[key] : key);
  
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

export function applyTranslations() {
  document.title = t('title_main');
  
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.content = t('meta_desc');
  
  const ogDescMeta = document.querySelector('meta[property="og:description"]');
  if (ogDescMeta) ogDescMeta.content = t('meta_desc');

  const twDescMeta = document.querySelector('meta[name="twitter:description"]');
  if (twDescMeta) twDescMeta.content = t('meta_desc');
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    
    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.textContent = t(key);
    }
    
    // Support glitch buttons using data-text
    if (el.hasAttribute('data-text')) {
      el.setAttribute('data-text', t(key));
    }
  });
}

// Auto-init on script load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
