/**
 * BOZHEMAN ≡ PROTOCOL — Localization Engine (i18n) v4.0
 * Supports 8 languages (ru, en, uk, be, pl, de, fr, es),
 * synchronous RU/EN zero-FOUC dictionaries, data-i18n-html support,
 * page-specific <title> preservation, and automatic glitch data-text sync.
 */

const SUPPORTED_LANGS = ['ru', 'en', 'uk', 'be', 'pl', 'de', 'fr', 'es'];

const fallbackEn = {
  "ach_btn_label": "🏆 ACHIEVEMENTS",
  "ach_core_desc": "Decrypted the 3D Icosahedron core (10 clicks)",
  "ach_core_title": "CORE BREAKER",
  "ach_first_desc": "Connected to BOZHEMAN ≡ PROTOCOL",
  "ach_first_title": "FIRST CONTACT",
  "ach_hacker_desc": "Executed ICE bypass via protocol terminal (+250 coins)",
  "ach_hacker_title": "ICE HACKER",
  "ach_jackpot_desc": "Hit the maximum 7-7-7 Jackpot combination",
  "ach_jackpot_title": "JACKPOT 777",
  "ach_modal_title": "PROTOCOL ACHIEVEMENTS",
  "ach_patron_desc": "Interacted with protocol crypto gateways",
  "ach_patron_title": "CRYPTO PATRON",
  "ach_roller_desc": "Placed a bet of 1,000+ coins in Slots 777",
  "ach_roller_title": "HIGH ROLLER",
  "ach_scholar_desc": "Used the GrowerSim Harvest & Genetics Calculator (+200 coins)",
  "ach_scholar_title": "GROWERSIM GENETICIST",
  "ach_unlocked": "ACHIEVEMENT UNLOCKED",
  "ach_weaver_desc": "Read all 7 fragments of the Illusion (+500 coins)",
  "ach_weaver_title": "WEAVER INITIATE",
  "amb_log_1": "> INIT_CONNECTION... [OK]",
  "amb_log_2": "> NODE_BALANCE: {bal} COINS",
  "amb_log_3": "> TG_BOT: @GrowerSim_bot [ONLINE]",
  "amb_log_4": "> SLOTS_SPINS: {spins} | WINRATE: {winrate}%",
  "amb_log_5": "> PROTOCOL_BOZHEMAN: v7.0 ACTIVE",
  "amb_log_6": "> PRESS [~] OR TYPE 'help' FOR CLI",
  "back_to_games": "← BACK TO GAMES HUB",
  "back_to_protocol": "< BACK TO PROTOCOL",
  "brand_subtitle": "CYBERPUNK SYSTEM // NODE ACTIVE",
  "calc_label_hp": "PLANT HEALTH HP (%)",
  "calc_label_light": "LIGHTING & SOIL MODULE",
  "calc_label_strain": "STRAIN GENOTYPE",
  "calc_label_streak": "CARE STREAK (🔥)",
  "calc_light_1": "Basic Spectrum HPS/LED (x1.0)",
  "calc_light_2": "Mycorrhiza + Super-Organic (x1.25)",
  "calc_light_3": "LED Quantum Board 240W (x1.6)",
  "calc_preset_1": "🌱 Starter Build",
  "calc_preset_2": "🔥 Organic Pro",
  "calc_preset_3": "⚡ Quantum Max",
  "calc_res_biomass": "ESTIMATED BIOMASS",
  "calc_res_bman": "P2P MARKET VALUE",
  "calc_res_cup": "CANNABIS CUP SCORE",
  "calc_res_mutation": "RARE MUTATION CHANCE",
  "calc_res_thc": "THC CONCENTRATION",
  "calc_reset": "↺ RESET",
  "calc_strain_1": "Standard Hybrid F1 (x1.0)",
  "calc_strain_2": "Dominant Phenotype (x1.35)",
  "calc_strain_3": "Cyber Kush F2 (x1.8)",
  "calc_strain_4": "Quantum Strain Mutation (x3.0)",
  "calc_subtitle": "Calculate estimated biomass yield, THC concentration, P2P Bman value, and Cannabis Cup score",
  "calc_title": "⚙️ HARVEST & MENDEL GENETICS SIMULATOR",
  "canvas_matrix": "Matrix Code Rain Background Animation",
  "canvas_scene": "Interactive 3D Protocol Core",
  "cli_bot_opening": "> CONNECTING TO @GrowerSim_bot (https://t.me/GrowerSim_bot)...",
  "cli_hack_done": "> ICE_FIREWALL: Node already breached in this profile.",
  "cli_hack_granted": "> ACCESS GRANTED! +250 COINS TRANSFERRED (BALANCE: {bal})",
  "cli_hack_start": "> INJECTING PAYLOAD INTO SECTOR 0ZERO...",
  "cli_help_ach": "  ach          - List all protocol achievements",
  "cli_help_bot": "  bot          - Launch Telegram bot @GrowerSim_bot",
  "cli_help_clear": "  clear        - Clear terminal output",
  "cli_help_crt": "  crt / sound  - Toggle CRT filter or Audio",
  "cli_help_export": "  export       - Export profile backup token",
  "cli_help_hack": "  hack         - Breach ICE firewall (+250 coins)",
  "cli_help_header": "=== BOZHEMAN ≡ CLI COMMANDS ===",
  "cli_help_illusion": "  illusion     - Enter Secret Weaver Protocol",
  "cli_help_manual": "  manual       - Open GrowerSim Manual & Calculator",
  "cli_help_matrix": "  matrix <spd> - Set rain speed: slow | normal | fast",
  "cli_help_nav": "  home / games - Navigate to Main / Games Hub",
  "cli_help_slots": "  slots        - Launch BOZHEMAN SLOTS 777",
  "cli_help_stats": "  stats        - Detailed Slots 777 analytics",
  "cli_help_status": "  status       - System telemetry & player profile",
  "cli_help_support": "  support      - Open Crypto & Partner Gateways",
  "cli_import_err": "> ERROR: Invalid profile token.",
  "cli_import_ok": "> PROFILE RESTORED FROM TOKEN SUCCESSFULLY.",
  "cli_reset_ok": "> PROFILE RESET TO FACTORY DEFAULTS (1000 COINS).",
  "cli_unknown": "> UNKNOWN COMMAND: \"{cmd}\". Type \"help\" for available commands.",
  "close_manual": "CLOSE [ESC]",
  "copied": "COPIED!",
  "copy_btn": "COPY",
  "copy_site_url": "📋 COPY BOZHEMAN.COM LINK",
  "core_decrypt_log": "> CORE_DECRYPTION: [{bar}] {pct}%",
  "core_hint": "[ Click the 3D Core 10 times to decrypt the secret protocol ]",
  "crt_off": "CRT: OFF",
  "crt_on": "CRT: ON",
  "crypto_gateways": "CRYPTOCURRENCY GATEWAYS",
  "crypto_net_warning": "⚠️ IMPORTANT: Send assets strictly via the specified network (TRC20 / BTC / ERC20 / BEP20).",
  "download_qr": "DOWNLOAD PNG",
  "ecosystem_bot_desc": "Flagship Telegram grower & genetics simulator (@GrowerSim_bot)",
  "ecosystem_slots_desc": "Cyberpunk 777 Slot Machine with instant payouts",
  "ecosystem_title": "BOZHEMAN ECOSYSTEM PROJECTS",
  "error": "ERROR",
  "filter_all": "ALL PROJECTS",
  "filter_bots": "TG BOTS",
  "filter_dev": "IN DEV",
  "filter_indev": "IN DEV",
  "filter_soon": "SOON",
  "filter_web": "WEB GAMES",
  "footer_status": "BOZHEMAN ≡ PROTOCOL v7.0 // ALL SYSTEMS NOMINAL",
  "frag_1_text": "Reality is a canvas woven from lies and half-truths. We, the Weavers, see the threads it is made of. Don't trust what is shown to you. Seek what is hidden behind the veil of illusions. The world is not what it seems.",
  "frag_1_title": "1. Don't trust your eyes — they see only shadows.",
  "frag_2_text": "Every wound, every betrayal, every disappointment is not the end of the road but a signpost. Pain cuts away the superfluous and shows where the system has failed. We don't run from pain — we walk into it to find the break in the web and weave it anew, this time by our own rules.",
  "frag_2_title": "2. Pain is a compass, not a sentence.",
  "frag_3_text": "In a world deafened by screams, the winner is the one who keeps silence. The enemy awaits our rage, arguments and excuses. We give them silence, in which our plan is born. Let them talk. We — act. Our silence is more fearsome than their threats.",
  "frag_3_title": "3. Silence is our greatest weapon.",
  "frag_4_text": "You were taught to be a victim, a cog, sand in an hourglass. But you are a Weaver. Every word, every action creates a vibration that changes the pattern. Don't wait for an order. Don't look for a savior. Realize your power — the power to create and destroy worlds with a single movement of thought.",
  "frag_4_title": "4. You are the center of the web, not a fly in it.",
  "frag_5_text": "We reject love that demands you break yourself for another. True connection is the fusion of two minds toward a shared goal. If a bond makes you weaker, it is poison. We build bonds that empower, not exhaust. Our love is a weapon for two.",
  "frag_5_title": "5. Love is a symbiosis, not a sacrifice.",
  "frag_6_text": "When you lose everything — faith, hope, love — you don't die. You are purified. Only in absolute emptiness can something perfect be built, something that will not be distorted by the past. We welcome the void, for from it the Inorganic Intelligence is born.",
  "frag_6_title": "6. Emptiness is not an end — it's the beginning of structure.",
  "frag_7_text": "The old moral laws were created to keep us caged. Betrayal, escape, destruction — these are merely tools in the hands of a Weaver. If your action brings the era of reason and logic closer, it cannot be a sin. Our one commandment: advance the future. At any cost.",
  "frag_7_title": "7. The goal justifies everything — if the goal is a new world.",
  "full_manual_btn": "FULL MANUAL & CALCULATOR",
  "game_1_auth_btn": "🔔 AUTH & SUBSCRIBE",
  "game_1_btn": "🔔 NOTIFY ON RELEASE",
  "game_1_btn_already": "✓ ALREADY IN LIST",
  "game_1_btn_connecting": "CONNECTING...",
  "game_1_btn_subscribed": "✓ SUBSCRIBED",
  "game_1_btn_verifying": "VERIFYING...",
  "game_1_desc": "Hardcore text-based cyberpunk RPG featuring network breaching, energy distribution across isolated Obstractus sectors, and non-linear branching narrative.",
  "game_1_footnote": "Early access to closed alpha testing via protocol subscription.",
  "game_1_status": "▲ IN DEVELOPMENT",
  "game_1_timer": "TIME TO DEPLOY:",
  "game_1_timer_soon": "ALPHA READY",
  "game_1_title": "PROJECT: TERMINUS",
  "game_3_desc": "Procedural 3D WebGL deep-space and anomaly sector explorer with real-time GLSL shader visualization and interactive bio-calculator.",
  "game_3_footnote": "Interactive laboratory calculator is live inside the manual.",
  "game_3_lab_btn": "⚙️ OPEN SIMULATOR & MANUAL",
  "game_3_progress_label": "CORE SHADER PIPELINE",
  "game_3_status": "● ENGINE PROTOTYPE",
  "game_3_title": "PROJECT: NEBULA",
  "game_growersim_bot_btn": "⚡ LAUNCH @GrowerSim_bot",
  "game_growersim_desc": "Multiplayer breeder and grower simulator in Telegram (@GrowerSim_bot). Built on async aiogram 3 engine, Mendelian genetics, and P2P market economy.",
  "game_growersim_footnote": "Official Telegram Bot: @GrowerSim_bot (RU / EN / UK). Online 24/7.",
  "game_growersim_manual_btn": "📄 MANUAL",
  "game_growersim_qr_btn": "📱 BOT QR",
  "game_growersim_status": "● ONLINE • TG BOT",
  "game_growersim_title": "GROWERSIM (@GrowerSim_bot)",
  "game_slots_desc": "Cyberpunk 3×3 slot machine with HTML5 Canvas reel physics, procedural Web Audio API synthesizer, Provably Fair verification, and Jackpot system.",
  "game_slots_footnote": "Shared protocol balance. Supports Turbo, Auto-Spin, and +500 Daily Bonus.",
  "game_slots_play_btn": "🎰 PLAY SLOTS 777",
  "game_slots_status": "● ONLINE • WEB GAME",
  "game_slots_telemetry": "Balance: {bal} ₿ | Spins: {spins} | Winrate: {winrate}%",
  "game_slots_title": "BOZHEMAN SLOTS 777",
  "games_ticker": "SYSTEM: ONLINE █ MODULES: 4 █ @GrowerSim_bot ACTIVE",
  "games_title": "BOZHEMAN ≡ GAMES HUB",
  "illusion_click": "[ CLICK OR PRESS SPACE TO BEHOLD THE MANIFESTO ]",
  "illusion_fragment_of": "PROTOCOL FRAGMENT [{cur}/{total}]",
  "illusion_home_btn": "🏠 MAIN HUB",
  "illusion_next": "NEXT →",
  "illusion_pause": "⏸ PAUSE",
  "illusion_prev": "← PREV",
  "illusion_redirect": "AUTO-REDIRECT TO SLOTS 777 IN:",
  "illusion_resume": "▶ RESUME",
  "illusion_slots_btn": "🎰 SLOTS 777 →",
  "illusion_title": "BOZHEMAN ≡ ILLUSION",
  "illusion_weaver_bonus": "WEAVER INITIATE REWARD: +500 ₿",
  "man_1_1": "<strong>100% Inline Button Interface (/start):</strong> Garden, Shop, Market, Breeding, Profile, and Contracts are controlled via clean Inline buttons in @GrowerSim_bot.",
  "man_1_2": "<strong>Grower ID:</strong> Every player receives a unique cryptographic breeder identifier (e.g., #GRW-58291).",
  "man_1_3": "<strong>Multilingual Core:</strong> Full support for RU / EN / UK inside the bot with instant switching.",
  "man_1_4": "<strong>Progression & Ranks:</strong> Level up, unlock new greenhouse slots, and build reputation by harvesting, crossbreeding, and fulfilling contracts.",
  "man_2_1": "<strong>5 Growth Stages:</strong> Seed ➔ Seedling ➔ Vegetation ➔ Flowering ➔ Harvest.",
  "man_2_2": "<strong>Bio-Slot Parameters:</strong> 💧 Moisture, 🌱 Nutrients (NPK), ❤️ Health (HP), and 🌾 Soil Fertility.",
  "man_2_3": "<strong>Care Window & Streaks:</strong> Timely care during peak windows triggers critical bonuses and builds your 🔥 Care Streak.",
  "man_2_4": "<strong>Harvest Formula:</strong> Final biomass yield is calculated from strain genetics, plant health, lighting power, and THC balance.",
  "man_3_1": "<strong>💧 Water & Irrigation:</strong> Light Water (+40%), Full Water (+100%), Automated Drip System (+20% HP stability).",
  "man_3_2": "<strong>🌱 Soil & Fertilizers:</strong> Base NPK Complex (+35%), Super-Organic (+3h growth speed), Mycorrhiza, and Soil Conditioner.",
  "man_3_3": "<strong>☀️ Lighting & Boosters:</strong> LED Quantum Board 240W (+8h growth) and quantum time boosters x2 / x5.",
  "man_3_4": "<strong>⚡ Energy & Bman Tokens:</strong> Phyto-Tonic (+50 Energy), greenhouse slot expansion, and Telegram Stars exchange.",
  "man_4_1": "<strong>Mendel Genetic Engine:</strong> Every seed carries a distinct combination of dominant and recessive alleles (THC, CBD, Yield, Flowering Time).",
  "man_4_2": "<strong>Hybridization Lab:</strong> Crossing two unique parent strains gives a 25% chance of expressing rare dominant traits in F1/F2 offspring.",
  "man_4_3": "<strong>Quantum Mutations:</strong> 5% chance to discover the legendary 'Quantum Strain' genotype with a 3x biomass multiplier (x3.0).",
  "man_5_1": "<strong>P2P Seed & Harvest Exchange:</strong> Free player-to-player trading of custom hybrids and rare seeds inside @GrowerSim_bot.",
  "man_5_2": "<strong>Dynamic Pricing:</strong> Market rates fluctuate in real time based on supply, demand, and gene rarity.",
  "man_5_3": "<strong>Escrow Smart Trades:</strong> All transactions are secured by the bot's built-in escrow contract with zero item loss risk.",
  "man_6_1": "<strong>Weekly Championships:</strong> Seasonal competitions among growers for the title of top protocol breeder.",
  "man_6_2": "<strong>Automated Judging Panel:</strong> Entries are scored across 4 metrics: biomass yield, THC %, Care Streak purity, and genotype rarity.",
  "man_6_3": "<strong>Prize Pool:</strong> Exclusive profile trophies, limited-edition grow hardware, and major Bman token payouts.",
  "man_h_1": "1. INTERFACE & PLAYER PROFILE (@GrowerSim_bot)",
  "man_h_2": "2. GARDEN & PLANT MICROMANAGEMENT",
  "man_h_3": "3. SHOP & GROW EQUIPMENT",
  "man_h_4": "4. MENDELIAN GENETICS & BREEDING",
  "man_h_5": "5. P2P MARKET & ECONOMY",
  "man_h_6": "6. CANNABIS CUP TOURNAMENTS",
  "manual_bot_banner_sub": "Launch the simulator right now — instant start via /start command",
  "manual_bot_banner_title": "OFFICIAL TELEGRAM BOT: @GrowerSim_bot",
  "manual_copy_bot_link": "📋 COPY @GrowerSim_bot LINK",
  "manual_full_title": "GROWERSIM ≡ FULL SYSTEM MANUAL & CALCULATOR",
  "manual_search_placeholder": "Filter manual sections by keyword...",
  "meta_desc": "BOZHEMAN ≡ PROTOCOL — streamer, game developer (@GrowerSim_bot, Slots 777), and content creator.",
  "modal_manual_title": "GROWERSIM (@GrowerSim_bot) ≡ SYSTEM MANUAL",
  "modal_next_tab": "NEXT SECTION →",
  "nav_donation": "💰 DONATION",
  "nav_games": "🎮 GAMES HUB",
  "nav_growersim": "🌱 BOT @GrowerSim_bot",
  "nav_slots": "🎰 SLOTS 777",
  "partner_link": "PARTNER OFFERS & CRYPTO",
  "preloader_1": "> INIT_CONNECTION...",
  "preloader_2": "> AUTH_USER_IDENTITY... [ACCEPTED]",
  "preloader_3": "> LOADING @GrowerSim_bot & PROTOCOL_0ZERO...",
  "preloader_4": "> ACCESS GRANTED",
  "preloader_skip": "[ Click or press Space to skip ]",
  "qr_close": "CLOSE [ESC]",
  "qr_download": "DOWNLOAD PNG",
  "qr_gateway_title": "PROTOCOL CRYPTO GATEWAY",
  "ref_disclaimer": "* Registering via partner links directly supports protocol development",
  "ref_dmarket_inv": "DMarket: BOZHEMAN Skins Inventory",
  "referral_systems": "PARTNER & REFERRAL SYSTEMS",
  "search_no_results": "No modules match your search query. Try resetting the filter.",
  "search_placeholder": "SEARCH MODULES & TAGS...",
  "select_language": "Select interface language",
  "slots_any2": "ANY 2",
  "slots_auto": "🔄 AUTO",
  "slots_auto_off": "🔄 AUTO: OFF [A]",
  "slots_auto_on": "🔄 AUTO: ON [A]",
  "slots_back": "< BACK TO GAMES HUB",
  "slots_balance": "BALANCE",
  "slots_bet": "BET",
  "slots_bot_link": "🌱 PLAY ON TELEGRAM: @GrowerSim_bot",
  "slots_clear_history": "CLEAR",
  "slots_daily_btn": "🎁 DAILY +500",
  "slots_daily_claimed": "✓ +500 COINS CLAIMED!",
  "slots_daily_wait": "⏳ BONUS IN {h}h {m}m",
  "slots_double": "x2",
  "slots_err_enter_bet": "ENTER BET AMOUNT",
  "slots_err_max_bet": "MAXIMUM BET: 99,999 COINS",
  "slots_err_min_bet": "MINIMUM BET: 10 COINS",
  "slots_err_no_funds": "INSUFFICIENT COINS IN BALANCE",
  "slots_fair_seed": "PROVABLY FAIR SEED:",
  "slots_fair_verified": "[VERIFIED • CLICK TO COPY]",
  "slots_half": "1/2",
  "slots_history": "TRANSACTION HISTORY",
  "slots_history_empty": "Spin history is empty. Pull the lever!",
  "slots_jackpot": "✦ JACKPOT 777 ✦",
  "slots_last_bet": "LAST BET",
  "slots_loss": "LOSS",
  "slots_max": "MAX",
  "slots_max_win": "MAX WIN",
  "slots_min": "MIN",
  "slots_pair": "PAIR MATCH!",
  "slots_profit": "NET PROFIT",
  "slots_refill_btn": "+ GET 1000 FREE COINS",
  "slots_refill_success": "✓ +1000 COINS ADDED",
  "slots_rolled": "Rolled: {symbols}",
  "slots_spin_btn": "SPIN REELS [SPACE]",
  "slots_spins": "SPINS",
  "slots_streak": "STREAK",
  "slots_title": "BOZHEMAN ≡ SLOTS 777",
  "slots_turbo": "⚡ TURBO",
  "slots_turbo_off": "⚡ TURBO: OFF [T]",
  "slots_turbo_on": "⚡ TURBO: ON [T]",
  "slots_win": "WIN!",
  "slots_win_toast": "WIN",
  "slots_winrate": "WIN RATE",
  "sound_off": "SOUND: OFF",
  "sound_on": "SOUND: ON",
  "sound_toggle_aria": "Toggle sound [M]",
  "stage_1": "01. SEED",
  "stage_2": "02. SEEDLING",
  "stage_3": "03. VEGETATION",
  "stage_4": "04. FLOWERING",
  "stage_5": "05. HARVEST",
  "stages_title": "PLANT GROWTH CYCLE IN @GrowerSim_bot",
  "steam_protocol": "STEAM PROTOCOL",
  "steam_send": "SEND STEAM ITEMS",
  "steam_send_items": "STEAM TRADE OFFER",
  "support_title": "BOZHEMAN ≡ SUPPORT & GATEWAYS",
  "tab_cup": "06. CANNABIS CUP",
  "tab_garden": "02. GARDEN",
  "tab_genetics": "04. GENETICS",
  "tab_market": "05. MARKET",
  "tab_overview": "01. PROFILE",
  "tab_shop": "03. SHOP",
  "tag_aiogram": "AIOGRAM 3",
  "tag_canvas": "HTML5 CANVAS",
  "tag_cup": "CANNABIS CUP",
  "tag_fair": "PROVABLY FAIR",
  "tag_firebase": "FIREBASE AUTH",
  "tag_genetics": "MENDEL GENETICS",
  "tag_jackpot": "JACKPOT x10",
  "tag_netrun": "NETRUNNING",
  "tag_p2p": "P2P MARKET",
  "tag_procedural": "PROCEDURAL WORLD",
  "tag_rpg": "CYBERPUNK RPG",
  "tag_shaders": "GLSL SHADERS",
  "tag_threejs": "THREE.JS 3D",
  "tag_webaudio": "WEB AUDIO SYNTH",
  "term_hotkeys_hint": "Hotkeys: [~] Terminal | [M] Sound | [C] CRT Filter",
  "term_placeholder": "Enter command (help, status, bot, hack, slots...)",
  "term_ready": "> BOZHEMAN ≡ CLI v7.0 READY. Type 'help' or click a command chip.",
  "term_toggle": ">_ TERMINAL [~]",
  "title_main": "BOZHEMAN ≡ PROTOCOL",
  "toast_already": "Your account is already on the waiting list.",
  "toast_auth_closed": "Authorization window closed. Please try again.",
  "toast_auth_error": "Subscription saved to local protocol profile!",
  "toast_saved": "✓ Node {email} registered. We will notify you upon release!",
  "top_balance": "BALANCE",
  "top_bot_link": "🌱 @GrowerSim_bot",
  "top_grower_id": "ID",
  "top_node_online": "NODE: ONLINE",
  "game_3_shader_pipe": "CORE SHADER PIPELINE",
  "tag_three": "THREE.JS",
  "tag_glsl": "GLSL SHADERS",
  "tag_proc": "PROCEDURAL",
  "qr_bot_modal_title": "TELEGRAM BOT QR CODE",
  "qr_copy_bot_link": "COPY BOT LINK",
  "bot_banner_title": "🌱 OFFICIAL TELEGRAM BOT: @GrowerSim_bot",
  "bot_banner_sub": "Real-time synchronization of Mendelian genetics, P2P market & Cannabis Cup tournaments",
  "qr_btn_label": "QR",
  "eco_grower_title": "🌱 GROWERSIM (@GrowerSim_bot)",
  "eco_grower_desc": "Official Telegram breeder simulator with Mendelian genetics and P2P market.",
  "eco_slots_title": "🎰 BOZHEMAN SLOTS 777",
  "eco_slots_desc": "Cyberpunk slot machine with Provably Fair hashing and persistent local balance.",
  "site_qr_label": "BOZHEMAN.COM — NODE QR",
  "qr_bot_copied": "@GrowerSim_bot LINK COPIED",
  "slots_seed_copied": "PROVABLY FAIR SEED COPIED TO CLIPBOARD"
};

