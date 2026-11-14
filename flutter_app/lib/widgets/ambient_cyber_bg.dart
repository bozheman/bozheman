import 'dart:math';
import 'package:material_ui/material_ui.dart';
import '../theme/protocol_theme.dart';

/// Atmospheric dark obsidian ambient background with breathing ruby aura,
/// subtle perspective floor grid, and gentle drifting micro-embers.
class AmbientCyberBackground extends StatefulWidget {
  final Widget child;

  const AmbientCyberBackground({super.key, required this.child});

  @override
  State<AmbientCyberBackground> createState() => _AmbientCyberBackgroundState();
}

class _AmbientCyberBackgroundState extends State<AmbientCyberBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 26),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(
          color: ProtocolColors.bgVoid,
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return CustomPaint(
                painter: _AmbientPainter(phase: _controller.value),
                size: Size.infinite,
              );
            },
          ),
        ),
        widget.child,
      ],
    );
  }
}

class _EmberSeed {
  final double x;
  final double yOffset;
  final double speed;
  final double radius;
  final bool isGold;

  const _EmberSeed(this.x, this.yOffset, this.speed, this.radius, this.isGold);
}

class _AmbientPainter extends CustomPainter {
  final double phase;

  _AmbientPainter({required this.phase});

  static final List<_EmberSeed> _embers = List.generate(34, (i) {
    final r = Random(7001 + i * 37);
    return _EmberSeed(
      r.nextDouble(),
      r.nextDouble(),
      0.5 + r.nextDouble() * 1.1,
      1.1 + r.nextDouble() * 1.6,
      i % 5 == 0,
    );
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (size.isEmpty) return;

    final breathe = 0.5 + 0.5 * sin(phase * pi * 2);

    // 1. Primary crimson ambient nebula glow near upper hero
    final heroCenter = Offset(size.width * 0.5, size.height * 0.16);
    final nebulaRadius = max(size.width, size.height) * 0.62;
    final crimsonGlow = Paint()
      ..shader = RadialGradient(
        colors: [
          ProtocolColors.crimson.withAlpha((24 + breathe * 14).round()),
          ProtocolColors.crimsonMid.withAlpha((10 + breathe * 6).round()),
          Colors.transparent,
        ],
        stops: const [0.0, 0.42, 1.0],
      ).createShader(Rect.fromCircle(center: heroCenter, radius: nebulaRadius));
    canvas.drawRect(Offset.zero & size, crimsonGlow);

    // 2. Subtle secondary cool violet/cyan accent glow at bottom-right
    final secondCenter = Offset(size.width * 0.85, size.height * 0.88);
    final secondGlow = Paint()
      ..shader = RadialGradient(
        colors: [
          ProtocolColors.violet.withAlpha((14 + (1.0 - breathe) * 8).round()),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(center: secondCenter, radius: nebulaRadius * 0.65));
    canvas.drawRect(Offset.zero & size, secondGlow);

    // 3. Subtle perspective horizon grid at bottom third
    final horizonY = size.height * 0.72;
    final gridPaint = Paint()
      ..color = const Color(0x0DFFFFFF)
      ..strokeWidth = 0.7;

    final vanishX = size.width * 0.5;
    const cols = 12;
    for (var i = -cols; i <= cols; i++) {
      final bottomX = vanishX + i * (size.width / 8);
      final topX = vanishX + i * (size.width / 42);
      canvas.drawLine(Offset(topX, horizonY), Offset(bottomX, size.height), gridPaint);
    }

    for (var r = 0; r <= 6; r++) {
      final t = pow(r / 6.0, 1.85).toDouble();
      final y = horizonY + t * (size.height - horizonY);
      gridPaint.color = Color.fromARGB((t * 14).round(), 255, 255, 255);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // 4. Slow drifting atmospheric micro-embers
    final emberPaint = Paint()..style = PaintingStyle.fill;
    for (final e in _embers) {
      final yNorm = (e.yOffset - phase * e.speed) % 1.0;
      final yPos = (yNorm < 0 ? yNorm + 1.0 : yNorm) * size.height;
      final drift = sin((phase * 2 + e.yOffset) * pi * 2) * 14.0;
      final xPos = e.x * size.width + drift;

      // Fade out smoothly at very top and very bottom
      final edgeFade = sin(yPos / size.height * pi).clamp(0.0, 1.0);
      final alpha = (edgeFade * (e.isGold ? 110 : 85)).round();
      emberPaint.color = (e.isGold ? ProtocolColors.gold : ProtocolColors.crimson).withAlpha(alpha);
      canvas.drawCircle(Offset(xPos, yPos), e.radius, emberPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _AmbientPainter oldDelegate) => oldDelegate.phase != phase;
}
