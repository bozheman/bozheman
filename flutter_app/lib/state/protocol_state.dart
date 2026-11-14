import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import '../l10n/i18n.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';

class AchievementDef {
  final String id;
  final String icon;
  final String titleKey;
  final String descKey;

  const AchievementDef({
    required this.id,
    required this.icon,
    required this.titleKey,
    required this.descKey,
  });
}

class SpinHistoryItem {
  final String glyphs;
  final int bet;
  final int won;
  final double mult;
  final String time;

  const SpinHistoryItem({
    required this.glyphs,
    required this.bet,
    required this.won,
    required this.mult,
    required this.time,
  });

  Map<String, dynamic> toJson() => {
        'glyphs': glyphs,
        'bet': bet,
        'wagered': bet,
        'won': won,
        'mult': mult,
        'time': time,
      };

  factory SpinHistoryItem.fromJson(Map<String, dynamic> json) {
    return SpinHistoryItem(
      glyphs: (json['glyphs'] ?? '').toString(),
      bet: (json['bet'] ?? json['wagered'] ?? 10) as int,
      won: (json['won'] ?? 0) as int,
      mult: ((json['mult'] ?? 0) as num).toDouble(),
      time: (json['time'] ?? '').toString(),
    );
  }
}

class TerminalLogEntry {
  final String text;
  final String type; // sys | highlight | err | warn

  const TerminalLogEntry(this.text, [this.type = 'sys']);
}

class ProtocolState extends ChangeNotifier {
  static const String _storageKey = 'bzp_state_v2';
  static const String _langStorageKey = 'bzp_lang';
  static const int maxSafe = 999999999;

  static const List<AchievementDef> achievementsCatalog = [
    AchievementDef(id: 'FIRST_CONTACT', icon: '⚡', titleKey: 'ach_first_title', descKey: 'ach_first_desc'),
    AchievementDef(id: 'CORE_BREAKER', icon: '🔓', titleKey: 'ach_core_title', descKey: 'ach_core_desc'),
    AchievementDef(id: 'WEAVER_INITIATE', icon: '🕸️', titleKey: 'ach_weaver_title', descKey: 'ach_weaver_desc'),
    AchievementDef(id: 'HIGH_ROLLER', icon: '💎', titleKey: 'ach_roller_title', descKey: 'ach_roller_desc'),
    AchievementDef(id: 'JACKPOT_777', icon: '🎰', titleKey: 'ach_jackpot_title', descKey: 'ach_jackpot_desc'),
    AchievementDef(id: 'ICE_HACKER', icon: '💻', titleKey: 'ach_hacker_title', descKey: 'ach_hacker_desc'),
    AchievementDef(id: 'CRYPTO_PATRON', icon: '🪙', titleKey: 'ach_patron_title', descKey: 'ach_patron_desc'),
    AchievementDef(id: 'GROWER_SCHOLAR', icon: '🌱', titleKey: 'ach_scholar_title', descKey: 'ach_scholar_desc'),
  ];

  String growerId = '#GRW-58291';
  int balance = 1000;
  bool audioMuted = true;
  bool crtEnabled = true;
  bool secretUnlocked = false;
  bool turboSpin = false;
  int totalClicks3D = 0;
  int lastDailyBonus = 0;
  bool hackClaimed = false;
  bool weaverClaimed = false;
  bool scholarClaimed = false;
  Set<int> weaverRead = {};
  Set<String> achievements = {};
  String lang = 'ru';

  String calcStrain = '1.0';
  int calcHp = 95;
  int calcStreak = 7;
  String calcLight = '1.0';

  int spins = 0;
  int wins = 0;
  int totalWagered = 0;
  int totalWon = 0;
  int maxWin = 0;
  int currentStreak = 0;
  int bestStreak = 0;
  String lastBet = '10';
  String? lastSeed;
  List<SpinHistoryItem> history = [];

  final List<TerminalLogEntry> logs = [];
  AchievementDef? pendingToast;