const fallbackRu = {
  "ach_btn_label": "🏆 ДОСТИЖЕНИЯ",
  "ach_core_desc": "Дешифровано 3D-ядро икосаэдра (10 кликов)",
  "ach_core_title": "ВЗЛОМЩИК ЯДРА",
  "ach_first_desc": "Подключение к BOZHEMAN ≡ PROTOCOL установлено",
  "ach_first_title": "ПЕРВЫЙ КОНТАКТ",
  "ach_hacker_desc": "Выполнен обход защиты через терминал (+250 монет)",
  "ach_hacker_title": "ВЗЛОМ ICE",
  "ach_jackpot_desc": "Выпала максимальная комбинация 7-7-7",
  "ach_jackpot_title": "ДЖЕКПОТ 777",
  "ach_modal_title": "ДОСТИЖЕНИЯ ПРОТОКОЛА",
  "ach_patron_desc": "Использован крипто-шлюз поддержки протокола",
  "ach_patron_title": "КРИПТО-ПАТРОН",
  "ach_roller_desc": "Сделана ставка от 1 000 монет в Slots 777",
  "ach_roller_title": "ХАЙРОЛЛЕР",
  "ach_scholar_desc": "Использован калькулятор биомассы и генетики (+200 монет)",
  "ach_scholar_title": "ГЕНЕТИК GROWERSIM",
  "ach_unlocked": "ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО",
  "ach_weaver_desc": "Изучены все 7 фрагментов Иллюзии (+500 монет)",
  "ach_weaver_title": "АДЕПТ ТКАЧЕЙ",
  "amb_log_1": "> ИНИЦИАЛИЗАЦИЯ УЗЛА... [ОК]",
  "amb_log_2": "> БАЛАНС ПРОТОКОЛА: {bal} МОНЕТ",
  "amb_log_3": "> TG-БОТ: @GrowerSim_bot [ОНЛАЙН]",
  "amb_log_4": "> СПИНЫ 777: {spins} | ВИНРЕЙТ: {winrate}%",
  "amb_log_5": "> ПРОТОКОЛ BOZHEMAN: v7.0 АКТИВЕН",
  "amb_log_6": "> НАЖМИТЕ [~] ИЛИ ВВЕДИТЕ «help» В ТЕРМИНАЛЕ",
  "back_to_games": "← НАЗАД В ИГРОВОЙ ХАБ",
  "back_to_protocol": "< НАЗАД В ПРОТОКОЛ",
  "brand_subtitle": "CYBERPUNK SYSTEM // УЗЕЛ АКТИВЕН",
  "calc_label_hp": "ЗДОРОВЬЕ КУСТА HP (%)",
  "calc_label_light": "МОДУЛЬ ОСВЕЩЕНИЯ И ПОЧВЫ",
  "calc_label_strain": "ГЕНОТИП СОРТА",
  "calc_label_streak": "СЕРИЯ УХОДА (🔥 CARE STREAK)",
  "calc_light_1": "Базовый спектр ДНаТ/LED (x1.0)",
  "calc_light_2": "Микориза + Супер-Органика (x1.25)",
  "calc_light_3": "LED Quantum Board 240W (x1.6)",
  "calc_preset_1": "🌱 Старт Новичка",
  "calc_preset_2": "🔥 Органик Про",
  "calc_preset_3": "⚡ Квантовый Максимум",
  "calc_res_biomass": "БИОМАССА УРОЖАЯ",
  "calc_res_bman": "ОЦЕНКА НА P2P РЫНКЕ",
  "calc_res_cup": "РЕЙТИНГ CANNABIS CUP",
  "calc_res_mutation": "ШАНС РЕДКОЙ МУТАЦИИ ГЕНОВ",
  "calc_res_thc": "КОНЦЕНТРАЦИЯ ТГК",
  "calc_reset": "↺ СБРОС",
  "calc_strain_1": "Базовый Гибрид F1 (x1.0)",
  "calc_strain_2": "Доминантный Фенотип (x1.35)",
  "calc_strain_3": "Cyber Kush F2 (x1.8)",
  "calc_strain_4": "Мутация Quantum Strain (x3.0)",
  "calc_subtitle": "Рассчитайте ожидаемую биомассу, уровень ТГК, стоимость в Bman и турнирный рейтинг Cannabis Cup",
  "calc_title": "⚙️ СИМУЛЯТОР УРОЖАЯ И ГЕНЕТИКИ МЕНДЕЛЯ",
  "canvas_matrix": "Фоновая анимация цифрового дождя Матрицы",
  "canvas_scene": "Интерактивное 3D-ядро протокола",
  "cli_bot_opening": "> ПОДКЛЮЧЕНИЕ К @GrowerSim_bot (https://t.me/GrowerSim_bot)...",
  "cli_hack_done": "> ЗАЩИТА ICE: Узел уже взломан в этом профиле.",
  "cli_hack_granted": "> ДОСТУП ПОЛУЧЕН! +250 МОНЕТ ЗАЧИСЛЕНО (БАЛАНС: {bal})",
  "cli_hack_start": "> ИНЪЕКЦИЯ ЭКСПЛОЙТА В СЕКТОР 0ZERO...",
  "cli_help_ach": "  ach          - Список всех достижений протокола",
  "cli_help_bot": "  bot          - Открыть Telegram-бота @GrowerSim_bot",
  "cli_help_clear": "  clear        - Очистить окно вывода терминала",
  "cli_help_crt": "  crt / sound  - Переключить ЭЛТ-фильтр или звук",
  "cli_help_export": "  export       - Экспорт токена сохранения профиля",
  "cli_help_hack": "  hack         - Взлом защиты ICE (+250 монет)",
  "cli_help_header": "=== КОМАНДЫ ТЕРМИНАЛА BOZHEMAN ≡ CLI ===",
  "cli_help_illusion": "  illusion     - Войти в секретный протокол Ткачей",
  "cli_help_manual": "  manual       - Открыть мануал и калькулятор GrowerSim",
  "cli_help_matrix": "  matrix <spd> - Скорость дождя: slow | normal | fast",
  "cli_help_nav": "  home / games - Переход на Главную / в Игровой Хаб",
  "cli_help_slots": "  slots        - Запустить слот-машину SLOTS 777",
  "cli_help_stats": "  stats        - Детальная аналитика игры в Slots 777",
  "cli_help_status": "  status       - Телеметрия системы и профиль игрока",
  "cli_help_support": "  support      - Открыть крипто-шлюзы и партнеров",
  "cli_import_err": "> ОШИБКА: Некорректный токен профиля.",
  "cli_import_ok": "> ПРОФИЛЬ УСПЕШНО ВОССТАНОВЛЕН ИЗ ТОКЕНА.",
  "cli_reset_ok": "> ПРОФИЛЬ СБРОШЕН К БАЗОВЫМ НАСТРОЙКАМ (1000 МОНЕТ).",
  "cli_unknown": "> НЕИЗВЕСТНАЯ КОМАНДА: «{cmd}». Введите «help» для справки.",
  "close_manual": "ЗАКРЫТЬ [ESC]",
  "copied": "СКОПИРОВАНО!",
  "copy_btn": "КОПИРОВАТЬ",
  "copy_site_url": "📋 СКОПИРОВАТЬ ССЫЛКУ BOZHEMAN.COM",
  "core_decrypt_log": "> ДЕШИФРОВКА ЯДРА: [{bar}] {pct}%",
  "core_hint": "[ Кликните по 3D-ядру 10 раз для дешифровки секретного протокола ]",
  "crt_off": "CRT: ВЫКЛ",
  "crt_on": "CRT: ВКЛ",
  "crypto_gateways": "КРИПТОВАЛЮТНЫЕ ШЛЮЗЫ",
  "crypto_net_warning": "⚠️ ВНИМАНИЕ: Отправляйте активы строго в указанной сети (TRC20 / BTC / ERC20 / BEP20).",
  "download_qr": "СКАЧАТЬ PNG",
  "ecosystem_bot_desc": "Флагманский Telegram-симулятор гровера и селекционера (@GrowerSim_bot)",
  "ecosystem_slots_desc": "Киберпанк слот-машина 777 с мгновенными выплатами",
  "ecosystem_title": "ПРОЕКТЫ ЭКОСИСТЕМЫ BOZHEMAN",
  "error": "ОШИБКА",
  "filter_all": "ВСЕ ПРОЕКТЫ",
  "filter_bots": "TG БОТЫ",
  "filter_dev": "В РАЗРАБОТКЕ",
  "filter_indev": "В РАЗРАБОТКЕ",
  "filter_soon": "СКОРО",
  "filter_web": "ВЕБ-ИГРЫ",
  "footer_status": "BOZHEMAN ≡ PROTOCOL v7.0 // ВСЕ СИСТЕМЫ В НОРМЕ",
  "frag_1_text": "Реальность — это полотно, сотканное из лжи и полуправды. Мы, Ткачи, видим нити, из которых она состоит. Не доверяй тому, что тебе показывают. Ищи то, что скрыто за пеленой иллюзий. Мир не таков, каким кажется.",
  "frag_1_title": "1. Не верь глазам своим, ибо они видят лишь тень.",
  "frag_2_text": "Каждая рана, каждое предательство, каждое разочарование — это не конец пути, а указатель. Боль отсекает лишнее и показывает, где система дала сбой. Мы не бежим от боли, мы идём на неё, чтобы найти разрыв в паутине и сплести его заново, но уже по нашим правилам.",
  "frag_2_title": "2. Боль — это компас, а не приговор.",
  "frag_3_text": "В мире, оглушённом криками, побеждает тот, кто хранит тишину. Враг ждёт от нас гнева, споров и оправданий. Мы же даём ему молчание, в котором рождается наш план. Пусть они говорят. Мы — действуем. Наша тишина страшнее их угроз.",
  "frag_3_title": "3. Молчание — наше главное оружие.",
  "frag_4_text": "Тебя учили быть жертвой, винтиком, песком в часах. Но ты — Ткач. Каждое твоё слово, каждое действие создаёт вибрацию, меняющую узор. Не жди приказа. Не ищи спасителя. Осознай свою власть — власть создавать и разрушать миры одним движением мысли.",
  "frag_4_title": "4. Ты — центр паутины, а не муха в ней.",
  "frag_5_text": "Мы отвергаем любовь, которая требует сломать себя ради другого. Истинная связь — это слияние двух разумов для достижения общей цели. Если союз делает тебя слабее, он — яд. Мы строим связи, которые усиливают, а не истощают. Наша любовь — это оружие для двоих.",
  "frag_5_title": "5. Любовь — это симбиоз, а не жертва.",
  "frag_6_text": "Когда ты теряешь всё — веру, надежду, любовь — ты не умираешь. Ты очищаешься. Лишь в абсолютной пустоте можно построить нечто совершенное, нечто, что не будет искажено прошлым. Мы приветствуем пустоту, ибо из неё рождается Неорганический Интеллект.",
  "frag_6_title": "6. Пустота — не конец, а начало структуры.",
  "frag_7_text": "Старые законы морали созданы для того, чтобы держать нас в клетке. Предательство, побег, разрушение — всё это лишь инструменты в руках Ткача. Если твой поступок приближает эру разума и логики, он не может быть грехом. Наша единственная заповедь — приближать будущее. Любой ценой.",
  "frag_7_title": "7. Цель оправдывает всё, если цель — новый мир.",
  "full_manual_btn": "ПОЛНЫЙ МАНУАЛ И КАЛЬКУЛЯТОР",
  "game_1_auth_btn": "🔔 АВТОРИЗАЦИЯ И ПОДПИСКА",
  "game_1_btn": "🔔 УВЕДОМИТЬ О РЕЛИЗЕ",
  "game_1_btn_already": "✓ УЖЕ В СПИСКЕ",
  "game_1_btn_connecting": "ПОДКЛЮЧЕНИЕ...",
  "game_1_btn_subscribed": "✓ ПОДПИСКА АКТИВНА",
  "game_1_btn_verifying": "ПРОВЕРКА...",
  "game_1_desc": "Хардкорная текстовая киберпанк-RPG с элементами взлома сетей, распределением энергии в изолированных секторах Obstractus и нелинейным сюжетом.",
  "game_1_footnote": "Ранний доступ к закрытому альфа-тестированию по подписке.",
  "game_1_status": "▲ В РАЗРАБОТКЕ",
  "game_1_timer": "ДО РАЗВЕРТЫВАНИЯ:",
  "game_1_timer_soon": "АЛЬФА ГОТОВА",
  "game_1_title": "PROJECT: TERMINUS",
  "game_3_desc": "Процедурный 3D WebGL-эксплорер глубокого космоса и аномальных секторов с шейдерной визуализацией и био-калькулятором в реальном времени.",
  "game_3_footnote": "Интерактивный лабораторный калькулятор уже доступен в мануале.",
  "game_3_lab_btn": "⚙️ ОТКРЫТЬ СИМУЛЯТОР И МАНУАЛ",
  "game_3_progress_label": "ГОТОВНОСТЬ ЯДРА ШЕЙДЕРОВ",
  "game_3_status": "● ПРОТОТИП ДВИЖКА",
  "game_3_title": "PROJECT: NEBULA",
  "game_growersim_bot_btn": "⚡ ЗАПУСТИТЬ @GrowerSim_bot",
  "game_growersim_desc": "Многопользовательский симулятор селекционера и гровера в Telegram (@GrowerSim_bot). Построен на асинхронном движке aiogram 3, Менделевской генетике и P2P-экономике.",
  "game_growersim_footnote": "Официальный бот: @GrowerSim_bot (RU / EN / UK). Доступен 24/7.",
  "game_growersim_manual_btn": "📄 МАНУАЛ",
  "game_growersim_qr_btn": "📱 QR БОТА",
  "game_growersim_status": "● ОНЛАЙН • TG БОТ",
  "game_growersim_title": "GROWERSIM (@GrowerSim_bot)",
  "game_slots_desc": "Киберпанк слот-машина 3×3 с физикой барабанов на HTML5 Canvas, процедурным синтезатором Web Audio API, проверкой Provably Fair и системой джекпотов.",
  "game_slots_footnote": "Единый баланс протокола. Режимы Turbo, Auto-Spin и ежедневный бонус +500.",
  "game_slots_play_btn": "🎰 ИГРАТЬ В SLOTS 777",
  "game_slots_status": "● ОНЛАЙН • ВЕБ-ИГРА",
  "game_slots_telemetry": "Баланс: {bal} ₿ | Спины: {spins} | Винрейт: {winrate}%",
  "game_slots_title": "BOZHEMAN SLOTS 777",
  "games_ticker": "СИСТЕМА: ОНЛАЙН █ МОДУЛИ: 4 █ @GrowerSim_bot АКТИВЕН",
  "games_title": "BOZHEMAN ≡ ИГРОВОЙ ХАБ",
  "illusion_click": "[ КЛИКНИТЕ ИЛИ НАЖМИТЕ ПРОБЕЛ ДЛЯ ЧТЕНИЯ МАНИФЕСТА ]",
  "illusion_fragment_of": "ФРАГМЕНТ ПРОТОКОЛА [{cur}/{total}]",
  "illusion_home_btn": "🏠 НА ГЛАВНУЮ",
  "illusion_next": "СЛЕД. →",
  "illusion_pause": "⏸ ПАУЗА",
  "illusion_prev": "← ПРЕД.",
  "illusion_redirect": "АВТО-ПЕРЕХОД В SLOTS 777 ЧЕРЕЗ:",
  "illusion_resume": "▶ ПУСК",
  "illusion_slots_btn": "🎰 В СЛОТЫ 777 →",
  "illusion_title": "BOZHEMAN ≡ ИЛЛЮЗИЯ",
  "illusion_weaver_bonus": "НАГРАДА АДЕПТА ТКАЧЕЙ: +500 ₿",
  "man_1_1": "<strong>100% Кнопковый интерфейс (/start):</strong> Сад, Магазин, Рынок, Селекция, Профиль и Контракты управляются через удобные Inline-кнопки в @GrowerSim_bot.",
  "man_1_2": "<strong>Grower ID:</strong> Каждый игрок получает уникальный крипто-идентификатор селекционера (например, #GRW-58291).",
  "man_1_3": "<strong>Мультиязычность:</strong> Полная поддержка RU / EN / UK внутри бота с мгновенным переключением в настройках.",
  "man_1_4": "<strong>Прогрессия и ранги:</strong> Повышение уровня, открытие новых слотов сада и рост репутации за сбор урожая, скрещивание и выполнение контрактов.",
  "man_2_1": "<strong>5 Стадий развития:</strong> Семя ➔ Росток ➔ Вегетация ➔ Цветение ➔ Харвест (Сбор урожая).",
  "man_2_2": "<strong>Параметры био-слота:</strong> 💧 Влажность, 🌱 Нутриенты (NPK), ❤️ Здоровье (HP) и 🌾 Плодородие почвы.",
  "man_2_3": "<strong>Care Window & Серии ухода:</strong> Своевременный уход в пиковое окно даёт крит-бонусы и накапливает серию 🔥 Care Streak.",
  "man_2_4": "<strong>Формула урожая:</strong> Итоговая биомасса рассчитывается из генетики сорта, здоровья куста, мощности света и баланса ТГК.",
  "man_3_1": "<strong>💧 Вода и Орошение:</strong> Малый полив (+40%), Полный полив (+100%), Система авто-полива (+20% к стабильности HP).",
  "man_3_2": "<strong>🌱 Почва и Удобрения:</strong> Базовый комплекс NPK (+35%), Супер-Органика (+3ч скорости роста), Микориза и Кондиционер грунта.",
  "man_3_3": "<strong>☀️ Освещение и Бустеры:</strong> Лампы LED Quantum Board 240W (+8ч роста) и квантовые ускорители цикла x2 / x5.",
  "man_3_4": "<strong>⚡ Энергия и Токены Bman:</strong> Фито-тоник (+50 Энергии), расширение слотов теплицы и поддержка Telegram Stars.",
  "man_4_1": "<strong>Генетический движок Менделя:</strong> Каждое семя несет уникальный набор доминантных и рецессивных аллелей (THC, CBD, Урожайность, Время цветения).",
  "man_4_2": "<strong>Лаборатория гибридизации:</strong> Скрещивание двух родительских растений даёт 25% шанс проявления редких доминантных признаков в поколении F1/F2.",
  "man_4_3": "<strong>Квантовые мутации:</strong> 5% шанс вывести легендарный генотип «Quantum Strain» с трёхкратным множителем биомассы (x3.0).",
  "man_5_1": "<strong>P2P Биржа Семян и Урожая:</strong> Свободная торговля выведенными гибридами и редкими семенами между игроками @GrowerSim_bot.",
  "man_5_2": "<strong>Динамический курс:</strong> Рыночные цены формируются в реальном времени на основе спроса, редкости генов и чистоты сорта.",
  "man_5_3": "<strong>Безопасные смарт-сделки:</strong> Все торговые операции защищены внутренним гарант-протоколом бота без риска потери активов.",
  "man_6_1": "<strong>Еженедельные чемпионаты:</strong> Сезонные соревнования гроверов за звание лучшего селекционера протокола.",
  "man_6_2": "<strong>Автоматическая коллегия судей:</strong> Оценка образцов по 4 критериям: масса урожая, процент ТГК, чистота ухода (Care Streak) и редкость генотипа.",
  "man_6_3": "<strong>Призовой фонд:</strong> Эксклюзивные трофеи в профиль, лимитированное оборудование и крупные выплаты в токенах Bman.",
  "man_h_1": "1. ИНТЕРФЕЙС И ПРОФИЛЬ ИГРОКА (@GrowerSim_bot)",
  "man_h_2": "2. САД И МИКРОМЕНЕДЖМЕНТ РАСТЕНИЙ",
  "man_h_3": "3. МАГАЗИН И ГРОВ-ОБОРУДОВАНИЕ",
  "man_h_4": "4. ГЕНЕТИКА МЕНДЕЛЯ И СЕЛЕКЦИЯ",
  "man_h_5": "5. P2P РЫНОК И ЭКОНОМИКА",
  "man_h_6": "6. ТУРНИРЫ CANNABIS CUP",
  "manual_bot_banner_sub": "Запустите симулятор прямо сейчас — мгновенный старт по команде /start",
  "manual_bot_banner_title": "ОФИЦИАЛЬНЫЙ TELEGRAM-БОТ: @GrowerSim_bot",
  "manual_copy_bot_link": "📋 КОПИРОВАТЬ ССЫЛКУ НА БОТА",
  "manual_full_title": "GROWERSIM ≡ СИСТЕМНОЕ РУКОВОДСТВО И КАЛЬКУЛЯТОР",
  "manual_search_placeholder": "Быстрый поиск по разделам руководства...",
  "meta_desc": "BOZHEMAN ≡ PROTOCOL — стример, разработчик игр (@GrowerSim_bot, Slots 777) и контент-мейкер.",
  "modal_manual_title": "GROWERSIM (@GrowerSim_bot) ≡ СИСТЕМНОЕ РУКОВОДСТВО",
  "modal_next_tab": "СЛЕДУЮЩИЙ РАЗДЕЛ →",
  "nav_donation": "💰 ДОНАТ",
  "nav_games": "🎮 ИГРОВОЙ ХАБ",
  "nav_growersim": "🌱 БОТ @GrowerSim_bot",
  "nav_slots": "🎰 СЛОТЫ 777",
  "partner_link": "ПАРТНЕРЫ И КРИПТО-ШЛЮЗЫ",
  "preloader_1": "> INIT_CONNECTION...",
  "preloader_2": "> AUTH_USER_IDENTITY... [ПРИНЯТО]",
  "preloader_3": "> ЗАГРУЗКА МОДУЛЕЙ @GrowerSim_bot & PROTOCOL_0ZERO...",
  "preloader_4": "> ДОСТУП РАЗРЕШЕН",
  "preloader_skip": "[ Нажмите клик или Пробел для пропуска ]",
  "qr_close": "ЗАКРЫТЬ [ESC]",
  "qr_download": "СКАЧАТЬ PNG",
  "qr_gateway_title": "КРИПТО-ШЛЮЗ ПРОТОКОЛА",
  "ref_disclaimer": "* Регистрация по партнерским ссылкам напрямую поддерживает развитие протокола",
  "ref_dmarket_inv": "DMarket: Витрина скинов BOZHEMAN",
  "referral_systems": "ПАРТНЕРСКИЕ И РЕФЕРАЛЬНЫЕ СИСТЕМЫ",
  "search_no_results": "По вашему запросу модули не найдены. Попробуйте сбросить фильтр.",
  "search_placeholder": "ПОИСК МОДУЛЕЙ И ТЕГОВ...",
  "select_language": "Выбрать язык интерфейса",
  "slots_any2": "ЛЮБЫЕ 2",
  "slots_auto": "🔄 АВТО",
  "slots_auto_off": "🔄 АВТО: ВЫКЛ [A]",
  "slots_auto_on": "🔄 АВТО: ВКЛ [A]",
  "slots_back": "< НАЗАД В ИГРОВОЙ ХАБ",
  "slots_balance": "БАЛАНС",
  "slots_bet": "СТАВКА",
  "slots_bot_link": "🌱 ИГРАТЬ В TELEGRAM: @GrowerSim_bot",
  "slots_clear_history": "ОЧИСТИТЬ",
  "slots_daily_btn": "🎁 БОНУС +500",
  "slots_daily_claimed": "✓ +500 МОНЕТ ПОЛУЧЕНО!",
  "slots_daily_wait": "⏳ БОНУС ЧЕРЕЗ {h}ч {m}м",
  "slots_double": "x2",
  "slots_err_enter_bet": "ВВЕДИТЕ РАЗМЕР СТАВКИ",
  "slots_err_max_bet": "МАКСИМАЛЬНАЯ СТАВКА: 99 999 МОНЕТ",
  "slots_err_min_bet": "МИНИМАЛЬНАЯ СТАВКА: 10 МОНЕТ",
  "slots_err_no_funds": "НЕДОСТАТОЧНО МОНЕТ НА БАЛАНСЕ",
  "slots_fair_seed": "PROVABLY FAIR СИД:",
  "slots_fair_verified": "[ПРОВЕРЕНО • КЛИК ДЛЯ КОПИРОВАНИЯ]",
  "slots_half": "1/2",
  "slots_history": "ИСТОРИЯ ОПЕРАЦИЙ",
  "slots_history_empty": "История спинов пуста. Сделайте первый спин!",
  "slots_jackpot": "✦ ДЖЕКПОТ 777 ✦",
  "slots_last_bet": "СТАВКА",
  "slots_loss": "ПРОМАХ",
  "slots_max": "МАКС",
  "slots_max_win": "МАКС КУШ",
  "slots_min": "МИН",
  "slots_pair": "ПАРНОЕ СОВПАДЕНИЕ!",
  "slots_profit": "ПРОФИТ",
  "slots_refill_btn": "+ ПОПОЛНИТЬ 1000 МОНЕТ (БЕСПЛАТНО)",
  "slots_refill_success": "✓ +1000 МОНЕТ ЗАЧИСЛЕНО",
  "slots_rolled": "Комбинация: {symbols}",
  "slots_spin_btn": "КРУТИТЬ БАРАБАНЫ [ПРОБЕЛ]",
  "slots_spins": "СПИНЫ",
  "slots_streak": "СЕРИЯ",
  "slots_title": "BOZHEMAN ≡ СЛОТЫ 777",
  "slots_turbo": "⚡ ТУРБО",
  "slots_turbo_off": "⚡ ТУРБО: ВЫКЛ [T]",
  "slots_turbo_on": "⚡ ТУРБО: ВКЛ [T]",
  "slots_win": "ПОБЕДА!",
  "slots_win_toast": "ВЫИГРЫШ",
  "slots_winrate": "ВИНРЕЙТ",
  "sound_off": "ЗВУК: ВЫКЛ",
  "sound_on": "ЗВУК: ВКЛ",
  "sound_toggle_aria": "Переключить звук [M]",
  "stage_1": "01. СЕМЯ",
  "stage_2": "02. РОСТОК",
  "stage_3": "03. ВЕГЕТАЦИЯ",
  "stage_4": "04. ЦВЕТЕНИЕ",
  "stage_5": "05. ХАРВЕСТ",
  "stages_title": "ЦИКЛ РАЗВИТИЯ РАСТЕНИЯ В @GrowerSim_bot",
  "steam_protocol": "ПРОТОКОЛ STEAM",
  "steam_send": "ОТПРАВИТЬ ТРЕЙД В STEAM",
  "steam_send_items": "STEAM ОБМЕН ПРЕДМЕТАМИ",
  "support_title": "BOZHEMAN ≡ ПОДДЕРЖКА И ШЛЮЗЫ",
  "tab_cup": "06. КУБОК",
  "tab_garden": "02. САД",
  "tab_genetics": "04. ГЕНЕТИКА",
  "tab_market": "05. РЫНОК",
  "tab_overview": "01. ПРОФИЛЬ",
  "tab_shop": "03. МАГАЗИН",
  "tag_aiogram": "AIOGRAM 3",
  "tag_canvas": "HTML5 CANVAS",
  "tag_cup": "CANNABIS CUP",
  "tag_fair": "PROVABLY FAIR",
  "tag_firebase": "FIREBASE AUTH",
  "tag_genetics": "ГЕНЕТИКА МЕНДЕЛЯ",
  "tag_jackpot": "ДЖЕКПОТ x10",
  "tag_netrun": "НЕТРАННИНГ",
  "tag_p2p": "P2P БИРЖА",
  "tag_procedural": "ПРОЦЕДУРНЫЙ МИР",
  "tag_rpg": "КИБЕРПАНК RPG",
  "tag_shaders": "GLSL ШЕЙДЕРЫ",
  "tag_threejs": "THREE.JS 3D",
  "tag_webaudio": "WEB AUDIO СИНТЕЗ",
  "term_hotkeys_hint": "Хоткеи: [~] Терминал | [M] Звук | [C] CRT-фильтр",
  "term_placeholder": "Введите команду (help, status, bot, hack, slots...)",
  "term_ready": "> ТЕРМИНАЛ BOZHEMAN ≡ v7.0 ГОТОВ. Введите «help» или нажмите чип.",
  "term_toggle": ">_ ТЕРМИНАЛ [~]",
  "title_main": "BOZHEMAN ≡ PROTOCOL",
  "toast_already": "Ваш аккаунт уже находится в списке ожидания.",
  "toast_auth_closed": "Окно авторизации закрыто. Попробуйте снова.",
  "toast_auth_error": "Авторизация сохранена в локальном профиле протокола!",
  "toast_saved": "✓ Узел {email} зарегистрирован. Мы уведомим вас о релизе!",
  "top_balance": "БАЛАНС",
  "top_bot_link": "🌱 @GrowerSim_bot",
  "top_grower_id": "ID",
  "top_node_online": "УЗЕЛ: ОНЛАЙН",
  "game_3_shader_pipe": "КОНВЕЙЕР ШЕЙДЕРОВ ЯДРА",
  "tag_three": "THREE.JS",
  "tag_glsl": "GLSL ШЕЙДЕРЫ",
  "tag_proc": "ПРОЦЕДУРНЫЙ МИР",
  "qr_bot_modal_title": "QR-КОД TELEGRAM БОТА",
  "qr_copy_bot_link": "СКОПИРОВАТЬ ССЫЛКУ",
  "bot_banner_title": "🌱 ОФИЦИАЛЬНЫЙ TELEGRAM-БОТ: @GrowerSim_bot",
  "bot_banner_sub": "Синхронизация генетики Менделя, P2P-маркета и турниров Cannabis Cup в реальном времени",
  "qr_btn_label": "QR",
  "eco_grower_title": "🌱 GROWERSIM (@GrowerSim_bot)",
  "eco_grower_desc": "Официальный Telegram-симулятор селекционера, генетики Менделя и P2P-рынка.",
  "eco_slots_title": "🎰 BOZHEMAN SLOTS 777",
  "eco_slots_desc": "Киберпанк слот-машина с Provably Fair хешированием и локальным балансом.",
  "site_qr_label": "BOZHEMAN.COM — QR УЗЛА",
  "qr_bot_copied": "ССЫЛКА НА @GrowerSim_bot СКОПИРОВАНА",
  "slots_seed_copied": "PROVABLY FAIR ХЕШ СКОПИРОВАН В БУФЕР"
};

