import 'package:material_ui/material_ui.dart';

/// Luxury Dark Obsidian Cyberpunk design tokens (V2 Clean Bento Architecture).
/// Strict adherence to AGENTS.md: high-contrast typography, zero neon blur clutter,
/// refined crimson/gold/emerald accents, and uniform borders on rounded boxes.
class ProtocolColors {
  ProtocolColors._();

  static const Color bgVoid = Color(0xFF040406);
  static const Color bgSurface = Color(0xFF0B0B10);
  static const Color bgSurfaceElevated = Color(0xFF12121A);
  static const Color bgGlass = Color(0xD90C0C12);

  // Backwards-compatible aliases kept clean for existing modals/painters
  static const Color bgPure = bgVoid;
  static const Color surfaceDark = bgSurface;
  static const Color surfaceCard = bgSurface;
  static const Color surfaceElevated = bgSurfaceElevated;

  static const Color crimson = Color(0xFFFF2A3B);
  static const Color crimsonMid = Color(0xFFB81D2B);
  static const Color crimsonDim = Color(0xFF5C0D16);

  static const Color gold = Color(0xFFE5B842);
  static const Color emerald = Color(0xFF00E575);
  static const Color violet = Color(0xFF9146FF);
  static const Color cyan = Color(0xFF00D2FF);
  static const Color coral = Color(0xFFF56040);

  static const Color borderSubtle = Color(0x16FFFFFF);
  static const Color borderBright = Color(0x36FFFFFF);

  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFFCBD5E1);
  static const Color textDim = Color(0xFF64748B);
}

class ProtocolTheme {
  ProtocolTheme._();

  static const String displayFont = 'Space Grotesk';
  static const String sansFont = 'Inter';
  static const String monoFont = 'JetBrains Mono';

  static const List<String> sansFallback = ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'];
  static const List<String> monoFallback = ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'];

  static TextStyle display({
    double size = 28,
    FontWeight weight = FontWeight.w700,
    Color color = ProtocolColors.textPrimary,
    double letterSpacing = -0.6,
    double? height,
  }) {
    return TextStyle(
      fontFamily: displayFont,
      fontFamilyFallback: sansFallback,
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  static TextStyle sans({
    double size = 14,
    FontWeight weight = FontWeight.w400,
    Color color = ProtocolColors.textPrimary,
    double letterSpacing = 0.0,
    double? height,
  }) {
    return TextStyle(
      fontFamily: sansFont,
      fontFamilyFallback: sansFallback,
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  static TextStyle mono({
    double size = 13,
    FontWeight weight = FontWeight.w500,
    Color color = ProtocolColors.textPrimary,
    double letterSpacing = 0.2,
    double? height,
  }) {
    return TextStyle(
      fontFamily: monoFont,
      fontFamilyFallback: monoFallback,
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: letterSpacing,
      height: height,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }

  static ThemeData build() {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: Colors.transparent,
      colorScheme: const ColorScheme.dark(
        primary: ProtocolColors.crimson,
        secondary: ProtocolColors.gold,
        surface: ProtocolColors.bgSurface,
        error: ProtocolColors.crimson,
      ),
      fontFamily: sansFont,
      fontFamilyFallback: sansFallback,
      useMaterial3: true,
      dividerColor: ProtocolColors.borderSubtle,
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStateProperty.all(ProtocolColors.borderBright),
        radius: const Radius.circular(999),
      ),
    );
  }
}

/// Elevated Bento card with smooth hover elevation, radial accent glow & uniform rounded border.
class BentoCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final Color accentColor;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final Color? backgroundColor;
  final bool highlightBorder;

  const BentoCard({
    super.key,
    required this.child,
    this.onTap,
    this.accentColor = ProtocolColors.crimson,
    this.padding = const EdgeInsets.all(22),
    this.borderRadius = 20,
    this.backgroundColor,
    this.highlightBorder = false,
  });

  @override
  State<BentoCard> createState() => _BentoCardState();
}

class _BentoCardState extends State<BentoCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final interactive = widget.onTap != null;
    final activeGlow = _hovered && interactive;
    final borderColor = activeGlow
        ? widget.accentColor.withAlpha(155)
        : (widget.highlightBorder
            ? widget.accentColor.withAlpha(90)
            : ProtocolColors.borderSubtle);

    return MouseRegion(
      cursor: interactive ? SystemMouseCursors.click : SystemMouseCursors.basic,
      onEnter: interactive ? (_) => setState(() => _hovered = true) : null,
      onExit: interactive ? (_) => setState(() => _hovered = false) : null,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          transform: Matrix4.translationValues(0, activeGlow ? -3.0 : 0.0, 0),
          padding: widget.padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            color: widget.backgroundColor ?? ProtocolColors.bgSurface.withAlpha(232),
            gradient: activeGlow
                ? RadialGradient(
                    center: Alignment.topRight,
                    radius: 1.4,
                    colors: [
                      widget.accentColor.withAlpha(34),
                      widget.backgroundColor ?? ProtocolColors.bgSurface.withAlpha(235),
                    ],
                  )
                : null,
            border: Border.all(
              color: borderColor,
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: activeGlow
                    ? widget.accentColor.withAlpha(36)
                    : Colors.black.withAlpha(80),
                blurRadius: activeGlow ? 26 : 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: widget.child,
        ),
      ),
    );
  }
}