  double get winrate => spins == 0 ? 0 : (wins / spins) * 100;

  Future<void> init() async {
    final savedLang = WebBridge.storageGet(_langStorageKey);
    lang = savedLang.isNotEmpty ? savedLang : 'ru';
    await I18n.loadLanguage(lang);

    _loadFromStorage();
    WebBridge.setCrt(crtEnabled);
    AudioService.muted = audioMuted;

    unlockAchievement('FIRST_CONTACT', silent: true);
    appendLog('> BOZHEMAN ≡ PROTOCOL v10.0 [GO + FLUTTER] READY.', 'highlight');
    notifyListeners();
  }

  void _loadFromStorage() {
    final raw = WebBridge.storageGet(_storageKey);
    if (raw.isEmpty) {
      growerId = _generateGrowerId();
      _persist();
      return;
    }
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final gid = (map['growerId'] ?? '').toString();
      growerId = RegExp(r'^#GRW-\d{5}$').hasMatch(gid) ? gid : _generateGrowerId();
      balance = _clampInt(map['balance'], 1000, 0, maxSafe);
      if (map['audioMuted'] is bool) audioMuted = map['audioMuted'] as bool;
      if (map['crtEnabled'] is bool) crtEnabled = map['crtEnabled'] as bool;
      if (map['secretUnlocked'] is bool) secretUnlocked = map['secretUnlocked'] as bool;
      if (map['turboSpin'] is bool) turboSpin = map['turboSpin'] as bool;
      totalClicks3D = _clampInt(map['totalClicks3D'], 0, 0, maxSafe);
      lastDailyBonus = _clampInt(map['lastDailyBonus'], 0, 0, maxSafe * 10000);
      if (map['hackClaimed'] is bool) hackClaimed = map['hackClaimed'] as bool;
      if (map['weaverClaimed'] is bool) weaverClaimed = map['weaverClaimed'] as bool;
      if (map['scholarClaimed'] is bool) scholarClaimed = map['scholarClaimed'] as bool;

      if (map['weaverRead'] is List) {
        weaverRead = (map['weaverRead'] as List)
            .whereType<int>()
            .where((i) => i >= 0 && i < 7)
            .toSet();
      }

      if (map['achievements'] is List) {
        final validIds = achievementsCatalog.map((e) => e.id).toSet();
        achievements = (map['achievements'] as List)
            .map((e) => e.toString())
            .where(validIds.contains)
            .toSet();
      }

      if (map['calcSettings'] is Map) {
        final cs = map['calcSettings'] as Map;
        calcStrain = (cs['strain'] ?? '1.0').toString();
        calcHp = _clampInt(cs['hp'], 95, 10, 100);
        calcStreak = _clampInt(cs['streak'], 7, 0, 30);
        calcLight = (cs['light'] ?? '1.0').toString();
      }

      if (map['rouletteStats'] is Map) {
        final rs = map['rouletteStats'] as Map;
        spins = _clampInt(rs['spins'], 0, 0, maxSafe);
        wins = _clampInt(rs['wins'], 0, 0, maxSafe);
        totalWagered = _clampInt(rs['totalWagered'], 0, 0, maxSafe);
        totalWon = _clampInt(rs['totalWon'], 0, 0, maxSafe);
        maxWin = _clampInt(rs['maxWin'], 0, 0, maxSafe);
        currentStreak = (rs['currentStreak'] is int) ? rs['currentStreak'] as int : 0;
        bestStreak = _clampInt(rs['bestStreak'], 0, 0, maxSafe);
      }

      if (map['lastBet'] != null) lastBet = map['lastBet'].toString();
      if (map['lastSeed'] != null) lastSeed = map['lastSeed'].toString();

      if (map['history'] is List) {
        history = (map['history'] as List)
            .whereType<Map<String, dynamic>>()
            .take(20)
            .map(SpinHistoryItem.fromJson)
            .toList();
      }
    } catch (_) {
      growerId = _generateGrowerId();
    }
  }

  void _persist() {
    final payload = {
      'growerId': growerId,
      'balance': balance,
      'audioMuted': audioMuted,
      'crtEnabled': crtEnabled,
      'secretUnlocked': secretUnlocked,
      'turboSpin': turboSpin,
      'totalClicks3D': totalClicks3D,
      'lastDailyBonus': lastDailyBonus,
      'hackClaimed': hackClaimed,
      'weaverClaimed': weaverClaimed,
      'scholarClaimed': scholarClaimed,
      'weaverRead': weaverRead.toList(),
      'achievements': achievements.toList(),
      'calcSettings': {
        'strain': calcStrain,
        'hp': calcHp,
        'streak': calcStreak,
        'light': calcLight,
      },
      'rouletteStats': {
        'spins': spins,
        'wins': wins,
        'totalWagered': totalWagered,
        'totalWon': totalWon,
        'maxWin': maxWin,
        'currentStreak': currentStreak,
        'bestStreak': bestStreak,
      },
      'lastBet': lastBet,
      'lastSeed': lastSeed,
      'history': history.map((h) => h.toJson()).toList(),
    };
    WebBridge.storageSet(_storageKey, jsonEncode(payload));
  }

  Future<void> setLanguage(String newLang) async {
    lang = newLang;
    WebBridge.storageSet(_langStorageKey, newLang);
    await I18n.loadLanguage(newLang);
    AudioService.click();
    notifyListeners();
  }

  void toggleCrt() {
    crtEnabled = !crtEnabled;
    WebBridge.setCrt(crtEnabled);
    AudioService.click();
    _persist();
    notifyListeners();
  }

  void toggleMute() {
    audioMuted = !audioMuted;
    AudioService.muted = audioMuted;
    if (!audioMuted) {
      AudioService.click();
    }
    _persist();
    notifyListeners();
  }

  void toggleTurbo() {
    turboSpin = !turboSpin;
    AudioService.click();
    _persist();
    notifyListeners();
  }

  void adjustBalance(int delta) {
    balance = (balance + delta).clamp(0, maxSafe);
    _persist();
    notifyListeners();
  }

  void recordSpin({
    required String glyphs,
    required int bet,
    required int won,
    required double mult,
    required String seedHash,
  }) {
    spins += 1;
    totalWagered += bet;
    lastBet = bet.toString();
    lastSeed = seedHash;

    if (won > 0) {
      wins += 1;
      totalWon += won;
      if (won > maxWin) maxWin = won;
      currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
    }

    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    history.insert(
      0,
      SpinHistoryItem(
        glyphs: glyphs,
        bet: bet,
        won: won,
        mult: mult,
        time: timeStr,
      ),
    );
    if (history.length > 20) history = history.sublist(0, 20);

    if (bet >= 1000) {
      unlockAchievement('HIGH_ROLLER');
    }
    if (mult >= 10.0) {
      unlockAchievement('JACKPOT_777');
    }

    _persist();
    notifyListeners();
  }

  void clearHistory() {
    history.clear();
    _persist();
    notifyListeners();
  }

  bool canClaimDaily() {
    final now = DateTime.now().millisecondsSinceEpoch;
    return now - lastDailyBonus >= 24 * 60 * 60 * 1000;
  }

  Duration remainingDailyWait() {
    final now = DateTime.now().millisecondsSinceEpoch;
    final remMs = (24 * 60 * 60 * 1000) - (now - lastDailyBonus);
    return Duration(milliseconds: remMs > 0 ? remMs : 0);
  }

  bool claimDailyBonus() {
    if (!canClaimDaily()) return false;
    lastDailyBonus = DateTime.now().millisecondsSinceEpoch;
    balance = (balance + 500).clamp(0, maxSafe);
    AudioService.win();
    appendLog('> DAILY BONUS: +500 ₿ (BAL: $balance)', 'highlight');
    _persist();
    notifyListeners();
    return true;
  }

  void refillFreeCoins() {
    if (balance >= 10) return;
    balance += 1000;
    AudioService.win();
    appendLog('> FREE-TO-PLAY REFILL: +1000 ₿ (BAL: $balance)', 'highlight');
    _persist();
    notifyListeners();
  }

  void saveHarvestCalc({
    required String strain,
    required int hp,
    required int streak,
    required String light,
  }) {
    calcStrain = strain;
    calcHp = hp;
    calcStreak = streak;
    calcLight = light;
    unlockAchievement('GROWER_SCHOLAR');
    if (!scholarClaimed) {
      scholarClaimed = true;
      balance = (balance + 200).clamp(0, maxSafe);
      AudioService.win();
      appendLog('> GROWER_SCHOLAR: +200 ₿ (BAL: $balance)', 'highlight');
    }
    _persist();
    notifyListeners();
  }

  int registerCoreClick() {
    totalClicks3D += 1;
    AudioService.cyberPulse(totalClicks3D);
    if (totalClicks3D >= 10 && !secretUnlocked) {
      secretUnlocked = true;
      unlockAchievement('CORE_BREAKER');
    }
    _persist();
    notifyListeners();
    return totalClicks3D;
  }

  void markWeaverRead(int index) {
    if (index < 0 || index >= 7) return;
    weaverRead.add(index);
    if (weaverRead.length == 7) {
      unlockAchievement('WEAVER_INITIATE');
      if (!weaverClaimed) {
        weaverClaimed = true;
        balance = (balance + 500).clamp(0, maxSafe);
        AudioService.jackpot();
        appendLog('> WEAVER_INITIATE: +500 ₿ (BAL: $balance)', 'highlight');
      }
    }
    _persist();
    notifyListeners();
  }

  bool executeHackCommand() {
    if (hackClaimed) {
      appendLog(I18n.t('cli_hack_done'), 'warn');
      return false;
    }
    hackClaimed = true;
    balance = (balance + 250).clamp(0, maxSafe);
    unlockAchievement('ICE_HACKER');
    AudioService.win();
    appendLog(I18n.t('cli_hack_granted', {'bal': balance}), 'highlight');
    _persist();
    notifyListeners();
    return true;
  }

  void unlockAchievement(String id, {bool silent = false}) {
    if (achievements.contains(id)) return;
    final match = achievementsCatalog.where((a) => a.id == id);
    if (match.isEmpty) return;

    achievements.add(id);
    final def = match.first;
    if (!silent) {
      pendingToast = def;
      AudioService.achievement();
      appendLog('> ACHIEVEMENT: ${I18n.t(def.titleKey)}', 'highlight');
    }
    _persist();
    notifyListeners();
  }

  void dismissToast() {
    pendingToast = null;
    notifyListeners();
  }

  void resetProfile() {
    balance = 1000;
    spins = 0;
    wins = 0;
    totalWagered = 0;
    totalWon = 0;
    maxWin = 0;
    currentStreak = 0;
    bestStreak = 0;
    history.clear();
    totalClicks3D = 0;
    secretUnlocked = false;
    hackClaimed = false;
    weaverClaimed = false;
    scholarClaimed = false;
    weaverRead.clear();
    achievements.clear();
    achievements.add('FIRST_CONTACT');
    appendLog(I18n.t('cli_reset_ok'), 'warn');
    _persist();
    notifyListeners();
  }

  void appendLog(String text, [String type = 'sys']) {
    logs.add(TerminalLogEntry(text, type));
    if (logs.length > 80) {
      logs.removeAt(0);
    }
    notifyListeners();
  }

  void clearLogs() {
    logs.clear();
    notifyListeners();
  }

  static String _generateGrowerId() {
    final num = 10000 + Random().nextInt(89999);
    return '#GRW-$num';
  }

  static int _clampInt(dynamic val, int fallback, int min, int max) {
    if (val is int) return val.clamp(min, max);
    if (val is num) return val.toInt().clamp(min, max);
    if (val is String) {
      final parsed = int.tryParse(val);
      if (parsed != null) return parsed.clamp(min, max);
    }
    return fallback;
  }
}
