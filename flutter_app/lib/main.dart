import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'l10n/i18n.dart';
import 'screens/home_screen.dart';
import 'screens/lab_screen.dart';
import 'screens/slots_screen.dart';
import 'services/audio_service.dart';
import 'state/protocol_state.dart';
import 'theme/protocol_theme.dart';
import 'widgets/ambient_cyber_bg.dart';
import 'widgets/hud_bar.dart';
import 'widgets/support_modal.dart';
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
  int _activeTab = 0; // 0 = HUB, 1 = SLOTS 777, 2 = NEURAL LAB
  int _labSubTab = 0; // 0 = 3D/Illusion, 1 = Mendel Lab, 2 = Projects/Terminal
  bool _pendingSupportModal = false;

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
    if (frag.isEmpty) return;
    final norm = frag.startsWith('/') ? frag : '/$frag';
    switch (norm) {
      case '/slots':
        _activeTab = 1;
        break;
      case '/illusion':
        _activeTab = 2;
        _labSubTab = 0;
        break;
      case '/lab':
        _activeTab = 2;
        _labSubTab = 1;
        break;
      case '/games':
        _activeTab = 2;
        _labSubTab = 2;
        break;
      case '/support':
        _activeTab = 0;
        _pendingSupportModal = true;
        break;
      default:
        _activeTab = 0;
    }
  }

  void _selectTab(int tab) {
    if (_activeTab == tab) return;
    setState(() => _activeTab = tab.clamp(0, 2));
  }

  void _navigateRoute(BuildContext context, String route) {
    switch (route) {
      case '/slots':
        _selectTab(1);
        break;
      case '/illusion':
        setState(() {
          _activeTab = 2;
          _labSubTab = 0;
        });
        break;
      case '/lab':
        setState(() {
          _activeTab = 2;
          _labSubTab = 1;
        });
        break;
      case '/games':
        setState(() {
          _activeTab = 2;
          _labSubTab = 2;
        });
        break;
      case '/support':
        _selectTab(0);
        SupportModal.show(context, _state);
        break;
      case '/':
      default:
        _selectTab(0);
    }
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
          activeTab: _activeTab,
          labSubTab: _labSubTab,
          openSupportOnMount: _pendingSupportModal,
          onSupportOpened: () => _pendingSupportModal = false,
          onSelectTab: _selectTab,
          onNavigateRoute: (r) => _navigateRoute(context, r),
        ),
      ),
    );
  }
}

class _ProtocolShell extends StatefulWidget {
  final ProtocolState state;
  final int activeTab;
  final int labSubTab;
  final bool openSupportOnMount;
  final VoidCallback onSupportOpened;
  final ValueChanged<int> onSelectTab;
  final ValueChanged<String> onNavigateRoute;

  const _ProtocolShell({
    required this.state,
    required this.activeTab,
    required this.labSubTab,
    required this.openSupportOnMount,
    required this.onSupportOpened,
    required this.onSelectTab,
    required this.onNavigateRoute,
  });

  @override
  State<_ProtocolShell> createState() => _ProtocolShellState();
}

class _ProtocolShellState extends State<_ProtocolShell> {
  @override
  void initState() {
    super.initState();
    if (widget.openSupportOnMount) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        widget.onSupportOpened();
        SupportModal.show(context, widget.state);
      });
    }
  }

  void _openTerminal(BuildContext context) {
    AudioService.click();
    showDialog<void>(
      context: context,
      builder: (_) => TerminalModal(
        state: widget.state,
        onNavigate: widget.onNavigateRoute,
      ),
    );
  }

  Widget _buildWorld() {
    switch (widget.activeTab) {
      case 1:
        return KeyedSubtree(
          key: const ValueKey('world_slots'),
          child: SlotsScreen(
            state: widget.state,
            onNavigate: widget.onNavigateRoute,
          ),
        );
      case 2:
        return KeyedSubtree(
          key: const ValueKey('world_lab'),
          child: LabScreen(
            state: widget.state,
            initialSubTab: widget.labSubTab,
            onSelectMainTab: widget.onSelectTab,
            onNavigate: widget.onNavigateRoute,
          ),
        );
      case 0:
      default:
        return KeyedSubtree(
          key: const ValueKey('world_hub'),
          child: HomeScreen(
            state: widget.state,
            onSelectTab: widget.onSelectTab,
            onNavigate: widget.onNavigateRoute,
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final toast = widget.state.pendingToast;

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
        backgroundColor: ProtocolColors.bgVoid,
        body: AmbientCyberBackground(
          child: SafeArea(
            child: Stack(
              children: [
                Column(
                  children: [
                    // Floating Glassmorphic Navigation Pill Header
                    HudBar(
                      state: widget.state,
                      activeTab: widget.activeTab,
                      onSelectTab: widget.onSelectTab,
                    ),

                    // Active World Content
                    Expanded(
                      child: SingleChildScrollView(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 220),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          child: _buildWorld(),
                        ),
                      ),
                    ),
                  ],
                ),

                // Achievement Unlocked Floating Toast Pill
                if (toast != null)
                  Positioned(
                    right: 18,
                    bottom: 18,
                    child: CyberPanel(
                      borderColor: ProtocolColors.gold.withAlpha(160),
                      backgroundColor: ProtocolColors.bgSurfaceElevated,
                      borderRadius: 16,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(toast.icon, style: const TextStyle(fontSize: 22)),
                          const SizedBox(width: 12),
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
                                style: ProtocolTheme.sans(size: 13, weight: FontWeight.w700),
                              ),
                            ],
                          ),
                          const SizedBox(width: 10),
                          IconButton(
                            icon: const Icon(Icons.close_rounded, size: 17, color: ProtocolColors.textSecondary),
                            onPressed: widget.state.dismissToast,
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
