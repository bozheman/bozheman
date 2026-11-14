import 'dart:convert';
import 'package:material_ui/material_ui.dart';

/// Pure-Dart ISO-18004 Byte-mode QR Code Generator (Versions 1..4, EC Level L).
/// Supports up to 78 UTF-8 bytes with zero external dependencies.
class QrMatrixEncoder {
  QrMatrixEncoder._();

  static const _specs = [
    (version: 1, size: 21, dataCw: 19, ecCw: 7, align: <int>[]),
    (version: 2, size: 25, dataCw: 34, ecCw: 10, align: [6, 18]),
    (version: 3, size: 29, dataCw: 55, ecCw: 15, align: [6, 22]),
    (version: 4, size: 33, dataCw: 80, ecCw: 20, align: [6, 26]),
  ];

  static final List<int> _gfExp = _initExp();
  static final List<int> _gfLog = _initLog();

  static List<int> _initExp() {
    final exp = List<int>.filled(512, 0);
    var x = 1;
    for (var i = 0; i < 255; i++) {
      exp[i] = x;
      x <<= 1;
      if ((x & 0x100) != 0) x ^= 0x11d;
    }
    for (var i = 255; i < 512; i++) {
      exp[i] = exp[i - 255];
    }
    return exp;
  }

  static List<int> _initLog() {
    final log = List<int>.filled(256, 0);
    for (var i = 0; i < 255; i++) {
      log[_gfExp[i]] = i;
    }
    return log;
  }

  static int _gfMul(int a, int b) {
    if (a == 0 || b == 0) return 0;
    return _gfExp[_gfLog[a] + _gfLog[b]];
  }

  static List<int> _rsGenerator(int degree) {
    var poly = <int>[1];
    for (var i = 0; i < degree; i++) {
      final factor = [1, _gfExp[i]];
      final next = List<int>.filled(poly.length + 1, 0);
      for (var j = 0; j < poly.length; j++) {
        for (var k = 0; k < factor.length; k++) {
          next[j + k] ^= _gfMul(poly[j], factor[k]);
        }
      }
      poly = next;
    }
    return poly;
  }

  static List<int> _rsEncode(List<int> data, int ecLen) {
    final gen = _rsGenerator(ecLen);
    final res = List<int>.filled(data.length + ecLen, 0);
    for (var i = 0; i < data.length; i++) {
      res[i] = data[i];
    }
    for (var i = 0; i < data.length; i++) {
      final coef = res[i];
      if (coef != 0) {
        for (var j = 0; j < gen.length; j++) {
          res[i + j] ^= _gfMul(gen[j], coef);
        }
      }
    }
    return res.sublist(data.length);
  }

