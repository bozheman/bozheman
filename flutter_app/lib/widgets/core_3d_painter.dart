import 'dart:math';
import 'package:material_ui/material_ui.dart';
import '../theme/protocol_theme.dart';

class _Vec3 {
  final double x;
  final double y;
  final double z;

  const _Vec3(this.x, this.y, this.z);
}

/// Lightweight native 3D Protocol Core painter (Icosahedron + Ruby Octahedron + Orbital Ring)
/// replacing heavy Three.js WebGL overhead while preserving 3D interactivity.
class Core3DPainter extends CustomPainter {
  final double yaw;
  final double pitch;
  final double pulse; // 0..1 click reaction
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
    // Rotate around Y
    final cy = cos(ry);
    final sy = sin(ry);
    final x1 = v.x * cy - v.z * sy;
    final z1 = v.x * sy + v.z * cy;
    // Rotate around X
    final cx = cos(rx);
    final sx = sin(rx);
    final y2 = v.y * cx - z1 * sx;
    final z2 = v.y * sx + z1 * cx;

    final perspective = 3.2 / (3.2 - z2);
    final px = size.width / 2 + x1 * scale * perspective;
    final py = size.height / 2 + y2 * scale * perspective;
    return Offset(px, py);
  }

  @override
  void paint(Canvas canvas, Size size) {
    final minDim = min(size.width, size.height);
    final scale = minDim * 0.30 * (1.0 + pulse * 0.12);

    // Draw orbital ring
    final ringPaint = Paint()
      ..color = ProtocolColors.crimsonDim.withAlpha(160)
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;
    final ringPts = <Offset>[];
    for (var i = 0; i <= 48; i++) {
      final a = (i / 48) * pi * 2;
      final pt = _Vec3(cos(a) * 1.38, sin(a) * 0.38, sin(a) * 1.28);
      ringPts.add(_project(pt, size, scale, yaw * 0.7, pitch + 0.45));
    }
    for (var i = 0; i < ringPts.length - 1; i++) {
      canvas.drawLine(ringPts[i], ringPts[i + 1], ringPaint);
    }

    // Draw outer icosahedron wireframe
    final outerColor = Color.lerp(
      ProtocolColors.crimsonMid,
      progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.gold,
      pulse * 0.75 + (progress >= 1.0 ? 0.35 : 0.0),
    )!;
    final outerPaint = Paint()
      ..color = outerColor
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final projIco = _icoVerts
        .map((v) => _project(v, size, scale, yaw, pitch))
        .toList();
    for (final edge in _icoEdges) {
      canvas.drawLine(projIco[edge[0]], projIco[edge[1]], outerPaint);
    }

    // Vertex nodes
    final nodePaint = Paint()..color = ProtocolColors.crimson;
    for (final p in projIco) {
      canvas.drawCircle(p, 2.1, nodePaint);
    }

    // Inner counter-rotating ruby/gold octahedron
    final innerPaint = Paint()
      ..color = progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.crimson
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke;

    final projOct = _octVerts
        .map((v) => _project(v, size, scale, -yaw * 1.45, -pitch * 0.9))
        .toList();
    for (final edge in _octEdges) {
      canvas.drawLine(projOct[edge[0]], projOct[edge[1]], innerPaint);
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
