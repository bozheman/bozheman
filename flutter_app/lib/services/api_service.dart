import 'dart:convert';
import 'dart:math';
import 'web_bridge.dart';

class SlotSymbol {
  final String id;
  final String glyph;
  final int weight;
  final int colorHex;

  const SlotSymbol({
    required this.id,
    required this.glyph,
    required this.weight,
    required this.colorHex,
  });

  factory SlotSymbol.fromJson(Map<String, dynamic> json) {
    final id = (json['id'] ?? 'dash').toString();
    final matched = slotSymbols.where((s) => s.id == id);
    if (matched.isNotEmpty) return matched.first;
    return SlotSymbol(
      id: id,
      glyph: (json['glyph'] ?? '—').toString(),
      weight: (json['weight'] as int?) ?? 10,
      colorHex: 0xFFFF3333,
    );
  }
}

const List<SlotSymbol> slotSymbols = [
  SlotSymbol(id: 'seven', glyph: '7', weight: 4, colorHex: 0xFFFF3333),
  SlotSymbol(id: 'star', glyph: '★', weight: 7, colorHex: 0xFFE5B842),
  SlotSymbol(id: 'omega', glyph: 'Ω', weight: 9, colorHex: 0xFFFF4D4D),
  SlotSymbol(id: 'triangle', glyph: '▲', weight: 12, colorHex: 0xFFFF1A1A),
  SlotSymbol(id: 'square', glyph: '■', weight: 14, colorHex: 0xFFCC2222),
  SlotSymbol(id: 'dash', glyph: '—', weight: 18, colorHex: 0xFF662222),
];

class SpinOutcome {
  final List<SlotSymbol> reels;
  final int bet;
  final double multiplier;
  final int win;
  final String outcome;
  final String hash;
  final String shortHash;
  final bool fromGoServer;

  const SpinOutcome({
    required this.reels,
    required this.bet,
    required this.multiplier,
    required this.win,
    required this.outcome,
    required this.hash,
    required this.shortHash,
    required this.fromGoServer,
  });
}

class HarvestOutput {
  final int biomass;
  final double thc;
  final int cupScore;
  final int bmanValue;
  final double mutationChance;
  final bool fromGoServer;

  const HarvestOutput({
    required this.biomass,
    required this.thc,
    required this.cupScore,
    required this.bmanValue,
    required this.mutationChance,
    required this.fromGoServer,
  });
}

class GitSyncStatus {
  final bool online;
  final bool autoPullEnabled;
  final String branch;
  final String commit;
  final String lastSyncAt;
  final String lastResult;
  final String lastError;

  const GitSyncStatus({
    required this.online,
    required this.autoPullEnabled,
    required this.branch,
    required this.commit,
    required this.lastSyncAt,
    required this.lastResult,
    required this.lastError,
  });
}

class SocialEntry {
  final String id;
  final String label;
  final String? labelKey;
  final String category;
  final String url;
  final bool internal;

  const SocialEntry({
    required this.id,
    required this.label,
    this.labelKey,
    required this.category,
    required this.url,
    this.internal = false,
  });
}

class WalletEntry {
  final String symbol;
  final String network;
  final String address;
  final String iconPath;

  const WalletEntry({
    required this.symbol,
    required this.network,
    required this.address,
    required this.iconPath,
  });
}

class ApiService {
  ApiService._();

  static final Random _rng = Random.secure();

  static const List<SocialEntry> defaultSocials = [
    SocialEntry(id: 'twitch', label: 'Twitch', category: 'social', url: 'https://www.twitch.tv/Bozhemany'),
    SocialEntry(id: 'youtube', label: 'YouTube', category: 'social', url: 'https://www.youtube.com/channel/UC_BgtvZc1dxQbJA1uEeFimw'),
    SocialEntry(id: 'instagram', label: 'Instagram', category: 'social', url: 'https://www.instagram.com/bozheman'),
    SocialEntry(id: 'tiktok', label: 'TikTok', category: 'social', url: 'https://www.tiktok.com/@bozheman_'),
    SocialEntry(id: 'growersim', label: 'TG @GrowerSim_bot', labelKey: 'nav_growersim', category: 'bot', url: 'https://t.me/GrowerSim_bot'),
    SocialEntry(id: 'donation', label: 'Donate', labelKey: 'nav_donation', category: 'support', url: 'https://donatello.to/bozheman'),
    SocialEntry(id: 'games', label: 'Games Hub', labelKey: 'nav_games', category: 'hub', url: '/games', internal: true),
    SocialEntry(id: 'support', label: 'Crypto & Partners', labelKey: 'partner_link', category: 'support', url: '/support', internal: true),
  ];

