import 'dart:async';
import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';
import '../widgets/qr_painter.dart';

class GamesScreen extends StatefulWidget {
  final ProtocolState state;
  final ValueChanged<String> onNavigate;

  const GamesScreen({
    super.key,
    required this.state,
    required this.onNavigate,
  });

  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  String _filter = 'all';
  String _query = '';
  bool _notified = false;
  late Timer _countdownTimer;
  Duration _remaining = Duration.zero;

  static final DateTime _targetRelease = DateTime.utc(2026, 12, 31, 20, 0, 0);

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining());
  }

  void _updateRemaining() {
    final diff = _targetRelease.difference(DateTime.now().toUtc());
    if (mounted) {
      setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
    }
  }

  @override
  void dispose() {
    _countdownTimer.cancel();
    super.dispose();
  }

  String _formatCountdown() {
    if (_remaining == Duration.zero) return I18n.t('game_1_timer_soon');
    final d = _remaining.inDays;
    final h = (_remaining.inHours % 24).toString().padLeft(2, '0');
    final m = (_remaining.inMinutes % 60).toString().padLeft(2, '0');
    final s = (_remaining.inSeconds % 60).toString().padLeft(2, '0');
    return '${d}d ${h}h ${m}m ${s}s';
  }

  void _showBotQr() {
    AudioService.click();
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: ProtocolColors.surfaceDark,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: ProtocolColors.borderBright),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                I18n.t('qr_bot_modal_title'),
                style: ProtocolTheme.mono(size: 14, weight: FontWeight.w700, color: ProtocolColors.emerald),
              ),
              const SizedBox(height: 14),
              const QrCodeWidget(
                data: 'https://t.me/GrowerSim_bot',
                size: 196,
                moduleColor: ProtocolColors.emerald,
              ),
              const SizedBox(height: 12),
              Text('@GrowerSim_bot', style: ProtocolTheme.mono(size: 13, color: ProtocolColors.textPrimary)),
              const SizedBox(height: 12),
              CyberButton(
                label: I18n.t('qr_close'),
                compact: true,
                onPressed: () => Navigator.of(ctx).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cards = [
      (
        id: 'slots',
        cat: 'web',
        code: '#MOD-00',
        status: I18n.t('game_slots_status'),
        statusColor: ProtocolColors.emerald,
        title: I18n.t('game_slots_title'),
        desc: I18n.t('game_slots_desc'),
        tags: ['tag_canvas', 'tag_webaudio', 'tag_fair', 'tag_jackpot'],
        extra: '${I18n.t('top_balance')}: ${widget.state.balance} ₿',
        actions: [
          CyberButton(
            label: I18n.t('game_slots_play_btn'),
            compact: true,
            filled: true,
            accentColor: ProtocolColors.gold,
            onPressed: () {
              AudioService.click();
              widget.onNavigate('/slots');
            },
          ),
        ],
      ),
      (
        id: 'growersim',
        cat: 'bot',
        code: '#MOD-01',
        status: I18n.t('game_growersim_status'),
        statusColor: ProtocolColors.emerald,
        title: I18n.t('game_growersim_title'),
        desc: I18n.t('game_growersim_desc'),
        tags: ['tag_aiogram', 'tag_genetics', 'tag_p2p', 'tag_cup'],
        extra: I18n.t('game_growersim_footnote'),
        actions: [
          CyberButton(
            label: I18n.t('game_growersim_bot_btn'),
            compact: true,
            filled: true,
            accentColor: ProtocolColors.emerald,
            onPressed: () {
              AudioService.click();
              WebBridge.openUrl('https://t.me/GrowerSim_bot');
            },
          ),
          CyberButton(
            label: I18n.t('game_growersim_manual_btn'),
            compact: true,
            onPressed: () {
              AudioService.click();
              widget.onNavigate('/lab');
            },
          ),
          CyberButton(
            label: I18n.t('game_growersim_qr_btn'),
            compact: true,
            onPressed: _showBotQr,
          ),
        ],
      ),
      (
        id: 'terminus',
        cat: 'dev',
        code: '#MOD-02',
        status: I18n.t('game_1_status'),
        statusColor: ProtocolColors.gold,
        title: I18n.t('game_1_title'),
        desc: I18n.t('game_1_desc'),
        tags: ['tag_rpg', 'tag_netrun', 'tag_firebase'],
        extra: '${I18n.t('game_1_timer')} ${_formatCountdown()}',
        actions: [
          CyberButton(
            label: _notified ? I18n.t('game_1_btn_subscribed') : I18n.t('game_1_btn'),
            compact: true,
            accentColor: _notified ? ProtocolColors.emerald : ProtocolColors.crimson,
            onPressed: () {
              AudioService.click();
              setState(() => _notified = true);
            },
          ),
        ],
      ),
      (
        id: 'nebula',
        cat: 'dev',
        code: '#MOD-03',
        status: I18n.t('game_3_status'),
        statusColor: ProtocolColors.crimson,
        title: I18n.t('game_3_title'),
        desc: I18n.t('game_3_desc'),
        tags: ['tag_three', 'tag_shaders', 'tag_procedural'],
        extra: I18n.t('game_3_footnote'),
        actions: [
          CyberButton(
            label: I18n.t('game_3_lab_btn'),
            compact: true,
            accentColor: ProtocolColors.emerald,
            onPressed: () {
              AudioService.click();
              widget.onNavigate('/lab');
            },
          ),
        ],
      ),
    ];

    final q = _query.trim().toLowerCase();
    final visible = cards.where((c) {
      if (_filter != 'all' && c.cat != _filter) return false;
      if (q.isEmpty) return true;
      return c.title.toLowerCase().contains(q) ||
          c.desc.toLowerCase().contains(q) ||
          c.tags.any((tk) => I18n.t(tk).toLowerCase().contains(q));
    }).toList();

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 960),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                I18n.t('games_title'),
                style: ProtocolTheme.mono(size: 20, weight: FontWeight.w700, color: ProtocolColors.crimson),
              ),
              const SizedBox(height: 4),
              Text(I18n.t('games_ticker'), style: ProtocolTheme.mono(size: 11, color: ProtocolColors.emerald)),
              const SizedBox(height: 12),

              // Search & Filter Controls
              TextField(
                style: ProtocolTheme.mono(size: 13),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search, color: ProtocolColors.crimson, size: 18),
                  hintText: I18n.t('search_placeholder'),
                  hintStyle: ProtocolTheme.mono(size: 12, color: ProtocolColors.textDim),
                  border: const OutlineInputBorder(
                    borderSide: BorderSide(color: ProtocolColors.borderSubtle),
                  ),
                ),
                onChanged: (v) => setState(() => _query = v),
              ),
              const SizedBox(height: 10),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ('all', I18n.t('filter_all')),
                  ('bot', I18n.t('filter_bots')),
                  ('web', I18n.t('filter_web')),
                  ('dev', I18n.t('filter_dev')),
                ]
                    .map(
                      (f) => CyberButton(
                        label: f.$2,
                        compact: true,
                        filled: _filter == f.$1,
                        accentColor: _filter == f.$1 ? ProtocolColors.crimson : ProtocolColors.textDim,
                        onPressed: () {
                          AudioService.click();
                          setState(() => _filter = f.$1);
                        },
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 14),

              if (visible.isEmpty)
                CyberPanel(
                  child: Text(
                    I18n.t('search_no_results'),
                    style: ProtocolTheme.mono(size: 12, color: ProtocolColors.textMuted),
                  ),
                )
              else
                LayoutBuilder(
                  builder: (_, c) {
                    final wide = c.maxWidth >= 680;
                    final cardW = wide ? (c.maxWidth - 14) / 2 : c.maxWidth;
                    return Wrap(
                      spacing: 14,
                      runSpacing: 14,
                      children: visible.map((card) {
                        return SizedBox(
                          width: cardW,
                          child: CyberPanel(
                            borderColor: card.statusColor.withAlpha(90),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      card.status,
                                      style: ProtocolTheme.mono(
                                        size: 11,
                                        weight: FontWeight.w700,
                                        color: card.statusColor,
                                      ),
                                    ),
                                    const Spacer(),
                                    Text(card.code, style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textDim)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  card.title,
                                  style: ProtocolTheme.mono(
                                    size: 15,
                                    weight: FontWeight.w700,
                                    color: ProtocolColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  card.desc,
                                  style: ProtocolTheme.mono(
                                    size: 12,
                                    color: ProtocolColors.textSecondary,
                                    height: 1.45,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: card.tags
                                      .map(
                                        (tk) => Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: ProtocolColors.bgPure,
                                            border: Border.all(color: ProtocolColors.borderSubtle),
                                          ),
                                          child: Text(
                                            I18n.t(tk),
                                            style: ProtocolTheme.mono(size: 10, color: ProtocolColors.textMuted),
                                          ),
                                        ),
                                      )
                                      .toList(),
                                ),
                                const SizedBox(height: 12),
                                Wrap(spacing: 8, runSpacing: 8, children: card.actions),
                                const SizedBox(height: 10),
                                Text(
                                  card.extra,
                                  style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textDim),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
