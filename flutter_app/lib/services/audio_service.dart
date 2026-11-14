import 'dart:math';
import 'web_bridge.dart';

class AudioService {
  AudioService._();

  static bool muted = true;
  static final Random _rng = Random();

  static void _tone(
    double freq,
    String type,
    double dur,
    double gain, [
    double delay = 0,
    double? freqEnd,
  ]) {
    if (muted) return;
    WebBridge.playTone(freq, type, dur, gain, delay, freqEnd);
  }

  static void click() => _tone(240, 'square', 0.045, 0.11, 0, 160);

  static void hover() => _tone(1240, 'sine', 0.02, 0.03, 0, 1480);

  static void key() => _tone(680 + _rng.nextDouble() * 240, 'triangle', 0.018, 0.04);

  static void copy() {
    _tone(660, 'sine', 0.06, 0.12, 0);
    _tone(990, 'sine', 0.09, 0.14, 0.06);
  }

  static void cyberPulse(int step) {
    final base = 220 + min(step, 10) * 65.0;
    _tone(base, 'sawtooth', 0.09, 0.14, 0, base * 1.35);
    _tone(base * 0.5, 'square', 0.11, 0.09, 0.02);
  }

  static void spinStart() {
    _tone(160, 'sawtooth', 0.30, 0.13, 0, 320);
    _tone(280, 'sawtooth', 0.25, 0.10, 0.10, 480);
  }

  static void snap() {
    _tone(480, 'square', 0.055, 0.16, 0, 240);
    _tone(140, 'triangle', 0.09, 0.14, 0.04);
  }

  static void win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (var i = 0; i < notes.length; i++) {
      _tone(notes[i], 'sine', 0.22, 0.18, i * 0.08);
    }
  }

  static void jackpot() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0];
    for (var i = 0; i < notes.length; i++) {
      _tone(notes[i], 'sine', 0.32, 0.20, i * 0.07);
      _tone(notes[i] * 0.5, 'triangle', 0.28, 0.10, i * 0.07 + 0.02);
    }
  }

  static void achievement() {
    const notes = [440.0, 554.37, 659.25, 880.0];
    for (var i = 0; i < notes.length; i++) {
      _tone(notes[i], 'triangle', 0.20, 0.16, i * 0.08);
    }
  }

  static void lose() {
    _tone(220, 'sawtooth', 0.14, 0.13, 0, 170);
    _tone(175, 'sawtooth', 0.20, 0.11, 0.11, 110);
  }

  static void error() {
    _tone(150, 'square', 0.09, 0.14);
    _tone(120, 'square', 0.11, 0.14, 0.09);
  }
}
