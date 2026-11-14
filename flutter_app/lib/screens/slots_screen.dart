import 'dart:async';
import 'dart:math';
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
  final ValueChanged<String>? onNavigate;

  const SlotsScreen({
    super.key,
    required this.state,
    this.onNavigate,
  });

  @override
  State<SlotsScreen> createState() => _SlotsScreenState();
}

class _SlotsScreenState extends State<SlotsScreen> with TickerProviderStateMixin {
  late final TextEditingController _betCtrl;
  late final AnimationController _spinAnim;
  late final AnimationController _winFxAnim;

  final List<SlotSymbol> _reels = [slotSymbols[0], slotSymbols[0], slotSymbols[0]];
  List<bool> _reelSpinning = [false, false, false];
  bool _isSpinning = false;
  bool _autoSpin = false;
  bool _showDetails = false;
  String? _statusMsg;
  Color _statusColor = ProtocolColors.emerald;
  String _winId = '';
  bool _isJackpotWin = false;
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
    _winFxAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..addListener(() {
        if (mounted) setState(() {});
      });
  }

  @override
  void dispose() {
    _autoTimer?.cancel();
    _spinAnim.dispose();
    _winFxAnim.dispose();
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
      _isJackpotWin = false;
    });

    widget.state.adjustBalance(-bet);
    AudioService.spinStart();
    _spinAnim.repeat();

    final outcome = await ApiService.spinSlots(bet);
    if (!mounted) return;

    final turbo = widget.state.turboSpin;
    final stepMs = turbo ? 120 : 320;

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
      _isJackpotWin = outcome.outcome == 'jackpot';
      _winFxAnim.forward(from: 0.0);
      if (_isJackpotWin) {
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
      _autoTimer = Timer(Duration(milliseconds: turbo ? 360 : 880), () {
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
        constraints: const BoxConstraints(maxWidth: 920),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── TOP WALLET & TELEMETRY STRIP ──
              BentoCard(
                accentColor: ProtocolColors.gold,
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
                borderRadius: 22,
                child: Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 16,
                  runSpacing: 12,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          I18n.t('slots_free_badge'),
                          style: ProtocolTheme.mono(
                            size: 10.5,
                            weight: FontWeight.w700,
                            color: ProtocolColors.textSecondary,
                            letterSpacing: 0.7,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '${s.balance}',
                              style: ProtocolTheme.display(
                                size: 32,
                                color: ProtocolColors.gold,
                                letterSpacing: -0.6,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '₿',
                              style: ProtocolTheme.mono(
                                size: 18,
                                weight: FontWeight.w700,
                                color: ProtocolColors.gold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        _StatChip(label: I18n.t('slots_winrate'), value: '${s.winrate.toStringAsFixed(1)}%', accent: ProtocolColors.emerald),
                        _StatChip(label: I18n.t('slots_max_win'), value: '${s.maxWin} ₿', accent: ProtocolColors.gold),
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
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // ── ARCADE MACHINE CABINET ──
              BentoCard(
                accentColor: _winId.isNotEmpty ? ProtocolColors.gold : ProtocolColors.crimson,
                highlightBorder: _winId.isNotEmpty,
                padding: const EdgeInsets.all(24),
                borderRadius: 24,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 3 Cylindrical Reels + Win Particle Overlay
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: ProtocolColors.bgVoid,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: ProtocolColors.borderSubtle),
                          ),
                          child: Row(
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
                                if (i < 2) const SizedBox(width: 12),
                              ],
                            ],
                          ),
                        ),
                        if (_winFxAnim.isAnimating)
                          Positioned.fill(
                            child: IgnorePointer(
                              child: CustomPaint(
                                painter: _WinParticlesPainter(
                                  progress: _winFxAnim.value,
                                  isJackpot: _isJackpotWin,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Dynamic Result Pill
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 16),
                      decoration: BoxDecoration(
                        color: _statusMsg != null
                            ? _statusColor.withAlpha(22)
                            : ProtocolColors.bgVoid.withAlpha(180),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _statusMsg != null
                              ? _statusColor.withAlpha(120)
                              : ProtocolColors.borderSubtle,
                        ),
                      ),
                      child: Text(
                        _statusMsg ?? I18n.t('slots_title'),
                        textAlign: TextAlign.center,
                        style: ProtocolTheme.sans(
                          size: 14,
                          weight: FontWeight.w700,
                          color: _statusMsg != null ? _statusColor : ProtocolColors.textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Bet Stepper + Input
                    LayoutBuilder(
                      builder: (_, c) {
                        return Wrap(
                          alignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            CyberButton(
                              label: '−',
                              compact: true,
                              onPressed: _isSpinning ? null : () => _setBet(_parsedBet() - 10),
                            ),
                            SizedBox(
                              width: min(170, c.maxWidth * 0.55),
                              child: TextField(
                                controller: _betCtrl,
                                enabled: !_isSpinning,
                                textAlign: TextAlign.center,
                                keyboardType: TextInputType.number,
                                style: ProtocolTheme.mono(
                                  size: 16,
                                  weight: FontWeight.w700,
                                  color: ProtocolColors.gold,
                                ),
                                decoration: InputDecoration(
                                  isDense: true,
                                  filled: true,
                                  fillColor: ProtocolColors.bgVoid,
                                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(999),
                                    borderSide: const BorderSide(color: ProtocolColors.borderBright),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(999),
                                    borderSide: const BorderSide(color: ProtocolColors.borderBright),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(999),
                                    borderSide: const BorderSide(color: ProtocolColors.gold),
                                  ),
                                ),
                              ),
                            ),
                            CyberButton(
                              label: '+',
                              compact: true,
                              onPressed: _isSpinning ? null : () => _setBet(_parsedBet() + 10),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 12),

                    // Quick Bet Multipliers + Mode Toggles
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        CyberButton(
                          label: I18n.t('slots_min'),
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(10),
                        ),
                        CyberButton(
                          label: '1/2',
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(_parsedBet() ~/ 2),
                        ),
                        CyberButton(
                          label: 'x2',
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(_parsedBet() * 2),
                        ),
                        CyberButton(
                          label: I18n.t('slots_max'),
                          compact: true,
                          onPressed: _isSpinning ? null : () => _setBet(s.balance),
                        ),
                        CyberButton(
                          label: '⚡ TURBO',
                          compact: true,
                          filled: s.turboSpin,
                          accentColor: s.turboSpin ? ProtocolColors.gold : ProtocolColors.textSecondary,
                          onPressed: s.toggleTurbo,
                        ),
                        CyberButton(
                          label: _autoSpin ? '🔄 AUTO: ON' : '🔄 AUTO',
                          compact: true,
                          filled: _autoSpin,
                          accentColor: _autoSpin ? ProtocolColors.emerald : ProtocolColors.textSecondary,
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
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Giant Tactile Primary CTA
                    if (s.balance < 10 && !_isSpinning)
                      CyberButton(
                        label: I18n.t('slots_refill_btn'),
                        filled: true,
                        accentColor: ProtocolColors.emerald,
                        icon: Icons.add_circle_outline_rounded,
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
                        icon: Icons.play_arrow_rounded,
                        onPressed: _isSpinning ? null : _spin,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // ── PROVABLY FAIR HASH + COLLAPSIBLE DETAILS TOGGLE ──
              CyberPanel(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  children: [
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 10,
                      runSpacing: 8,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified_outlined, color: ProtocolColors.emerald, size: 17),
                            const SizedBox(width: 8),
                            Flexible(
                              child: InkWell(
                                onTap: () {
                                  final seed = s.lastSeed ?? 'SHA256::GENESIS';
                                  WebBridge.copyText(seed);
                                  AudioService.copy();
                                  setState(() {
                                    _statusColor = ProtocolColors.emerald;
                                    _statusMsg = I18n.t('slots_seed_copied');
                                  });
                                },
                                child: Text(
                                  'SHA-256: ${s.lastSeed ?? "READY"}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: ProtocolTheme.mono(size: 11.5, color: ProtocolColors.textSecondary),
                                ),
                              ),
                            ),
                          ],
                        ),
                        CyberButton(
                          label: _showDetails
                              ? (I18n.currentLang == 'ru' ? 'Скрыть выплаты ▲' : 'Hide Info ▲')
                              : (I18n.currentLang == 'ru' ? 'Выплаты и история ▼' : 'Payouts & History ▼'),
                          compact: true,
                          accentColor: ProtocolColors.textSecondary,
                          onPressed: () {
                            AudioService.click();
                            setState(() => _showDetails = !_showDetails);
                          },
                        ),
                      ],
                    ),
                    if (_showDetails) ...[
                      const SizedBox(height: 14),
                      const Divider(color: ProtocolColors.borderSubtle, height: 1),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
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
                      Row(
                        children: [
                          Text(
                            I18n.t('slots_history'),
                            style: ProtocolTheme.mono(
                              size: 11.5,
                              weight: FontWeight.w700,
                              color: ProtocolColors.textSecondary,
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
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            I18n.t('slots_history_empty'),
                            style: ProtocolTheme.sans(size: 12.5, color: ProtocolColors.textDim),
                          ),
                        )
                      else
                        for (final item in s.history.take(8))
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                Text(item.time, style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textDim)),
                                const SizedBox(width: 10),
                                Text(
                                  '[${item.glyphs}]',
                                  style: ProtocolTheme.mono(
                                    size: 12,
                                    weight: FontWeight.w700,
                                    color: item.won > 0 ? ProtocolColors.gold : ProtocolColors.textPrimary,
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
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: active ? ProtocolColors.gold.withAlpha(32) : ProtocolColors.bgVoid,
        border: Border.all(
          color: active ? ProtocolColors.gold : ProtocolColors.borderSubtle,
        ),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$sym • $mult',
        style: ProtocolTheme.mono(
          size: 11.5,
          weight: FontWeight.w700,
          color: active ? ProtocolColors.gold : ProtocolColors.textSecondary,
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color accent;

  const _StatChip({
    required this.label,
    required this.value,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: ProtocolColors.bgVoid,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ProtocolColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: ProtocolTheme.mono(size: 9.5, color: ProtocolColors.textDim)),
          Text(value, style: ProtocolTheme.mono(size: 12.5, weight: FontWeight.w700, color: accent)),
        ],
      ),
    );
  }
}

class _WinParticlesPainter extends CustomPainter {
  final double progress;
  final bool isJackpot;

  _WinParticlesPainter({required this.progress, required this.isJackpot});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0 || progress >= 1) return;
    final center = Offset(size.width / 2, size.height / 2);
    final count = isJackpot ? 28 : 16;
    final paint = Paint()..style = PaintingStyle.fill;
    final alpha = ((1.0 - progress) * 230).round().clamp(0, 255);

    for (var i = 0; i < count; i++) {
      final angle = (i / count) * pi * 2 + (i % 3) * 0.2;
      final dist = (size.width * 0.45) * Curves.easeOut.transform(progress);
      final pos = Offset(
        center.dx + cos(angle) * dist,
        center.dy + sin(angle) * dist * 0.55 - progress * 18,
      );
      paint.color = (i % 2 == 0
              ? ProtocolColors.gold
              : (isJackpot ? ProtocolColors.crimson : ProtocolColors.emerald))
          .withAlpha(alpha);
      canvas.drawCircle(pos, isJackpot ? 3.5 : 2.6, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _WinParticlesPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
