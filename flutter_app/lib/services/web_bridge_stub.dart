/// In-memory fallback bridge for Dart VM tests and non-web platforms.
class WebBridge {
  WebBridge._();

  static final Map<String, String> _memStorage = {};

  static String storageGet(String key) => _memStorage[key] ?? '';

  static void storageSet(String key, String value) {
    _memStorage[key] = value;
  }

  static void openUrl(String url) {}

  static void copyText(String text) {}

  static void setCrt(bool enabled) {}

  static void playTone(
    double freq,
    String type,
    double dur,
    double gain, [
    double delay = 0,
    double? freqEnd,
  ]) {}

  static Future<String> fetchJson(
    String url, {
    String method = 'GET',
    String? body,
  }) async {
    throw UnsupportedError('HTTP bridge unavailable in VM stub');
  }
}
