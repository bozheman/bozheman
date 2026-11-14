import 'dart:math';
import 'package:material_ui/material_ui.dart';
import '../theme/protocol_theme.dart';

class _Vec3 {
  final double x;
  final double y;
  final double z;

  const _Vec3(this.x, this.y, this.z);
}

/// Interactive Native 3D Protocol Core Painter (Icosahedron + Ruby Inner Octahedron
/// + Twin Orbital Telemetry Rings + Expanding Click Shockwave Ripples).
class Core3DPainter extends CustomPainter {
  final double yaw;
  final double pitch;
  final double pulse; // 0..1 click reaction (decays from 1 -> 0)
  final double progress; // 0..1 decryption progress (clicks / 10)

  Core3DPainter({
    required this.yaw,
    required this.pitch,
    required this.pulse,
    required this.progress,
  });

  static final List<_Vec3> _icoVerts = _buildIcoVerts();
  static const List<List<int>> _icoEdges = [
    [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
    [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
    [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
    [4, 9], [9, 8], [8, 6], [6, 2], [2, 4],
    [1, 9], [5, 4], [11, 2], [10, 6], [7, 8],
    [4, 1], [2, 5], [6, 11], [8, 10], [9, 7],
  ];

  static const List<_Vec3> _octVerts = [
    _Vec3(0, 0.56, 0),
    _Vec3(0, -0.56, 0),
    _Vec3(0.56, 0, 0),
    _Vec3(-0.56, 0, 0),
    _Vec3(0, 0, 0.56),
    _Vec3(0, 0, -0.56),
  ];

  static const List<List<int>> _octEdges = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [4, 3], [3, 5], [5, 2],
  ];

  static List<_Vec3> _buildIcoVerts() {
    final t = (1.0 + sqrt(5.0)) / 2.0;
    final raw = [
      _Vec3(-1, t, 0), _Vec3(1, t, 0), _Vec3(-1, -t, 0), _Vec3(1, -t, 0),
      _Vec3(0, -1, t), _Vec3(0, 1, t), _Vec3(0, -1, -t), _Vec3(0, 1, -t),
      _Vec3(t, 0, -1), _Vec3(t, 0, 1), _Vec3(-t, 0, -1), _Vec3(-t, 0, 1),
    ];
    return raw.map((v) {
      final len = sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      return _Vec3(v.x / len, v.y / len, v.z / len);
    }).toList();
  }

  Offset _project(_Vec3 v, Size size, double scale, double ry, double rx) {
    final cy = cos(ry);
    final sy = sin(ry);
    final x1 = v.x * cy - v.z * sy;
    final z1 = v.x * sy + v.z * cy;
    final cx = cos(rx);
    final sx = sin(rx);
    final y2 = v.y * cx - z1 * sx;
    final z2 = v.y * sx + z1 * cx;

    final perspective = 3.2 / (3.2 - z2);
    return Offset(
      size.width / 2 + x1 * scale * perspective,
      size.height / 2 + y2 * scale * perspective,
    );
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (size.isEmpty) return;
    final center = Offset(size.width / 2, size.height / 2);
    final minDim = min(size.width, size.height);
    final scale = minDim * 0.30 * (1.0 + pulse * 0.14);
    final unlocked = progress >= 1.0;
    final coreColor = unlocked ? ProtocolColors.emerald : ProtocolColors.crimson;

    // 1. Soft atmospheric radial aura behind 3D Core
    final auraPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          coreColor.withAlpha((42 + pulse * 48).round()),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(center: center, radius: minDim * 0.48));
    canvas.drawCircle(center, minDim * 0.48, auraPaint);

    // 2. Expanding shockwave ripple when clicked
    if (pulse > 0.01) {
      final rippleProgress = 1.0 - pulse;
      final rippleRadius = minDim * (0.20 + rippleProgress * 0.34);
      final ripplePaint = Paint()
        ..color = (unlocked ? ProtocolColors.emerald : ProtocolColors.gold)
            .withAlpha((pulse * 150).round())
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0 * pulse + 0.5;
      canvas.drawCircle(center, rippleRadius, ripplePaint);
    }

    // 3. Primary & Secondary 3D Orbital Rings
    _drawOrbit(canvas, size, scale, yaw * 0.65, pitch + 0.45, coreColor.withAlpha(110));
    _drawOrbit(canvas, size, scale * 1.12, -yaw * 0.4, pitch - 0.6, ProtocolColors.gold.withAlpha(65));

    // 4. Outer Icosahedron Wireframe
    final outerColor = Color.lerp(
      coreColor.withAlpha(200),
      unlocked ? ProtocolColors.emerald : ProtocolColors.gold,
      pulse * 0.8 + (unlocked ? 0.35 : 0.0),
    )!;
    final outerPaint = Paint()
      ..color = outerColor
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke;

    final projIco = _icoVerts
        .map((v) => _project(v, size, scale, yaw, pitch))
        .toList();
    for (final edge in _icoEdges) {
      canvas.drawLine(projIco[edge[0]], projIco[edge[1]], outerPaint);
    }

    // Glowing vertices
    final nodePaint = Paint()..color = ProtocolColors.textPrimary.withAlpha(220);
    for (final p in projIco) {
      canvas.drawCircle(p, 2.2, nodePaint);
    }

    // 5. Inner counter-rotating ruby/emerald octahedron
    final innerPaint = Paint()
      ..color = unlocked ? ProtocolColors.emerald : ProtocolColors.gold
      ..strokeWidth = 1.75
      ..style = PaintingStyle.stroke;

    final projOct = _octVerts
        .map((v) => _project(v, size, scale, -yaw * 1.45, -pitch * 0.9))
        .toList();
    for (final edge in _octEdges) {
      canvas.drawLine(projOct[edge[0]], projOct[edge[1]], innerPaint);
    }
  }

  void _drawOrbit(Canvas canvas, Size size, double scale, double ry, double rx, Color color) {
    final ringPaint = Paint()
      ..color = color
      ..strokeWidth = 1.1
      ..style = PaintingStyle.stroke;
    final pts = <Offset>[];
    for (var i = 0; i <= 54; i++) {
      final a = (i / 54) * pi * 2;
      final pt = _Vec3(cos(a) * 1.38, sin(a) * 0.36, sin(a) * 1.28);
      pts.add(_project(pt, size, scale, ry, rx));
    }
    for (var i = 0; i < pts.length - 1; i++) {
      canvas.drawLine(pts[i], pts[i + 1], ringPaint);
    }
  }

  @override
  bool shouldRepaint(covariant Core3DPainter oldDelegate) {
    return oldDelegate.yaw != yaw ||
        oldDelegate.pitch != pitch ||
        oldDelegate.pulse != pulse ||
        oldDelegate.progress != progress;
  }
}
