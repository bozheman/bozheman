import 'dart:async';
import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';
import '../widgets/slot_reels_painter.dart';

class SlotsScreen extends StatefulWidget {
  final ProtocolState state;
  final ValueChanged<String> onNavigate;

  const SlotsScreen({
    super.key,
    required this.state,
    required this.onNavigate,
  });

  @override
  State<SlotsScreen> createState() => _SlotsScreenState();
}

class _SlotsScreenState extends State<SlotsScreen> with SingleTickerProviderStateMixin {
  late final TextEditingController _betCtrl;
  late final AnimationController _spinAnim;

  final List<SlotSymbol> _reels = [slotSymbols[0], slotSymbols[0], slotSymbols[0]];
  List<bool> _reelSpinning = [false, false, false];
  bool _isSpinning = false;
  bool _autoSpin = false;
  String? _statusMsg;
  Color _statusColor = ProtocolColors.emerald;
  String _winId = '';
  Timer? _autoTimer;

  @override
  void initState() {
    super.initState();
    _betCtrl = TextEditingController(text: widget.state.lastBet);
    _spinAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..addListener(() {
        if (mounted) setState(() {});
      });
  }

  @override
  void dispose() {
    _autoTimer?.cancel();
    _spinAnim.dispose();
    _betCtrl.dispose();
    super.dispose();
  }

  int _parsedBet() => int.tryParse(_betCtrl.text.trim()) ?? 0;

  void _setBet(int val) {
    final maxBet = widget.state.balance.clamp(10, 99999);
    final next = val.clamp(10, maxBet);
    _betCtrl.text = next.toString();
    AudioService.click();
    setState(() {});
  }

  Future<void> _spin() async {
    if (_isSpinning) return;
    final bet = _parsedBet();
    if (bet < 10) {
      _showErr(I18n.t('slots_err_min_bet'));
      return;
    }
    if (bet > 99999) {
      _showErr(I18n.t('slots_err_max_bet'));
      return;
    }
    if (bet > widget.state.balance) {
      _showErr(I18n.t('slots_err_no_funds'));
      if (_autoSpin) setState(() => _autoSpin = false);
      return;
    }

    setState(() {
      _isSpinning = true;
      _reelSpinning = [true, true, true];
      _statusMsg = null;
      _winId = '';
    });

    widget.state.adjustBalance(-bet);
    AudioService.spinStart();
    _spinAnim.repeat();

    final outcome = await ApiService.spinSlots(bet);
    if (!mounted) return;

    final turbo = widget.state.turboSpin;
    final stepMs = turbo ? 120 : 340;

    await Future.delayed(Duration(milliseconds: stepMs));
    if (!mounted) return;
    setState(() {
      _reels[0] = outcome.reels[0];
      _reelSpinning[0] = false;
    });
    AudioService.snap();

    await Future.delayed(Duration(milliseconds: stepMs));
    if (!mounted) return;
    setState(() {
      _reels[1] = outcome.reels[1];
      _reelSpinning[1] = false;
    });
    AudioService.snap();

    await Future.delayed(Duration(milliseconds: stepMs));
    if (!mounted) return;
    _spinAnim.stop();
    setState(() {
      _reels[2] = outcome.reels[2];
      _reelSpinning[2] = false;
      _isSpinning = false;
    });
    AudioService.snap();

    if (outcome.win > 0) {
      widget.state.adjustBalance(outcome.win);
      if (outcome.outcome == 'jackpot') {
        AudioService.jackpot();
        _statusColor = ProtocolColors.gold;
        _statusMsg = '${I18n.t('slots_jackpot')} +${outcome.win} ₿ (x${outcome.multiplier})';
      } else {
        AudioService.win();
        _statusColor = ProtocolColors.emerald;
        final lbl = outcome.outcome == 'pair' ? I18n.t('slots_pair') : I18n.t('slots_win');
        _statusMsg = '$lbl +${outcome.win} ₿ (x${outcome.multiplier})';
      }
      _winId = outcome.outcome == 'pair' ? 'pair' : outcome.reels[0].id;
    } else {
      AudioService.lose();
      _statusColor = ProtocolColors.textDim;
      _statusMsg = I18n.t('slots_loss');
    }

    final glyphs = outcome.reels.map((r) => r.glyph).join(' ');
    widget.state.recordSpin(
      glyphs: glyphs,
      bet: bet,
      won: outcome.win,
      mult: outcome.multiplier,
      seedHash: outcome.hash,
    );

    if (_autoSpin && mounted) {
      _autoTimer?.cancel();
      _autoTimer = Timer(Duration(milliseconds: turbo ? 350 : 900), () {
        if (mounted && _autoSpin) _spin();
      });
    }
  }