  static const List<WalletEntry> defaultWallets = [
    WalletEntry(symbol: 'USDT', network: 'TRC20', address: 'TF2MHpNpfaYkhVd855mMfTgusfxG8N7hZa', iconPath: 'assets/images/USDT.jpg'),
    WalletEntry(symbol: 'BTC', network: 'BITCOIN', address: '125hh3cxk1PdgEcBf87H6jNdCfMCXK1vKH', iconPath: 'assets/images/BTC.jpg'),
    WalletEntry(symbol: 'ETH', network: 'ERC20', address: '0xe1b3651e583a2eefd0f813a530cb55fda141eed2', iconPath: 'assets/images/ETH.jpg'),
    WalletEntry(symbol: 'BNB', network: 'BEP20', address: '0xe1b3651e583a2eefd0f813a530cb55fda141eed2', iconPath: 'assets/images/BNB.jpg'),
  ];

  /// Executes a Free-to-Play Provably Fair spin via Go backend or local Dart fallback.
  static Future<SpinOutcome> spinSlots(int bet) async {
    try {
      final body = jsonEncode({
        'bet': bet,
        'clientSeed': _randomHex(8),
      });
      final raw = await WebBridge.fetchJson('/api/v1/slots/spin', method: 'POST', body: body);
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final rawReels = (data['reels'] as List).whereType<Map<String, dynamic>>().toList();
      final reels = rawReels.map(SlotSymbol.fromJson).toList();
      return SpinOutcome(
        reels: reels,
        bet: (data['bet'] as int?) ?? bet,
        multiplier: ((data['multiplier'] as num?) ?? 0).toDouble(),
        win: (data['win'] as int?) ?? 0,
        outcome: (data['outcome'] ?? 'loss').toString(),
        hash: (data['hash'] ?? '').toString(),
        shortHash: (data['shortHash'] ?? '').toString(),
        fromGoServer: true,
      );
    } catch (_) {
      return localSpin(bet);
    }
  }

  static SpinOutcome localSpin(int bet) {
    final pool = <SlotSymbol>[];
    for (final s in slotSymbols) {
      for (var i = 0; i < s.weight; i++) {
        pool.add(s);
      }
    }
    final r0 = pool[_rng.nextInt(pool.length)];
    final r1 = pool[_rng.nextInt(pool.length)];
    final r2 = pool[_rng.nextInt(pool.length)];

    double mult = 0;
    String outcome = 'loss';
    if (r0.id == r1.id && r1.id == r2.id) {
      const table = {
        'seven': 10.0,
        'star': 7.0,
        'omega': 5.0,
        'triangle': 3.0,
        'square': 2.0,
        'dash': 0.0,
      };
      mult = table[r0.id] ?? 0.0;
      outcome = mult == 0 ? 'loss' : (r0.id == 'seven' ? 'jackpot' : 'win');
    } else if ((r0.id == r1.id && r0.id != 'dash') ||
        (r1.id == r2.id && r1.id != 'dash') ||
        (r0.id == r2.id && r0.id != 'dash')) {
      mult = 1.5;
      outcome = 'pair';
    }

    final win = (bet * mult).round();
    final hash = _randomHex(32);
    final shortHash = 'LOCAL::${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}';
    return SpinOutcome(
      reels: [r0, r1, r2],
      bet: bet,
      multiplier: mult,
      win: win,
      outcome: outcome,
      hash: hash,
      shortHash: shortHash,
      fromGoServer: false,
    );
  }