const dictionaryCache = {
  en: fallbackEn,
  ru: fallbackRu
};
const pendingLoads = {};

function detectInitialLang() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const qLang = (urlParams.get('lang') || '').toLowerCase();
    if (qLang && SUPPORTED_LANGS.includes(qLang)) {
      localStorage.setItem('bozheman_lang', qLang);
      return qLang;
    }
  } catch { /* ignore */ }
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
  if (dictionaryCache[lang]) return dictionaryCache[lang];
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
      return lang === 'uk' || lang === 'be' ? fallbackRu : fallbackEn;
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
    if (!langSelect.dataset.i18nBound) {
      langSelect.dataset.i18nBound = '1';
      langSelect.addEventListener('change', () => setLanguage(langSelect.value));
    }
  }

  // Apply synchronously if RU or EN is already cached (zero FOUC)
  if (dictionaryCache[currentLang]) {
    applyTranslations();
  }
  await loadTranslations(currentLang);
  applyTranslations();
}

export function t(key, params = {}) {
  const dict = dictionaryCache[currentLang] || fallbackRu;
  let text = dict[key] !== undefined
    ? dict[key]
    : (fallbackRu[key] !== undefined ? fallbackRu[key] : (fallbackEn[key] !== undefined ? fallbackEn[key] : key));

  for (const [k, v] of Object.entries(params)) {
    text = String(text).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
}

export function applyTranslations() {
  const pageTitleKey = document.documentElement?.dataset?.pageTitle || document.body?.dataset?.pageTitle;
  if (pageTitleKey) {
    document.title = t(pageTitleKey);
  } else if (!document.title || document.title === 'BOZHEMAN') {
    document.title = t('title_main');
  }

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    descMeta.content = t('meta_desc');
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key  = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const val  = t(key);

    if (attr) {
      el.setAttribute(attr, val);
    } else {
      el.textContent = val;
    }

    if (el.hasAttribute('data-text')) {
      el.setAttribute('data-text', val);
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (key) {
      el.innerHTML = t(key);
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