  void _showErr(String msg) {
    AudioService.error();
    setState(() {
      _statusColor = ProtocolColors.crimson;
      _statusMsg = msg;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final dailyReady = s.canClaimDaily();
    final rem = s.remainingDailyWait();
    final dailyLabel = dailyReady
        ? I18n.t('slots_daily_btn')
        : I18n.t('slots_daily_wait', {'h': rem.inHours, 'm': rem.inMinutes % 60});

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 940),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Zero-Money Free-To-Play Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: ProtocolColors.gold.withAlpha(20),
                  border: Border.all(color: ProtocolColors.gold.withAlpha(110)),
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_user_outlined, color: ProtocolColors.gold, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        I18n.t('slots_free_badge'),
                        style: ProtocolTheme.mono(
                          size: 11,
                          weight: FontWeight.w700,
                          color: ProtocolColors.gold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // 6-Cell Symmetric Telemetry Stats Bar
              LayoutBuilder(
                builder: (_, c) {
                  final cols = c.maxWidth >= 680 ? 6 : (c.maxWidth >= 380 ? 3 : 2);
                  const gap = 8.0;
                  final cellW = (c.maxWidth - gap * (cols - 1)) / cols;
                  final items = [
                    (I18n.t('slots_balance'), '${s.balance} ₿', ProtocolColors.gold),
                    (I18n.t('slots_spins'), '${s.spins}', ProtocolColors.textPrimary),
                    (I18n.t('slots_last_bet'), s.lastBet, ProtocolColors.textPrimary),
                    (I18n.t('slots_winrate'), '${s.winrate.toStringAsFixed(1)}%', ProtocolColors.emerald),
                    (I18n.t('slots_max_win'), '${s.maxWin}', ProtocolColors.gold),
                    (I18n.t('slots_streak'), '${s.currentStreak}', ProtocolColors.crimson),
                  ];
                  return Wrap(
                    spacing: gap,
                    runSpacing: gap,
                    children: items
                        .map(
                          (it) => SizedBox(
                            width: cellW,
                            child: CyberPanel(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    it.$1,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: ProtocolTheme.mono(size: 10, color: ProtocolColors.textDim),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    it.$2,
                                    style: ProtocolTheme.mono(
                                      size: 14,
                                      weight: FontWeight.w700,
                                      color: it.$3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  );
                },
              ),
              const SizedBox(height: 14),

              // Machine Cabinet: Reels + Pay Table + Controls
              CyberPanel(
                borderColor: ProtocolColors.borderBright,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        for (var i = 0; i < 3; i++) ...[
                          Expanded(
                            child: SlotReelWidget(
                              targetSymbol: _reels[i],
                              spinning: _reelSpinning[i],
                              reelIndex: i,
                              spinTick: _spinAnim.value,
                              highlighted: _winId.isNotEmpty && !_isSpinning,
                            ),
                          ),
                          if (i < 2) const SizedBox(width: 10),
                        ],
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Outcome Status Banner
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      decoration: BoxDecoration(
                        color: ProtocolColors.bgPure,
                        border: Border.all(
                          color: _statusMsg != null
                              ? _statusColor.withAlpha(140)
                              : ProtocolColors.borderSubtle,
                        ),
                      ),
                      child: Text(
                        _statusMsg ?? I18n.t('slots_title'),
                        textAlign: TextAlign.center,
                        style: ProtocolTheme.mono(
                          size: 13,
                          weight: FontWeight.w700,
                          color: _statusMsg != null ? _statusColor : ProtocolColors.textMuted,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Pay Table Strip
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      alignment: WrapAlignment.center,
                      children: [
                        _payChip('seven', '7 7 7', 'x10'),
                        _payChip('star', '★ ★ ★', 'x7'),
                        _payChip('omega', 'Ω Ω Ω', 'x5'),
                        _payChip('triangle', '▲ ▲ ▲', 'x3'),
                        _payChip('square', '■ ■ ■', 'x2'),
                        _payChip('pair', I18n.t('slots_any2'), 'x1.5'),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Bet Input + Chips
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CyberButton(
                          label: '-',
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(_parsedBet() - 10),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 150,
                          child: TextField(
                            controller: _betCtrl,
                            enabled: !_isSpinning,
                            textAlign: TextAlign.center,
                            keyboardType: TextInputType.number,
                            style: ProtocolTheme.mono(
                              size: 15,
                              weight: FontWeight.w700,
                              color: ProtocolColors.gold,
                            ),
                            decoration: InputDecoration(
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                              border: const OutlineInputBorder(
                                borderSide: BorderSide(color: ProtocolColors.borderBright),
                              ),
                              focusedBorder: const OutlineInputBorder(
                                borderSide: BorderSide(color: ProtocolColors.gold),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        CyberButton(
                          label: '+',
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(_parsedBet() + 10),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      alignment: WrapAlignment.center,
                      children: [
                        CyberButton(
                          label: I18n.t('slots_min'),
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(10),
                        ),
                        CyberButton(
                          label: I18n.t('slots_half'),
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet((_parsedBet() ~/ 2)),
                        ),
                        CyberButton(
                          label: I18n.t('slots_double'),
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(_parsedBet() * 2),
                        ),
                        CyberButton(
                          label: '+50',
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(_parsedBet() + 50),
                        ),
                        CyberButton(
                          label: '+100',
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(_parsedBet() + 100),
                        ),
                        CyberButton(
                          label: I18n.t('slots_max'),
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(s.balance),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Mode Row
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        CyberButton(
                          label: s.turboSpin ? I18n.t('slots_turbo_on') : I18n.t('slots_turbo_off'),
                          compact: true,
                          filled: s.turboSpin,
                          accentColor: s.turboSpin ? ProtocolColors.gold : ProtocolColors.textDim,
                          onPressed: s.toggleTurbo,
                        ),
                        CyberButton(
                          label: _autoSpin ? I18n.t('slots_auto_on') : I18n.t('slots_auto_off'),
                          compact: true,
                          filled: _autoSpin,
                          accentColor: _autoSpin ? ProtocolColors.emerald : ProtocolColors.textDim,
                          onPressed: () {
                            AudioService.click();
                            setState(() => _autoSpin = !_autoSpin);
                            if (!_autoSpin) {
                              _autoTimer?.cancel();
                            } else if (!_isSpinning) {
                              _spin();
                            }
                          },
                        ),
                        CyberButton(
                          label: dailyLabel,
                          compact: true,
                          accentColor: dailyReady ? ProtocolColors.emerald : ProtocolColors.textDim,
                          onPressed: dailyReady
                              ? () {
                                  s.claimDailyBonus();
                                  setState(() {
                                    _statusColor = ProtocolColors.emerald;
                                    _statusMsg = I18n.t('slots_daily_claimed');
                                  });
                                }
                              : null,
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // SPIN & Free Refill CTA
                    if (s.balance < 10 && !_isSpinning)
                      CyberButton(
                        label: I18n.t('slots_refill_btn'),
                        filled: true,
                        accentColor: ProtocolColors.emerald,
                        icon: Icons.add_circle_outline,
                        onPressed: () {
                          s.refillFreeCoins();
                          setState(() {
                            _statusColor = ProtocolColors.emerald;
                            _statusMsg = I18n.t('slots_refill_success');
                          });
                        },
                      )
                    else
                      CyberButton(
                        label: _isSpinning ? '...' : I18n.t('slots_spin_btn'),
                        filled: true,
                        accentColor: ProtocolColors.crimson,
                        icon: Icons.play_arrow,
                        onPressed: _isSpinning ? null : _spin,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Provably Fair SHA-256 Bar
              InkWell(
                onTap: () {
                  final seed = s.lastSeed ?? 'SHA256::GENESIS';
                  WebBridge.copyText(seed);
                  AudioService.copy();
                  setState(() {
                    _statusColor = ProtocolColors.emerald;
                    _statusMsg = I18n.t('slots_seed_copied');
                  });
                },
                child: CyberPanel(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.verified_outlined, color: ProtocolColors.emerald, size: 15),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${I18n.t('slots_fair_seed')} ${s.lastSeed ?? "SHA256::READY"}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textSecondary),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        I18n.t('copy_btn'),
                        style: ProtocolTheme.mono(size: 10, color: ProtocolColors.gold),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Transaction History
              CyberPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Text(
                          I18n.t('slots_history'),
                          style: ProtocolTheme.mono(
                            size: 12,
                            weight: FontWeight.w700,
                            color: ProtocolColors.crimson,
                          ),
                        ),
                        const Spacer(),
                        if (s.history.isNotEmpty)
                          CyberButton(
                            label: I18n.t('slots_clear_history'),
                            compact: true,
                            onPressed: s.clearHistory,
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (s.history.isEmpty)
                      Text(
                        I18n.t('slots_history_empty'),
                        style: ProtocolTheme.mono(size: 12, color: ProtocolColors.textDim),
                      )
                    else
                      for (final item in s.history.take(8))
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            children: [
                              Text(
                                item.time,
                                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textDim),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                '[${item.glyphs}]',
                                style: ProtocolTheme.mono(
                                  size: 12,
                                  weight: FontWeight.w700,
                                  color: item.won > 0 ? ProtocolColors.gold : ProtocolColors.textSecondary,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                item.won > 0 ? '+${item.won} ₿ (x${item.mult})' : '-${item.bet} ₿',
                                style: ProtocolTheme.mono(
                                  size: 12,
                                  weight: FontWeight.w700,
                                  color: item.won > 0 ? ProtocolColors.emerald : ProtocolColors.crimson,
                                ),
                              ),
                            ],
                          ),
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

  Widget _payChip(String id, String sym, String mult) {
    final active = _winId == id;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: active ? ProtocolColors.gold.withAlpha(35) : ProtocolColors.bgPure,
        border: Border.all(
          color: active ? ProtocolColors.gold : ProtocolColors.borderSubtle,
        ),
        borderRadius: BorderRadius.circular(2),
      ),
      child: Text(
        '$sym • $mult',
        style: ProtocolTheme.mono(
          size: 11,
          weight: FontWeight.w700,
          color: active ? ProtocolColors.gold : ProtocolColors.textSecondary,
        ),
      ),
    );
  }
}
