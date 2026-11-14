import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/audio_service.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';

/// Sleek floating glassmorphic navigation pill bar (V2 Ultra-Clean Header).
/// Exposes ONLY the 3 core experiences (HUB, SLOTS 777, NEURAL LAB),
/// compact virtual credit balance, language selector, and audio toggle.
class HudBar extends StatelessWidget {
  final ProtocolState state;
  final int activeTab; // 0 = HUB, 1 = SLOTS 777, 2 = NEURAL LAB
  final ValueChanged<int> onSelectTab;

  const HudBar({
    super.key,
    required this.state,
    required this.activeTab,
    required this.onSelectTab,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1140),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isCompact = constraints.maxWidth < 740;
              return Container(
                padding: EdgeInsets.symmetric(
                  horizontal: isCompact ? 12 : 18,
                  vertical: isCompact ? 10 : 10,
                ),
                decoration: BoxDecoration(
                  color: ProtocolColors.bgGlass,
                  borderRadius: BorderRadius.circular(isCompact ? 20 : 999),
                  border: Border.all(color: ProtocolColors.borderSubtle),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(115),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: isCompact
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 6,
                            runSpacing: 8,
                            children: [
                              _BrandMark(onTap: () => onSelectTab(0), compact: true),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _BalancePill(
                                    balance: state.balance,
                                    onTap: () => onSelectTab(1),
                                  ),
                                  const SizedBox(width: 6),
                                  _LanguageButton(state: state),
                                  const SizedBox(width: 4),
                                  _MuteButton(state: state),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Center(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: _ModeSwitcherTrack(
                                activeTab: activeTab,
                                onSelectTab: onSelectTab,
                                compact: true,
                              ),
                            ),
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          _BrandMark(onTap: () => onSelectTab(0)),
                          const Spacer(),
                          _ModeSwitcherTrack(
                            activeTab: activeTab,
                            onSelectTab: onSelectTab,
                            compact: false,
                          ),
                          const Spacer(),
                          _BalancePill(
                            balance: state.balance,
                            onTap: () => onSelectTab(1),
                          ),
                          const SizedBox(width: 8),
                          _LanguageButton(state: state),
                          const SizedBox(width: 6),
                          _MuteButton(state: state),
                        ],
                      ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _BrandMark extends StatelessWidget {
  final VoidCallback onTap;
  final bool compact;

  const _BrandMark({required this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () {
          AudioService.click();
          onTap();
        },
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: compact ? 7 : 9,
              height: compact ? 7 : 9,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: ProtocolColors.crimson,
                boxShadow: [
                  BoxShadow(
                    color: ProtocolColors.crimson.withAlpha(160),
                    blurRadius: 8,
                  ),
                ],
              ),
            ),
            SizedBox(width: compact ? 6 : 9),
            Text(
              'BOZHEMAN',
              style: ProtocolTheme.display(
                size: compact ? 13.5 : 16,
                weight: FontWeight.w700,
                letterSpacing: compact ? 0.6 : 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ModeSwitcherTrack extends StatelessWidget {
  final int activeTab;
  final ValueChanged<int> onSelectTab;
  final bool compact;

  const _ModeSwitcherTrack({
    required this.activeTab,
    required this.onSelectTab,
    required this.compact,
  });

  @override
  Widget build(BuildContext context) {
    final tabs = [
      (idx: 0, label: I18n.t('nav_home_short'), icon: Icons.grid_view_rounded, accent: ProtocolColors.crimson),
      (idx: 1, label: 'SLOTS 777', icon: Icons.casino_outlined, accent: ProtocolColors.gold),
      (idx: 2, label: 'NEURAL LAB', icon: Icons.hub_outlined, accent: ProtocolColors.emerald),
    ];

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: ProtocolColors.bgVoid.withAlpha(200),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: ProtocolColors.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final t in tabs)
            _ModePill(
              label: t.label,
              icon: t.icon,
              accent: t.accent,
              selected: activeTab == t.idx,
              compact: compact,
              onTap: () {
                AudioService.click();
                onSelectTab(t.idx);
              },
            ),
        ],
      ),
    );
  }
}

class _ModePill extends StatefulWidget {
  final String label;
  final IconData icon;
  final Color accent;
  final bool selected;
  final bool compact;
  final VoidCallback onTap;

  const _ModePill({
    required this.label,
    required this.icon,
    required this.accent,
    required this.selected,
    required this.compact,
    required this.onTap,
  });

  @override
  State<_ModePill> createState() => _ModePillState();
}

class _ModePillState extends State<_ModePill> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final active = widget.selected;
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          padding: EdgeInsets.symmetric(
            horizontal: widget.compact ? 11 : 15,
            vertical: widget.compact ? 7 : 8,
          ),
          decoration: BoxDecoration(
            color: active
                ? widget.accent.withAlpha(38)
                : (_hovered ? const Color(0x0DFFFFFF) : Colors.transparent),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: active ? widget.accent.withAlpha(140) : Colors.transparent,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                widget.icon,
                size: widget.compact ? 14 : 15,
                color: active ? widget.accent : ProtocolColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                widget.label,
                style: ProtocolTheme.sans(
                  size: widget.compact ? 11.5 : 12.5,
                  weight: active ? FontWeight.w700 : FontWeight.w500,
                  color: active ? ProtocolColors.textPrimary : ProtocolColors.textSecondary,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BalancePill extends StatelessWidget {
  final int balance;
  final VoidCallback onTap;

  const _BalancePill({required this.balance, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () {
          AudioService.click();
          onTap();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
          decoration: BoxDecoration(
            color: ProtocolColors.gold.withAlpha(22),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: ProtocolColors.gold.withAlpha(90)),
          ),
          child: Text(
            '$balance ₿',
            style: ProtocolTheme.mono(
              size: 12,
              weight: FontWeight.w700,
              color: ProtocolColors.gold,
            ),
          ),
        ),
      ),
    );
  }
}

class _LanguageButton extends StatelessWidget {
  final ProtocolState state;

  const _LanguageButton({required this.state});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: ProtocolColors.bgSurfaceElevated,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: ProtocolColors.borderSubtle),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: state.lang,
          isDense: true,
          dropdownColor: ProtocolColors.bgSurfaceElevated,
          borderRadius: BorderRadius.circular(14),
          icon: const Icon(Icons.keyboard_arrow_down, size: 15, color: ProtocolColors.textSecondary),
          style: ProtocolTheme.mono(size: 11.5, weight: FontWeight.w600, color: ProtocolColors.textPrimary),
          items: I18n.languages
              .map(
                (l) => DropdownMenuItem(
                  value: l.code,
                  child: Text(l.code.toUpperCase()),
                ),
              )
              .toList(),
          onChanged: (v) {
            if (v != null) state.setLanguage(v);
          },
        ),
      ),
    );
  }
}

class _MuteButton extends StatelessWidget {
  final ProtocolState state;

  const _MuteButton({required this.state});

  @override
  Widget build(BuildContext context) {
    final active = !state.audioMuted;
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: state.toggleMute,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? ProtocolColors.crimson.withAlpha(32) : ProtocolColors.bgSurfaceElevated,
            border: Border.all(
              color: active ? ProtocolColors.crimson.withAlpha(130) : ProtocolColors.borderSubtle,
            ),
          ),
          child: Icon(
            active ? Icons.volume_up_rounded : Icons.volume_off_rounded,
            size: 16,
            color: active ? ProtocolColors.crimson : ProtocolColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