  static List<List<bool>> encode(String input) {
    final bytes = utf8.encode(input);
    final spec = _specs.firstWhere(
      (s) => bytes.length + 2 <= s.dataCw,
      orElse: () => _specs.last,
    );
    final payload = bytes.length + 2 > spec.dataCw
        ? bytes.sublist(0, spec.dataCw - 2)
        : bytes;

    // Build bit stream: Mode 0100 (Byte) + 8-bit length + payload + terminator + padding
    final bits = <int>[];
    void pushBits(int val, int count) {
      for (var i = count - 1; i >= 0; i--) {
        bits.add((val >> i) & 1);
      }
    }

    pushBits(0x4, 4); // Byte mode
    pushBits(payload.length, 8);
    for (final b in payload) {
      pushBits(b, 8);
    }
    final maxBits = spec.dataCw * 8;
    for (var i = 0; i < 4 && bits.length < maxBits; i++) {
      bits.add(0);
    }
    while (bits.length % 8 != 0) {
      bits.add(0);
    }
    final dataCodewords = <int>[];
    for (var i = 0; i < bits.length; i += 8) {
      var cw = 0;
      for (var j = 0; j < 8; j++) {
        cw = (cw << 1) | bits[i + j];
      }
      dataCodewords.add(cw);
    }
    var padIdx = 0;
    while (dataCodewords.length < spec.dataCw) {
      dataCodewords.add(padIdx % 2 == 0 ? 0xEC : 0x11);
      padIdx++;
    }

    final ecCodewords = _rsEncode(dataCodewords, spec.ecCw);
    final allCw = [...dataCodewords, ...ecCodewords];
    final finalBits = <int>[];
    for (final cw in allCw) {
      for (var i = 7; i >= 0; i--) {
        finalBits.add((cw >> i) & 1);
      }
    }

    final n = spec.size;
    final modules = List.generate(n, (_) => List<bool>.filled(n, false));
    final reserved = List.generate(n, (_) => List<bool>.filled(n, false));

    void setMod(int r, int c, bool dark, {bool isReserved = true}) {
      if (r < 0 || r >= n || c < 0 || c >= n) return;
      modules[r][c] = dark;
      if (isReserved) reserved[r][c] = true;
    }

    void drawFinder(int top, int left) {
      for (var r = -1; r <= 7; r++) {
        for (var c = -1; c <= 7; c++) {
          final rr = top + r;
          final cc = left + c;
          if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
          final dark = (r >= 0 && r <= 6 && c >= 0 && c <= 6) &&
              (r == 0 || r == 6 || c == 0 || c == 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          setMod(rr, cc, dark);
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, n - 7);
    drawFinder(n - 7, 0);

    // Alignment pattern for V2..V4 (single center at align[1], align[1])
    if (spec.align.length >= 2) {
      final center = spec.align[1];
      for (var r = -2; r <= 2; r++) {
        for (var c = -2; c <= 2; c++) {
          final dark = r.abs() == 2 || c.abs() == 2 || (r == 0 && c == 0);
          setMod(center + r, center + c, dark);
        }
      }
    }

    // Timing patterns
    for (var i = 8; i < n - 8; i++) {
      final dark = i % 2 == 0;
      setMod(6, i, dark);
      setMod(i, 6, dark);
    }

    // Dark module + reserve format info areas
    setMod(n - 8, 8, true);
    for (var i = 0; i < 9; i++) {
      if (i != 6) {
        reserved[8][i] = true;
        reserved[i][8] = true;
      }
    }
    for (var i = n - 8; i < n; i++) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }

    // Place data bits in zig-zag columns, applying Mask 0 ((r + c) % 2 == 0)
    var bitIdx = 0;
    var up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col == 6) col--;
      for (var step = 0; step < n; step++) {
        final r = up ? (n - 1 - step) : step;
        for (var dx = 0; dx < 2; dx++) {
          final c = col - dx;
          if (!reserved[r][c]) {
            final bit = bitIdx < finalBits.length ? finalBits[bitIdx++] == 1 : false;
            final masked = ((r + c) % 2 == 0) ? !bit : bit;
            modules[r][c] = masked;
          }
        }
      }
      up = !up;
    }

    // Format info for EC Level L (01) + Mask 0 (000) = 0x77C4 (111011111000100)
    const formatBits = 0x77C4;
    for (var i = 0; i < 15; i++) {
      final dark = ((formatBits >> i) & 1) == 1;
      if (i < 6) {
        modules[i][8] = dark;
      } else if (i < 8) {
        modules[i + 1][8] = dark;
      } else {
        modules[n - 15 + i][8] = dark;
      }

      if (i < 8) {
        modules[8][n - 1 - i] = dark;
      } else if (i < 9) {
        modules[8][7] = dark;
      } else {
        modules[8][14 - i] = dark;
      }
    }

    return modules;
  }
}

class QrCodeWidget extends StatelessWidget {
  final String data;
  final double size;
  final Color moduleColor;
  final Color backgroundColor;

  const QrCodeWidget({
    super.key,
    required this.data,
    this.size = 156,
    this.moduleColor = const Color(0xFFFF3333),
    this.backgroundColor = const Color(0xFF000000),
  });

  @override
  Widget build(BuildContext context) {
    final matrix = QrMatrixEncoder.encode(data);
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: backgroundColor,
        border: Border.all(color: moduleColor.withAlpha(140)),
        borderRadius: BorderRadius.circular(3),
      ),
      child: CustomPaint(
        painter: _QrPainter(matrix, moduleColor),
      ),
    );
  }
}

class _QrPainter extends CustomPainter {
  final List<List<bool>> matrix;
  final Color color;

  _QrPainter(this.matrix, this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final n = matrix.length;
    if (n == 0) return;
    final cell = size.width / n;
    final paint = Paint()..color = color;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (matrix[r][c]) {
          canvas.drawRect(
            Rect.fromLTWH(c * cell, r * cell, cell + 0.35, cell + 0.35),
            paint,
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _QrPainter oldDelegate) =>
      oldDelegate.matrix != matrix || oldDelegate.color != color;
}
