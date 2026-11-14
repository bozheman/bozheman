import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'l10n/i18n.dart';
import 'screens/games_screen.dart';
import 'screens/home_screen.dart';
import 'screens/illusion_screen.dart';
import 'screens/lab_screen.dart';
import 'screens/slots_screen.dart';
import 'screens/support_screen.dart';
import 'services/audio_service.dart';
import 'state/protocol_state.dart';
import 'theme/protocol_theme.dart';
import 'widgets/achievements_modal.dart';
import 'widgets/terminal_modal.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BozhemanProtocolApp());
}

class BozhemanProtocolApp extends StatefulWidget {
  final ProtocolState? injectedState;

  const BozhemanProtocolApp({super.key, this.injectedState});

  @override
  State<BozhemanProtocolApp> createState() => _BozhemanProtocolAppState();
}

class _BozhemanProtocolAppState extends State<BozhemanProtocolApp> {
  late final ProtocolState _state;
  String _route = '/';

  @override
  void initState() {
    super.initState();
    _state = widget.injectedState ?? ProtocolState();
    _resolveInitialFragment();
    if (widget.injectedState == null) {
      _state.init();
    }
  }

  void _resolveInitialFragment() {
    final frag = Uri.base.fragment;
    if (frag.isNotEmpty) {
      final norm = frag.startsWith('/') ? frag : '/$frag';
      if (const ['/', '/slots', '/lab', '/illusion', '/games', '/support'].contains(norm)) {
        _route = norm;
      }
    }
  }

  void _navigate(String route) {
    if (_route == route) return;
    setState(() => _route = route);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BOZHEMAN ≡ PROTOCOL',
      debugShowCheckedModeBanner: false,
      theme: ProtocolTheme.build(),
      home: AnimatedBuilder(
        animation: _state,
        builder: (context, _) => _ProtocolShell(
          state: _state,
          route: _route,
          onNavigate: _navigate,
        ),
      ),
    );
  }
}

class _ProtocolShell extends StatelessWidget {
  final ProtocolState state;
  final String route;
  final ValueChanged<String> onNavigate;

  const _ProtocolShell({
    required this.state,
    required this.route,
    required this.onNavigate,
  });

  void _openTerminal(BuildContext context) {
    AudioService.click();
    showDialog<void>(
      context: context,
      builder: (_) => TerminalModal(
        state: state,
        onNavigate: onNavigate,
      ),
    );
  }

  void _openAchievements(BuildContext context) {
    AudioService.click();
    showDialog<void>(
      context: context,
      builder: (_) => AchievementsModal(state: state),
    );
  }

  Widget _buildBody() {
    switch (route) {
      case '/slots':
        return SlotsScreen(state: state, onNavigate: onNavigate);
      case '/lab':
        return LabScreen(state: state);
      case '/illusion':
        return IllusionScreen(state: state);
      case '/games':
        return GamesScreen(state: state, onNavigate: onNavigate);
      case '/support':
        return SupportScreen(state: state);
      case '/':
      default:
        return HomeScreen(state: state, onNavigate: onNavigate);
    }
  }

