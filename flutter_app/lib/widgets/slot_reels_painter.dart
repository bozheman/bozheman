import 'package:material_ui/material_ui.dart';
import '../services/api_service.dart';
import '../theme/protocol_theme.dart';

/// Sleek backlit cylindrical drum reel widget with vertical depth gradient shading
/// and glowing payline guide.
class SlotReelWidget extends StatelessWidget {
  final SlotSymbol targetSymbol;
  final bool spinning;
  final int reelIndex;
  final double spinTick; // 0..1 continuous animation phase
  final bool highlighted;

  const SlotReelWidget({
    super.key,
    required this.targetSymbol,
    required this.spinning,
    required this.reelIndex,
    required this.spinTick,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = highlighted
        ? ProtocolColors.gold
        : (spinning ? ProtocolColors.crimson.withAlpha(140) : ProtocolColors.borderBright);

    return Container(
      height: 136,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF020204),
            Color(0xFF0E0E16),
            Color(0xFF020204),
          ],
          stops: [0.0, 0.5, 1.0],
        ),
        border: Border.all(
          color: borderColor,
          width: highlighted ? 1.8 : 1.0,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: highlighted
            ? [
                BoxShadow(
                  color: ProtocolColors.gold.withAlpha(48),
                  blurRadius: 20,
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(17),
        child: CustomPaint(
          painter: _ReelPainter(
            targetSymbol: targetSymbol,
            spinning: spinning,
            reelIndex: reelIndex,
            spinTick: spinTick,
            highlighted: highlighted,
          ),
        ),
      ),
    );
  }
}

class _ReelPainter extends CustomPainter {
  final SlotSymbol targetSymbol;
  final bool spinning;
  final int reelIndex;
  final double spinTick;
  final bool highlighted;

  _ReelPainter({
    required this.targetSymbol,
    required this.spinning,
    required this.reelIndex,
    required this.spinTick,
    required this.highlighted,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Center laser payline guide
    final centerColor = highlighted ? ProtocolColors.gold : ProtocolColors.crimson;
    final linePaint = Paint()
      ..color = centerColor.withAlpha(highlighted ? 110 : 42)
      ..strokeWidth = highlighted ? 1.5 : 1.0;
    canvas.drawLine(
      Offset(0, size.height / 2),
      Offset(size.width, size.height / 2),
      linePaint,
    );

    if (spinning) {
      final total = slotSymbols.length;
      final shift = (spinTick * 14 + reelIndex * 2.3) % total;
      final baseIdx = shift.floor();
      final frac = shift - baseIdx;

      for (var offset = -1; offset <= 1; offset++) {
        final sym = slotSymbols[(baseIdx + offset + total) % total];
        final y = size.height / 2 + (offset - frac) * 48;
        final alpha = offset == 0 ? 225 : 75;
        _drawGlyph(
          canvas,
          size,
          sym.glyph,
          Color(sym.colorHex).withAlpha(alpha),
          y,
          offset == 0 ? 44 : 30,
        );
      }
    } else {
      final color = highlighted ? ProtocolColors.gold : Color(targetSymbol.colorHex);
      // Soft radial halo behind landed symbol
      final haloPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            color.withAlpha(highlighted ? 52 : 24),
            Colors.transparent,
          ],
        ).createShader(
          Rect.fromCircle(
            center: Offset(size.width / 2, size.height / 2),
            radius: size.height * 0.42,
          ),
        );
      canvas.drawCircle(
        Offset(size.width / 2, size.height / 2),
        size.height * 0.42,
        haloPaint,
      );

      _drawGlyph(canvas, size, targetSymbol.glyph, color, size.height / 2, 54);
    }

    // Top and bottom cylindrical drum vignette overlay
    final vignettePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color(0xD8040406),
          Color(0x00040406),
          Color(0x00040406),
          Color(0xD8040406),
        ],
        stops: [0.0, 0.25, 0.75, 1.0],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, vignettePaint);
  }

  void _drawGlyph(
    Canvas canvas,
    Size size,
    String glyph,
    Color color,
    double centerY,
    double fontSize,
  ) {
    final tp = TextPainter(
      text: TextSpan(
        text: glyph,
        style: ProtocolTheme.display(
          size: fontSize,
          weight: FontWeight.w700,
          color: color,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(
      canvas,
      Offset((size.width - tp.width) / 2, centerY - tp.height / 2),
    );
  }

  @override
  bool shouldRepaint(covariant _ReelPainter oldDelegate) {
    return oldDelegate.spinning != spinning ||
        oldDelegate.spinTick != spinTick ||
        oldDelegate.targetSymbol.id != targetSymbol.id ||
        oldDelegate.highlighted != highlighted;
  }
}
