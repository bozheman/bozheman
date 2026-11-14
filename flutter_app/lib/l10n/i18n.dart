import 'dart:convert';
import 'package:flutter/services.dart';

class LanguageOption {
  final String code;
  final String label;

  const LanguageOption(this.code, this.label);
}

class I18n {
  I18n._();

  static const List<LanguageOption> languages = [
    LanguageOption('ru', '[RU] Русский'),
    LanguageOption('en', '[EN] English'),
    LanguageOption('uk', '[UK] Українська'),
    LanguageOption('be', '[BE] Беларуская'),
    LanguageOption('pl', '[PL] Polski'),
    LanguageOption('de', '[DE] Deutsch'),
    LanguageOption('fr', '[FR] Français'),
    LanguageOption('es', '[ES] Español'),
  ];

  static final Map<String, Map<String, String>> _cache = {};
  static String _currentLang = 'ru';

  static String get currentLang => _currentLang;

  static Future<void> loadLanguage(String lang) async {
    final normalized = languages.any((l) => l.code == lang) ? lang : 'ru';
    _currentLang = normalized;

    // Ensure Russian and English are loaded for instant fallbacks
    if (!_cache.containsKey('ru')) {
      await _loadAsset('ru');
    }
    if (!_cache.containsKey(normalized)) {
      await _loadAsset(normalized);
    }
  }

  static Future<void> _loadAsset(String lang) async {
    try {
      final raw = await rootBundle.loadString('assets/locales/$lang.json');
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      _cache[lang] = decoded.map((k, v) => MapEntry(k, v.toString()));
    } catch (_) {
      _cache.putIfAbsent(lang, () => {});
    }
  }

  static String t(String key, [Map<String, Object?> params = const {}]) {
    var val = _cache[_currentLang]?[key] ??
        _cache['ru']?[key] ??
        _bootstrapFallback[key] ??
        key;

    if (params.isNotEmpty) {
      params.forEach((k, v) {
        val = val.replaceAll('{$k}', v?.toString() ?? '');
      });
    }
    return val;
  }

  /// Splits `<strong>Title:</strong> Body` into clean prefix + body for Flutter TextSpan.
  static ({String? title, String body}) splitStrong(String raw) {
    final cleaned = raw.replaceAll('&amp;', '&');
    final start = cleaned.indexOf('<strong>');
    final end = cleaned.indexOf('</strong>');
    if (start != -1 && end != -1 && end > start) {
      final title = cleaned.substring(start + 8, end).trim();
      final body = cleaned.substring(end + 9).trim();
      return (title: title, body: body);
    }
    return (title: null, body: cleaned);
  }

  /// Minimal fallback dictionary used during synchronous boot / widget tests.
  static const Map<String, String> _bootstrapFallback = {
    'title_main': 'BOZHEMAN ≡ PROTOCOL',
    'home_tagline': 'Цифровой хаб стримера и разработчика',
    'stream1_title': '01 // МАГИСТРАЛЬ СОЦСЕТЕЙ',
    'stream1_sub': 'Прямой переход на стримы, видео, соцсети и поддержку',
    'stream2_title': '02 // СЛОТЫ 777 (БЕЗ ВЛОЖЕНИЙ)',
    'stream2_sub': 'Чистый азарт ради азарта: виртуальные кредиты ₿ и SHA-256',
    'stream3_title': '03 // ЛАБОРАТОРИЯ, ЛОР И 3D-ЯДРО',
    'stream3_sub': 'Калькулятор Менделя, квест «Иллюзия», 3D-дешифровка и хаб игр',
    'slots_free_badge': 'FREE-TO-PLAY // 0% РЕАЛЬНЫХ ДЕНЕГ • ТОЛЬКО ВИРТУАЛЬНЫЕ КРЕДИТЫ ₿',
    'nav_home_short': 'ХАБ',
    'nav_slots_short': 'СЛОТЫ 777',
    'nav_lab_short': 'ЛАБ',
    'nav_illusion_short': 'ИЛЛЮЗИЯ',
    'nav_games_short': 'ПРОЕКТЫ',
    'nav_support_short': 'ШЛЮЗЫ',
    'top_node_online': 'УЗЕЛ: ОНЛАЙН',
    'top_balance': 'БАЛАНС',
    'crt_on': 'CRT: ВКЛ',
    'crt_off': 'CRT: ВЫКЛ',
    'sound_on': 'ЗВУК: ВКЛ',
    'sound_off': 'ЗВУК: ВЫКЛ',
    'ach_btn_label': '🏆 ДОСТИЖЕНИЯ',
    'term_toggle': '>_ ТЕРМИНАЛ [~]',
    'server_sync_label': 'СИНХРОНИЗАЦИЯ УЗЛА (GITHUB)',
    'server_sync_btn': 'ОБНОВИТЬ С GITHUB',
  };
}