  @override
  Widget build(BuildContext context) {
    final toast = state.pendingToast;

    return Focus(
      autofocus: false,
      onKeyEvent: (_, evt) {
        if (evt is! KeyDownEvent) return KeyEventResult.ignored;
        final focusedWidget = FocusManager.instance.primaryFocus?.context?.widget;
        if (focusedWidget is EditableText) return KeyEventResult.ignored;

        if (evt.character == '~' || evt.character == '`') {
          _openTerminal(context);
          return KeyEventResult.handled;
        }
        return KeyEventResult.ignored;
      },
      child: Scaffold(
        backgroundColor: ProtocolColors.bgPure,
        body: SafeArea(
          child: Stack(
            children: [
              Column(
                children: [
                  // Top Telemetry & Navigation Bar
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: const BoxDecoration(
                      color: ProtocolColors.surfaceDark,
                      border: Border(
                        bottom: BorderSide(color: ProtocolColors.borderSubtle),
                      ),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            // Node Identity
                            InkWell(
                              onTap: () => onNavigate('/'),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 7,
                                    height: 7,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: ProtocolColors.emerald,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    state.growerId,
                                    style: ProtocolTheme.mono(
                                      size: 12,
                                      weight: FontWeight.w700,
                                      color: ProtocolColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Spacer(),
                            // Virtual Credits Chip
                            InkWell(
                              onTap: () => onNavigate('/slots'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                decoration: BoxDecoration(
                                  color: ProtocolColors.bgPure,
                                  border: Border.all(color: ProtocolColors.gold.withAlpha(110)),
                                  borderRadius: BorderRadius.circular(2),
                                ),
                                child: Text(
                                  '${state.balance} ₿',
                                  style: ProtocolTheme.mono(
                                    size: 12,
                                    weight: FontWeight.w700,
                                    color: ProtocolColors.gold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Language Dropdown (8 languages)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6),
                              decoration: BoxDecoration(
                                color: ProtocolColors.bgPure,
                                border: Border.all(color: ProtocolColors.borderSubtle),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: state.lang,
                                  isDense: true,
                                  dropdownColor: ProtocolColors.surfaceElevated,
                                  style: ProtocolTheme.mono(size: 11),
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
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Primary Route Tabs + HUD Controls
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _NavTab(
                                label: I18n.t('nav_home_short'),
                                active: route == '/',
                                onTap: () {
                                  AudioService.click();
                                  onNavigate('/');
                                },
                              ),
                              _NavTab(
                                label: I18n.t('nav_slots_short'),
                                active: route == '/slots',
                                accent: ProtocolColors.gold,
                                onTap: () {
                                  AudioService.click();
                                  onNavigate('/slots');
                                },
                              ),
                              _NavTab(
                                label: I18n.t('nav_lab_short'),
                                active: route == '/lab',
                                accent: ProtocolColors.emerald,
                                onTap: () {
                                  AudioService.click();
                                  onNavigate('/lab');
                                },
                              ),
                              _NavTab(
                                label: I18n.t('nav_illusion_short'),
                                active: route == '/illusion',
                                onTap: () {
                                  AudioService.click();
                                  onNavigate('/illusion');
                                },
                              ),
                              _NavTab(
                                label: I18n.t('nav_games_short'),
                                active: route == '/games',
                                onTap: () {
                                  AudioService.click();
                                  onNavigate('/games');
                                },
                              ),
                              _NavTab(
                                label: I18n.t('nav_support_short'),
                                active: route == '/support',
                                onTap: () {
                                  AudioService.click();
                                  onNavigate('/support');
                                },
                              ),
                              const SizedBox(width: 12),
                              _HudMiniBtn(
                                label: state.crtEnabled ? 'CRT:ON' : 'CRT:OFF',
                                active: state.crtEnabled,
                                onTap: state.toggleCrt,
                              ),
                              _HudMiniBtn(
                                label: state.audioMuted ? 'SFX:OFF' : 'SFX:ON',
                                active: !state.audioMuted,
                                onTap: state.toggleMute,
                              ),
                              _HudMiniBtn(
                                label: '🏆 ${state.achievements.length}/8',
                                active: false,
                                accent: ProtocolColors.gold,
                                onTap: () => _openAchievements(context),
                              ),
                              _HudMiniBtn(
                                label: '>_ CLI',
                                active: false,
                                onTap: () => _openTerminal(context),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Active Screen Body
                  Expanded(
                    child: SingleChildScrollView(
                      child: _buildBody(),
                    ),
                  ),
                ],
              ),

              // Achievement Unlocked Toast
              if (toast != null)
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: CyberPanel(
                    borderColor: ProtocolColors.gold,
                    backgroundColor: ProtocolColors.surfaceElevated,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(toast.icon, style: const TextStyle(fontSize: 20)),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              I18n.t('ach_unlocked'),
                              style: ProtocolTheme.mono(
                                size: 10,
                                weight: FontWeight.w700,
                                color: ProtocolColors.gold,
                              ),
                            ),
                            Text(
                              I18n.t(toast.titleKey),
                              style: ProtocolTheme.mono(size: 12, weight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(width: 10),
                        IconButton(
                          icon: const Icon(Icons.close, size: 16, color: ProtocolColors.textDim),
                          onPressed: state.dismissToast,
                        ),
                      ],
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

class _NavTab extends StatelessWidget {
  final String label;
  final bool active;
  final Color accent;
  final VoidCallback onTap;

  const _NavTab({
    required this.label,
    required this.active,
    this.accent = ProtocolColors.crimson,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: active ? accent.withAlpha(35) : ProtocolColors.bgPure,
            border: Border(
              top: BorderSide(color: active ? accent : ProtocolColors.borderSubtle, width: 2),
              left: BorderSide(color: active ? accent.withAlpha(140) : ProtocolColors.borderSubtle),
              right: BorderSide(color: active ? accent.withAlpha(140) : ProtocolColors.borderSubtle),
              bottom: BorderSide(color: active ? accent.withAlpha(140) : ProtocolColors.borderSubtle),
            ),
          ),
          child: Text(
            label,
            style: ProtocolTheme.mono(
              size: 11,
              weight: FontWeight.w700,
              color: active ? ProtocolColors.textPrimary : ProtocolColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _HudMiniBtn extends StatelessWidget {
  final String label;
  final bool active;
  final Color accent;
  final VoidCallback onTap;

  const _HudMiniBtn({
    required this.label,
    required this.active,
    this.accent = ProtocolColors.emerald,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          decoration: BoxDecoration(
            color: active ? accent.withAlpha(25) : ProtocolColors.bgPure,
            border: Border.all(color: active ? accent : ProtocolColors.borderSubtle),
          ),
          child: Text(
            label,
            style: ProtocolTheme.mono(
              size: 10,
              weight: FontWeight.w700,
              color: active ? accent : ProtocolColors.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}
