import 'dart:js_interop';

@JS('bzpBridge.storageGet')
external String _jsStorageGet(String key);

@JS('bzpBridge.storageSet')
external void _jsStorageSet(String key, String value);

@JS('bzpBridge.openUrl')
external void _jsOpenUrl(String url);

@JS('bzpBridge.copyText')
external void _jsCopyText(String text);

@JS('bzpBridge.setCrt')
external void _jsSetCrt(bool enabled);

@JS('bzpBridge.playTone')
external void _jsPlayTone(
  double freq,
  String type,
  double dur,
  double gain,
  double delay,
  double freqEnd,
);

@JS('bzpBridge.fetchJson')
external JSPromise<JSString> _jsFetchJson(String url, String method, String body);

class WebBridge {
  WebBridge._();

  static String storageGet(String key) {
    try {
      return _jsStorageGet(key);
    } catch (_) {
      return '';
    }
  }

  static void storageSet(String key, String value) {
    try {
      _jsStorageSet(key, value);
    } catch (_) {}
  }

  static void openUrl(String url) {
    try {
      _jsOpenUrl(url);
    } catch (_) {}
  }

  static void copyText(String text) {
    try {
      _jsCopyText(text);
    } catch (_) {}
  }

  static void setCrt(bool enabled) {
    try {
      _jsSetCrt(enabled);
    } catch (_) {}
  }

  static void playTone(
    double freq,
    String type,
    double dur,
    double gain, [
    double delay = 0,
    double? freqEnd,
  ]) {
    try {
      _jsPlayTone(freq, type, dur, gain, delay, freqEnd ?? 0);
    } catch (_) {}
  }

  static Future<String> fetchJson(
    String url, {
    String method = 'GET',
    String? body,
  }) async {
    final jsStr = await _jsFetchJson(url, method, body ?? '').toDart;
    return jsStr.toDart;
  }
}
