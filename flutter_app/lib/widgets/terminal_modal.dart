import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';

class TerminalModal extends StatefulWidget {
  final ProtocolState state;
  final ValueChanged<String> onNavigate;

  const TerminalModal({
    super.key,
    required this.state,
    required this.onNavigate,
  });

  @override
  State<TerminalModal> createState() => _TerminalModalState();
}

class _TerminalModalState extends State<TerminalModal> {
  final TextEditingController _ctrl = TextEditingController();
  final ScrollController _scroll = ScrollController();

  static const List<String> _chips = [
    'help',
    'status',
    'hack',
    'slots',
    'lab',
    'illusion',
    'sync',
    'clear',
  ];

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _execute(String rawCmd) async {
    final cmd = rawCmd.trim().toLowerCase();
    if (cmd.isEmpty) return;
    _ctrl.clear();
    AudioService.click();
    widget.state.appendLog('root@bozheman:~# $cmd');

    switch (cmd) {
      case 'help':
        widget.state.appendLog(I18n.t('cli_help_header'), 'highlight');
        for (final key in [
          'cli_help_status',
          'cli_help_hack',
          'cli_help_slots',
          'cli_help_manual',
          'cli_help_illusion',
          'cli_help_nav',
          'cli_help_support',
          'cli_help_ach',
          'cli_help_crt',
          'cli_help_clear',
        ]) {
          widget.state.appendLog(I18n.t(key));
        }
        widget.state.appendLog('  sync         - Pull latest version from GitHub (Go Server)');
        widget.state.appendLog('  reset        - Reset local profile to 1000 ₿');
        break;

      case 'status':
        widget.state.appendLog('> ID: ${widget.state.growerId} | BAL: ${widget.state.balance} ₿', 'highlight');
        widget.state.appendLog('> SPINS: ${widget.state.spins} | WINRATE: ${widget.state.winrate.toStringAsFixed(1)}%');
        widget.state.appendLog('> ACHIEVEMENTS: ${widget.state.achievements.length}/8 | 3D CLICKS: ${widget.state.totalClicks3D}/10');
        break;

      case 'hack':
        widget.state.appendLog(I18n.t('cli_hack_start'));
        widget.state.executeHackCommand();
        break;

      case 'daily':
        if (!widget.state.claimDailyBonus()) {
          final rem = widget.state.remainingDailyWait();
          widget.state.appendLog('> WAIT ${rem.inHours}h ${rem.inMinutes % 60}m FOR NEXT DAILY BONUS.', 'warn');
        }
        break;

      case 'bot':
        widget.state.appendLog(I18n.t('cli_bot_opening'), 'highlight');
        WebBridge.openUrl('https://t.me/GrowerSim_bot');
        break;

      case 'home':
        Navigator.of(context).pop();
        widget.onNavigate('/');
        break;

      case 'games':
        Navigator.of(context).pop();
        widget.onNavigate('/games');
        break;

      case 'slots':
        Navigator.of(context).pop();
        widget.onNavigate('/slots');
        break;

      case 'manual':
      case 'lab':
        Navigator.of(context).pop();
        widget.onNavigate('/lab');
        break;

      case 'illusion':
        Navigator.of(context).pop();
        widget.onNavigate('/illusion');
        break;

      case 'support':
        Navigator.of(context).pop();
        widget.onNavigate('/support');
        break;

      case 'crt':
        widget.state.toggleCrt();
        widget.state.appendLog('> CRT: ${widget.state.crtEnabled ? "ON" : "OFF"}');
        break;

      case 'sound':
        widget.state.toggleMute();
        widget.state.appendLog('> AUDIO: ${widget.state.audioMuted ? "MUTED" : "ACTIVE"}');
        break;

      case 'ach':
      case 'achievements':
        for (final a in ProtocolState.achievementsCatalog) {
          final unlocked = widget.state.achievements.contains(a.id);
          widget.state.appendLog(
            '  [${unlocked ? "✓" : " "}] ${a.icon} ${I18n.t(a.titleKey)}',
            unlocked ? 'highlight' : 'sys',
          );
        }
        break;

      case 'sync':
        widget.state.appendLog('> REQUESTING GITHUB PULL ON GO NODE...');
        final st = await ApiService.triggerGitHubPull();
        widget.state.appendLog(
          '> NODE: ${st.online ? "ONLINE" : "STATIC"} | ${st.branch}@${st.commit} | ${st.lastResult}',
          st.lastError.isEmpty ? 'highlight' : 'err',
        );
        break;

      case 'reset':
        widget.state.resetProfile();
        break;

      case 'clear':
        widget.state.clearLogs();
        break;

      default:
        widget.state.appendLog(I18n.t('cli_unknown', {'cmd': cmd}), 'err');
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: ProtocolColors.surfaceDark,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: ProtocolColors.borderBright),
        borderRadius: BorderRadius.circular(4),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 720, maxHeight: 520),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.terminal, color: ProtocolColors.crimson, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'BOZHEMAN ≡ CLI',
                    style: ProtocolTheme.mono(
                      size: 14,
                      weight: FontWeight.w700,
                      color: ProtocolColors.crimson,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: ProtocolColors.textMuted, size: 18),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const Divider(color: ProtocolColors.borderSubtle),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: _chips
                    .map(
                      (c) => InkWell(
                        onTap: () => _execute(c),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            border: Border.all(color: ProtocolColors.borderSubtle),
                            color: ProtocolColors.surfaceElevated,
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Text(
                            c,
                            style: ProtocolTheme.mono(size: 11, color: ProtocolColors.gold),
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: ProtocolColors.bgPure,
                    border: Border.all(color: ProtocolColors.borderSubtle),
                  ),
                  child: AnimatedBuilder(
                    animation: widget.state,
                    builder: (_, _) => ListView.builder(
                      controller: _scroll,
                      itemCount: widget.state.logs.length,
                      itemBuilder: (_, idx) {
                        final entry = widget.state.logs[idx];
                        Color c = ProtocolColors.textSecondary;
                        if (entry.type == 'highlight') c = ProtocolColors.emerald;
                        if (entry.type == 'warn') c = ProtocolColors.gold;
                        if (entry.type == 'err') c = ProtocolColors.crimson;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 3),
                          child: SelectableText(
                            entry.text,
                            style: ProtocolTheme.mono(size: 12, color: c),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Text('~# ', style: ProtocolTheme.mono(size: 13, color: ProtocolColors.crimson)),
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      autofocus: true,
                      style: ProtocolTheme.mono(size: 13),
                      decoration: InputDecoration(
                        isDense: true,
                        hintText: I18n.t('term_placeholder'),
                        hintStyle: ProtocolTheme.mono(size: 12, color: ProtocolColors.textDim),
                        border: const OutlineInputBorder(
                          borderSide: BorderSide(color: ProtocolColors.borderSubtle),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: ProtocolColors.crimson),
                        ),
                      ),
                      onSubmitted: _execute,
                    ),
                  ),
                  const SizedBox(width: 8),
                  CyberButton(
                    label: 'RUN',
                    compact: true,
                    onPressed: () => _execute(_ctrl.text),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
