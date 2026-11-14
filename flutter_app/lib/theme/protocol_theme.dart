import 'package:material_ui/material_ui.dart';

/// Clean Concise Cyberpunk design tokens matching ARCHITECTURE.md & AGENTS.md.
class ProtocolColors {
  ProtocolColors._();

  static const Color bgPure = Color(0xFF000000);
  static const Color surfaceDark = Color(0xFF0A0404);
  static const Color surfaceCard = Color(0xFF100606);
  static const Color surfaceElevated = Color(0xFF160808);

  static const Color crimson = Color(0xFFFF3333);
  static const Color crimsonMid = Color(0xFFAA1818);
  static const Color crimsonDim = Color(0xFF7A0000);

  static const Color borderSubtle = Color(0x38FF3333);
  static const Color borderBright = Color(0x88FF3333);

  static const Color gold = Color(0xFFE5B842);
  static const Color emerald = Color(0xFF00E575);

  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFD6D6D6);
  static const Color textMuted = Color(0xB8FF9A9A);
  static const Color textDim = Color(0x99AAAAAA);
}

class ProtocolTheme {
  ProtocolTheme._();

  static const String monoFont = 'Fira Code';
  static const List<String> monoFallback = ['Consolas', 'Courier New', 'monospace'];

  static TextStyle mono({
    double size = 13,
    FontWeight weight = FontWeight.w400,
    Color color = ProtocolColors.textPrimary,
    double letterSpacing = 0.4,
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
    );
  }

  static ThemeData build() {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: ProtocolColors.bgPure,
      colorScheme: const ColorScheme.dark(
        primary: ProtocolColors.crimson,
        secondary: ProtocolColors.gold,
        surface: ProtocolColors.surfaceCard,
        error: ProtocolColors.crimson,
      ),
      fontFamily: monoFont,
      fontFamilyFallback: monoFallback,
      useMaterial3: true,
      dividerColor: ProtocolColors.borderSubtle,
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStateProperty.all(ProtocolColors.crimsonDim),
      ),
    );
  }
}

/// Reusable strict cyberpunk panel container.
class CyberPanel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;
  final Color? backgroundColor;

  const CyberPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor ?? ProtocolColors.surfaceCard.withAlpha(220),
        border: Border.all(
          color: borderColor ?? ProtocolColors.borderSubtle,
          width: 1,
        ),
        borderRadius: BorderRadius.circular(4),
      ),
      child: child,
    );
  }
}

/// Strictly uniform, restrained cyber button with subtle top accent border on hover.
class CyberButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color accentColor;
  final bool filled;
  final IconData? icon;
  final bool compact;

  const CyberButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.accentColor = ProtocolColors.crimson,
    this.filled = false,
    this.icon,
    this.compact = false,
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

    return MouseRegion(
      cursor: enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          transform: Matrix4.translationValues(0, (_hovered && enabled) ? -1.0 : 0.0, 0),
          padding: EdgeInsets.symmetric(
            horizontal: widget.compact ? 12 : 16,
            vertical: widget.compact ? 9 : 13,
          ),
          decoration: BoxDecoration(
            color: widget.filled
                ? accent.withAlpha(_hovered ? 55 : 35)
                : (_hovered ? accent.withAlpha(22) : ProtocolColors.surfaceDark),
            border: Border(
              top: BorderSide(
                color: (_hovered && enabled) ? accent : accent.withAlpha(110),
                width: 2,
              ),
              left: BorderSide(color: accent.withAlpha(70), width: 1),
              right: BorderSide(color: accent.withAlpha(70), width: 1),
              bottom: BorderSide(color: accent.withAlpha(70), width: 1),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.icon != null) ...[
                Icon(
                  widget.icon,
                  size: widget.compact ? 14 : 16,
                  color: enabled ? accent : ProtocolColors.textDim,
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Text(
                  widget.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: ProtocolTheme.mono(
                    size: widget.compact ? 12 : 13,
                    weight: FontWeight.w700,
                    color: enabled ? ProtocolColors.textPrimary : ProtocolColors.textDim,
                    letterSpacing: 0.7,
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