/// Clean translucent panel container (uniform border, modern radius).
class CyberPanel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;
  final Color? backgroundColor;
  final double borderRadius;

  const CyberPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.borderColor,
    this.backgroundColor,
    this.borderRadius = 16,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor ?? ProtocolColors.bgSurface.withAlpha(230),
        border: Border.all(
          color: borderColor ?? ProtocolColors.borderSubtle,
          width: 1,
        ),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: child,
    );
  }
}

/// Modern pill / rounded button with smooth hover sheen & uniform border.
class CyberButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color accentColor;
  final bool filled;
  final IconData? icon;
  final bool compact;
  final bool pill;

  const CyberButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.accentColor = ProtocolColors.crimson,
    this.filled = false,
    this.icon,
    this.compact = false,
    this.pill = true,
  });

  @override
  State<CyberButton> createState() => _CyberButtonState();
}

class _CyberButtonState extends State<CyberButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    final accent = widget.accentColor;

    final bgColor = widget.filled
        ? (enabled
            ? accent.withAlpha(_hovered ? 245 : 220)
            : ProtocolColors.bgSurfaceElevated)
        : (_hovered && enabled
            ? accent.withAlpha(30)
            : ProtocolColors.bgSurfaceElevated.withAlpha(210));

    final fgColor = widget.filled
        ? (enabled
            ? (accent.computeLuminance() > 0.45 ? Colors.black : Colors.white)
            : ProtocolColors.textDim)
        : (enabled ? ProtocolColors.textPrimary : ProtocolColors.textDim);

    return MouseRegion(
      cursor: enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          transform: Matrix4.translationValues(0, (_hovered && enabled) ? -1.5 : 0.0, 0),
          padding: EdgeInsets.symmetric(
            horizontal: widget.compact ? 14 : 20,
            vertical: widget.compact ? 9 : 13,
          ),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(widget.pill ? 999 : 12),
            border: Border.all(
              color: widget.filled
                  ? (enabled ? accent : ProtocolColors.borderSubtle)
                  : ((_hovered && enabled)
                      ? accent.withAlpha(180)
                      : ProtocolColors.borderBright),
              width: 1,
            ),
            boxShadow: (widget.filled && _hovered && enabled)
                ? [
                    BoxShadow(
                      color: accent.withAlpha(65),
                      blurRadius: 18,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.icon != null) ...[
                Icon(
                  widget.icon,
                  size: widget.compact ? 15 : 17,
                  color: widget.filled ? fgColor : (enabled ? accent : ProtocolColors.textDim),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Text(
                  widget.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: ProtocolTheme.sans(
                    size: widget.compact ? 12.5 : 13.5,
                    weight: FontWeight.w600,
                    color: fgColor,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