  /// Calculates GrowerSim Mendel harvest metrics via Go API or local Dart math.
  static Future<HarvestOutput> calcHarvest({
    required double strainMult,
    required int hp,
    required int streak,
    required double lightMult,
  }) async {
    try {
      final body = jsonEncode({
        'strainMult': strainMult,
        'hp': hp,
        'streak': streak,
        'lightMult': lightMult,
      });
      final raw = await WebBridge.fetchJson('/api/v1/lab/calc', method: 'POST', body: body);
      final data = jsonDecode(raw) as Map<String, dynamic>;
      return HarvestOutput(
        biomass: (data['biomass'] as int?) ?? 0,
        thc: ((data['thc'] as num?) ?? 0).toDouble(),
        cupScore: (data['cupScore'] as int?) ?? 0,
        bmanValue: (data['bmanValue'] as int?) ?? 0,
        mutationChance: ((data['mutationChance'] as num?) ?? 0).toDouble(),
        fromGoServer: true,
      );
    } catch (_) {
      return localHarvest(
        strainMult: strainMult,
        hp: hp,
        streak: streak,
        lightMult: lightMult,
      );
    }
  }

  static HarvestOutput localHarvest({
    required double strainMult,
    required int hp,
    required int streak,
    required double lightMult,
  }) {
    const baseGrams = 85.0;
    final streakBonus = 1.0 + streak * 0.045;
    final biomass = (baseGrams * strainMult * (hp / 100.0) * streakBonus * lightMult).round();
    final thcRaw = 16.5 * pow(strainMult, 0.35) * (0.7 + 0.3 * (hp / 100.0)) + streak * 0.25;
    final thc = (thcRaw * 10).round() / 10.0;
    final cupScore = (biomass * 3.2 + thcRaw * 14.0 + streak * 18.0).round();
    final strainBonus = strainMult >= 3.0 ? 350.0 : strainMult * 65.0;
    final bmanValue = (biomass * 1.85 + strainBonus + streak * 12.0).round();
    final mutRaw = min(35.0, 5.0 + streak * 0.65 + (lightMult > 1.3 ? 4.5 : 1.0));
    final mutChance = (mutRaw * 10).round() / 10.0;

    return HarvestOutput(
      biomass: biomass,
      thc: thc,
      cupScore: cupScore,
      bmanValue: bmanValue,
      mutationChance: mutChance,
      fromGoServer: false,
    );
  }

  static Future<GitSyncStatus> fetchSyncStatus() async {
    try {
      final raw = await WebBridge.fetchJson('/api/v1/sync/status');
      final data = jsonDecode(raw) as Map<String, dynamic>;
      return GitSyncStatus(
        online: true,
        autoPullEnabled: (data['autoPullEnabled'] as bool?) ?? false,
        branch: (data['branch'] ?? 'main').toString(),
        commit: (data['commit'] ?? '—').toString(),
        lastSyncAt: (data['lastSyncAt'] ?? '').toString(),
        lastResult: (data['lastResult'] ?? '').toString(),
        lastError: (data['lastError'] ?? '').toString(),
      );
    } catch (_) {
      return const GitSyncStatus(
        online: false,
        autoPullEnabled: false,
        branch: 'static',
        commit: 'offline',
        lastSyncAt: '',
        lastResult: 'Static Hosting Mode',
        lastError: '',
      );
    }
  }

  static Future<GitSyncStatus> triggerGitHubPull() async {
    try {
      final raw = await WebBridge.fetchJson('/api/v1/sync', method: 'POST', body: '{}');
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final st = (data['status'] as Map<String, dynamic>?) ?? {};
      return GitSyncStatus(
        online: true,
        autoPullEnabled: (st['autoPullEnabled'] as bool?) ?? false,
        branch: (st['branch'] ?? 'main').toString(),
        commit: (st['commit'] ?? '—').toString(),
        lastSyncAt: (st['lastSyncAt'] ?? '').toString(),
        lastResult: (st['lastResult'] ?? data['output'] ?? '').toString(),
        lastError: (st['lastError'] ?? data['error'] ?? '').toString(),
      );
    } catch (_) {
      return await fetchSyncStatus();
    }
  }

  static String _randomHex(int nBytes) {
    final sb = StringBuffer();
    for (var i = 0; i < nBytes; i++) {
      sb.write(_rng.nextInt(256).toRadixString(16).padLeft(2, '0'));
    }
    return sb.toString();
  }
}
