import 'package:material_ui/material_ui.dart';
import '../services/api_service.dart';
import '../theme/protocol_theme.dart';

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
    return Container(
      height: 118,
      decoration: BoxDecoration(
        color: ProtocolColors.bgPure,
        border: Border.all(
          color: highlighted ? ProtocolColors.gold : ProtocolColors.borderBright,
          width: highlighted ? 1.8 : 1.0,
        ),
        borderRadius: BorderRadius.circular(4),
      ),
      child: ClipRect(
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
    // Center payline guide
    final linePaint = Paint()
      ..color = (highlighted ? ProtocolColors.gold : ProtocolColors.crimson).withAlpha(65)
      ..strokeWidth = 1;
    canvas.drawLine(
      Offset(0, size.height / 2),
      Offset(size.width, size.height / 2),
      linePaint,
    );

    if (spinning) {
      final total = slotSymbols.length;
      final shift = (spinTick * 12 + reelIndex * 2.3) % total;
      final baseIdx = shift.floor();
      final frac = shift - baseIdx;

      for (var offset = -1; offset <= 1; offset++) {
        final sym = slotSymbols[(baseIdx + offset + total) % total];
        final y = size.height / 2 + (offset - frac) * 44;
        _drawGlyph(
          canvas,
          size,
          sym.glyph,
          Color(sym.colorHex).withAlpha(offset == 0 ? 220 : 90),
          y,
          offset == 0 ? 38 : 28,
        );
      }
      return;
    }

    final color = highlighted ? ProtocolColors.gold : Color(targetSymbol.colorHex);
    _drawGlyph(canvas, size, targetSymbol.glyph, color, size.height / 2, 46);
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
        style: ProtocolTheme.mono(
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
