import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';

class HomeScreen extends StatefulWidget {
  final ProtocolState state;
  final ValueChanged<String> onNavigate;

  const HomeScreen({
    super.key,
    required this.state,
    required this.onNavigate,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  GitSyncStatus? _syncStatus;
  bool _syncing = false;
  bool _copiedSite = false;

  @override
  void initState() {
    super.initState();
    _loadSync();
  }

  Future<void> _loadSync() async {
    final st = await ApiService.fetchSyncStatus();
    if (mounted) {
      setState(() => _syncStatus = st);
    }
  }

  Future<void> _pullGitHub() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    AudioService.click();
    final st = await ApiService.triggerGitHubPull();
    if (mounted) {
      setState(() {
        _syncStatus = st;
        _syncing = false;
      });
    }
  }

  void _openSocial(SocialEntry entry) {
    AudioService.click();
    if (entry.internal) {
      widget.onNavigate(entry.url);
    } else {
      WebBridge.openUrl(entry.url);
    }
  }

  IconData _iconForSocial(String id) {
    switch (id) {
      case 'twitch':
        return Icons.live_tv;
      case 'youtube':
        return Icons.play_circle_outline;
      case 'instagram':
        return Icons.camera_alt_outlined;
      case 'tiktok':
        return Icons.music_note;
      case 'growersim':
        return Icons.eco_outlined;
      case 'donation':
        return Icons.favorite_border;
      case 'games':
        return Icons.sports_esports_outlined;
      case 'support':
        return Icons.account_balance_wallet_outlined;
      default:
        return Icons.link;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 960),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Compact Hero Header (No heavy 3D, no blocking preloader)
              Column(
                children: [
                  Text(
                    I18n.t('title_main'),
                    textAlign: TextAlign.center,
                    style: ProtocolTheme.mono(
                      size: 28,
                      weight: FontWeight.w700,
                      color: ProtocolColors.crimson,
                      letterSpacing: 2.4,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    I18n.t('home_tagline'),
                    textAlign: TextAlign.center,
                    style: ProtocolTheme.mono(
                      size: 13,
                      color: ProtocolColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // STREAM 1: Social Aggregator & Highway (For Stream Viewers & Followers)
              CyberPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                I18n.t('stream1_title'),
                                style: ProtocolTheme.mono(
                                  size: 14,
                                  weight: FontWeight.w700,
                                  color: ProtocolColors.crimson,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                I18n.t('stream1_sub'),
                                style: ProtocolTheme.mono(
                                  size: 12,
                                  color: ProtocolColors.textDim,
                                ),
                              ),
                            ],
                          ),
                        ),
                        CyberButton(
                          label: _copiedSite ? I18n.t('copied') : 'BOZHEMAN.COM',
                          compact: true,
                          accentColor: _copiedSite ? ProtocolColors.emerald : ProtocolColors.crimson,
                          icon: _copiedSite ? Icons.check : Icons.copy,
                          onPressed: () {
                            WebBridge.copyText('https://bozheman.com');
                            AudioService.copy();
                            setState(() => _copiedSite = true);
                            Future.delayed(const Duration(seconds: 2), () {
                              if (mounted) setState(() => _copiedSite = false);
                            });
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final w = constraints.maxWidth;
                        final cols = w >= 720 ? 4 : (w >= 430 ? 2 : 1);
                        const spacing = 10.0;
                        final itemW = (w - spacing * (cols - 1)) / cols;
                        return Wrap(
                          spacing: spacing,
                          runSpacing: spacing,
                          children: ApiService.defaultSocials.map((entry) {
                            final label = entry.labelKey != null
                                ? I18n.t(entry.labelKey!)
                                : entry.label;
                            return SizedBox(
                              width: itemW,
                              child: CyberButton(
                                label: label,
                                icon: _iconForSocial(entry.id),
                                onPressed: () => _openSocial(entry),
                              ),
                            );
                          }).toList(),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // STREAM 2 + STREAM 3: Two balanced compact cards below the Social Highway
              LayoutBuilder(
                builder: (context, constraints) {
                  final wide = constraints.maxWidth >= 680;
                  final stream2 = _StreamCard(
                    title: I18n.t('stream2_title'),
                    subtitle: I18n.t('stream2_sub'),
                    accent: ProtocolColors.gold,
                    badge: '${widget.state.balance} ₿ // 0% REAL MONEY',
                    actions: [
                      CyberButton(
                        label: I18n.t('game_slots_play_btn'),
                        accentColor: ProtocolColors.gold,
                        filled: true,
                        icon: Icons.casino_outlined,
                        onPressed: () {
                          AudioService.click();
                          widget.onNavigate('/slots');
                        },
                      ),
                    ],
                  );

                  final stream3 = _StreamCard(
                    title: I18n.t('stream3_title'),
                    subtitle: I18n.t('stream3_sub'),
                    accent: ProtocolColors.emerald,
                    badge:
                        '3D CORE: ${widget.state.totalClicks3D}/10 • LORE: ${widget.state.weaverRead.length}/7',
                    actions: [
                      CyberButton(
                        label: I18n.t('nav_lab_short'),
                        compact: true,
                        accentColor: ProtocolColors.emerald,
                        icon: Icons.biotech_outlined,
                        onPressed: () {
                          AudioService.click();
                          widget.onNavigate('/lab');
                        },
                      ),
                      CyberButton(
                        label: I18n.t('nav_illusion_short'),
                        compact: true,
                        accentColor: ProtocolColors.crimson,
                        icon: Icons.hexagon_outlined,
                        onPressed: () {
                          AudioService.click();
                          widget.onNavigate('/illusion');
                        },
                      ),
                      CyberButton(
                        label: I18n.t('nav_games_short'),
                        compact: true,
                        accentColor: ProtocolColors.textSecondary,
                        icon: Icons.grid_view,
                        onPressed: () {
                          AudioService.click();
                          widget.onNavigate('/games');
                        },
                      ),
                    ],
                  );

                  if (wide) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: stream2),
                        const SizedBox(width: 14),
                        Expanded(child: stream3),
                      ],
                    );
                  }
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      stream2,
                      const SizedBox(height: 14),
                      stream3,
                    ],
                  );
                },
              ),
              const SizedBox(height: 16),

              // Lightweight Go Laptop-Server GitHub Sync Status Bar
              if (_syncStatus != null)
                CyberPanel(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Wrap(
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _syncStatus!.online
                                  ? ProtocolColors.emerald
                                  : ProtocolColors.gold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _syncStatus!.online
                                ? '${I18n.t('server_sync_label')}: ${_syncStatus!.branch}@${_syncStatus!.commit}'
                                : '${I18n.t('server_sync_label')}: STATIC MODE',
                            style: ProtocolTheme.mono(
                              size: 11,
                              color: ProtocolColors.textDim,
                            ),
                          ),
                        ],
                      ),
                      if (_syncStatus!.online)
                        CyberButton(
                          label: _syncing ? '...' : I18n.t('server_sync_btn'),
                          compact: true,
                          accentColor: ProtocolColors.emerald,
                          icon: Icons.sync,
                          onPressed: _syncing ? null : _pullGitHub,
                        ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StreamCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Color accent;
  final String badge;
  final List<Widget> actions;

  const _StreamCard({
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.badge,
    required this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return CyberPanel(
      borderColor: accent.withAlpha(80),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: accent.withAlpha(24),
              border: Border.all(color: accent.withAlpha(90)),
              borderRadius: BorderRadius.circular(2),
            ),
            child: Text(
              badge,
              style: ProtocolTheme.mono(size: 10, weight: FontWeight.w700, color: accent),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: ProtocolTheme.mono(size: 14, weight: FontWeight.w700, color: accent),
          ),
          const SizedBox(height: 5),
          Text(
            subtitle,
            style: ProtocolTheme.mono(size: 12, color: ProtocolColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: actions,
          ),
        ],
      ),
    );
  }
}
