import 'dart:async';
import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';
import '../widgets/core_3d_painter.dart';
import '../widgets/qr_painter.dart';
import '../widgets/terminal_modal.dart';

/// World 3: NEURAL LAB — Unified Explorer Experience combining:
/// 0: 3D Protocol Core & 7 Weaver Fragments ("Иллюзия")
/// 1: Mendel Genetics Bio-Simulator & @GrowerSim_bot System Manual
/// 2: Ecosystem Projects, Interactive ICE Breach / CLI & Achievements Gallery
class LabScreen extends StatefulWidget {
  final ProtocolState state;
  final int initialSubTab;
  final ValueChanged<int> onSelectMainTab;
  final ValueChanged<String> onNavigate;

  const LabScreen({
    super.key,
    required this.state,
    this.initialSubTab = 0,
    required this.onSelectMainTab,
    required this.onNavigate,
  });

  @override
  State<LabScreen> createState() => _LabScreenState();
}

class _LabScreenState extends State<LabScreen> with SingleTickerProviderStateMixin {
  late int _subTab;

  // Sub-tab 0: 3D Core & Illusion
  late final AnimationController _coreLoop;
  double _yaw = 0.4;
  double _pitch = 0.3;
  double _pulse = 0.0;
  int _fragmentIdx = 0;
  int _typedLen = 0;
  bool _paused = false;
  Timer? _typeTimer;

  // Sub-tab 1: Mendel Bio-Lab
  late String _strain;
  late int _hp;
  late int _streak;
  late String _light;
  String _searchQuery = '';
  bool _copiedBot = false;
  int _expandedManualIdx = 0;
  HarvestOutput _output = ApiService.localHarvest(
    strainMult: 1.0,
    hp: 95,
    streak: 7,
    lightMult: 1.0,
  );

  // Sub-tab 2: Projects, Countdown & Sync Telemetry
  bool _notifiedTerminus = false;
  late Timer _countdownTimer;
  Duration _remaining = Duration.zero;
  GitSyncStatus? _syncStatus;
  static final DateTime _targetRelease = DateTime.utc(2026, 12, 31, 20, 0, 0);

  @override
  void initState() {
    super.initState();
    _subTab = widget.initialSubTab.clamp(0, 2);

    _coreLoop = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..addListener(() {
        if (!mounted) return;
        setState(() {
          _yaw += 0.008;
          if (_pulse > 0) _pulse = (_pulse - 0.045).clamp(0.0, 1.0);
        });
      });
    _coreLoop.repeat();
    _selectFragment(0, silentMark: true);

    _strain = widget.state.calcStrain;
    _hp = widget.state.calcHp;
    _streak = widget.state.calcStreak;
    _light = widget.state.calcLight;
    _recalculate(save: false);

    _updateRemaining();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining());
    _loadSyncStatus();
  }

  @override
  void didUpdateWidget(covariant LabScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialSubTab != widget.initialSubTab) {
      setState(() => _subTab = widget.initialSubTab.clamp(0, 2));
    }
  }

  @override
  void dispose() {
    _typeTimer?.cancel();
    _countdownTimer.cancel();
    _coreLoop.dispose();
    super.dispose();
  }

  Future<void> _loadSyncStatus() async {
    final st = await ApiService.fetchSyncStatus();
    if (mounted) setState(() => _syncStatus = st);
  }

  void _updateRemaining() {
    final diff = _targetRelease.difference(DateTime.now().toUtc());
    if (mounted) {
      setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
    }
  }

  String _formatCountdown() {
    if (_remaining == Duration.zero) return I18n.t('game_1_timer_soon');
    final d = _remaining.inDays;
    final h = (_remaining.inHours % 24).toString().padLeft(2, '0');
    final m = (_remaining.inMinutes % 60).toString().padLeft(2, '0');
    final s = (_remaining.inSeconds % 60).toString().padLeft(2, '0');
    return '${d}d ${h}h ${m}m ${s}s';
  }

  void _selectFragment(int idx, {bool silentMark = false}) {
    _typeTimer?.cancel();
    setState(() {
      _fragmentIdx = idx.clamp(0, 6);
      _typedLen = 0;
      _paused = false;
    });
    if (!silentMark) {
      widget.state.markWeaverRead(_fragmentIdx);
    }
    final text = _currentBody();
    _typeTimer = Timer.periodic(const Duration(milliseconds: 16), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_paused) return;
      if (_typedLen < text.length) {
        setState(() => _typedLen += 2);
      } else {
        setState(() => _typedLen = text.length);
        t.cancel();
      }
    });
  }

  String _currentTitle() => I18n.t('frag_${_fragmentIdx + 1}_title');
  String _currentBody() => I18n.t('frag_${_fragmentIdx + 1}_text');

  Future<void> _recalculate({bool save = true}) async {
    final sMult = double.tryParse(_strain) ?? 1.0;
    final lMult = double.tryParse(_light) ?? 1.0;
    if (save) {
      widget.state.saveHarvestCalc(
        strain: _strain,
        hp: _hp,
        streak: _streak,
        light: _light,
      );
    }
    final res = await ApiService.calcHarvest(
      strainMult: sMult,
      hp: _hp,
      streak: _streak,
      lightMult: lMult,
    );
    if (mounted) {
      setState(() => _output = res);
    }
  }

  void _applyPreset(String preset) {
    AudioService.click();
    setState(() {
      switch (preset) {
        case 'starter':
          _strain = '1.0';
          _hp = 85;
          _streak = 3;
          _light = '1.0';
          break;
        case 'pro':
          _strain = '1.8';
          _hp = 98;
          _streak = 14;
          _light = '1.25';
          break;
        case 'quantum':
          _strain = '3.0';
          _hp = 100;
          _streak = 30;
          _light = '1.6';
          break;
        default:
          _strain = '1.0';
          _hp = 95;
          _streak = 7;
          _light = '1.0';
      }
    });
    _recalculate(save: true);
  }

  void _showBotQr() {
    AudioService.click();
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: ProtocolColors.bgSurface,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: ProtocolColors.borderBright),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                I18n.t('qr_bot_modal_title'),
                style: ProtocolTheme.display(size: 16, color: ProtocolColors.emerald),
              ),
              const SizedBox(height: 14),
              const QrCodeWidget(
                data: 'https://t.me/GrowerSim_bot',
                size: 196,
                moduleColor: ProtocolColors.emerald,
              ),
              const SizedBox(height: 12),
              Text('@GrowerSim_bot', style: ProtocolTheme.mono(size: 13, color: ProtocolColors.textPrimary)),
              const SizedBox(height: 14),
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
    final isRu = I18n.currentLang == 'ru';
    final subTabs = [
      (idx: 0, label: isRu ? '3D Ядро и Иллюзия' : '3D Core & Illusion', icon: Icons.blur_on_rounded, color: ProtocolColors.crimson),
      (idx: 1, label: isRu ? 'Генетика Менделя' : 'Mendel Bio-Lab', icon: Icons.biotech_rounded, color: ProtocolColors.emerald),
      (idx: 2, label: isRu ? 'Проекты и Терминал' : 'Projects & Terminal', icon: Icons.terminal_rounded, color: ProtocolColors.gold),
    ];

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1080),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Sub-Navigation Pills
              Center(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: subTabs.map((t) {
                    final active = _subTab == t.idx;
                    return CyberButton(
                      label: t.label,
                      icon: t.icon,
                      compact: true,
                      filled: active,
                      accentColor: active ? t.color : ProtocolColors.textSecondary,
                      onPressed: () {
                        AudioService.click();
                        setState(() => _subTab = t.idx);
                        if (t.idx == 0) {
                          widget.state.markWeaverRead(_fragmentIdx);
                        }
                      },
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),

              if (_subTab == 0) _buildCoreAndIllusion(),
              if (_subTab == 1) _buildMendelLab(),
              if (_subTab == 2) _buildProjectsAndTerminal(),
            ],
          ),
        ),
      ),
    );
  }

  // ── SUB-TAB 0: 3D CORE & 7 FRAGMENTS OF WEAVER ──
  Widget _buildCoreAndIllusion() {
    final s = widget.state;
    final clicks = s.totalClicks3D;
    final progress = (clicks / 10).clamp(0.0, 1.0);
    final fullText = _currentBody();
    final visibleText =
        _typedLen >= fullText.length ? fullText : fullText.substring(0, _typedLen);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BentoCard(
          accentColor: progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.crimson,
          highlightBorder: progress >= 1.0,
          padding: const EdgeInsets.all(22),
          borderRadius: 24,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      I18n.t('canvas_scene'),
                      style: ProtocolTheme.display(size: 16, color: ProtocolColors.textPrimary),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.gold)
                          .withAlpha(24),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: (progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.gold)
                            .withAlpha(110),
                      ),
                    ),
                    child: Text(
                      '${clicks.clamp(0, 10)} / 10',
                      style: ProtocolTheme.mono(
                        size: 12,
                        weight: FontWeight.w700,
                        color: progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.gold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              GestureDetector(
                onPanUpdate: (d) {
                  setState(() {
                    _yaw += d.delta.dx * 0.012;
                    _pitch = (_pitch + d.delta.dy * 0.012).clamp(-1.4, 1.4);
                  });
                },
                onTap: () {
                  s.registerCoreClick();
                  setState(() => _pulse = 1.0);
                },
                child: MouseRegion(
                  cursor: SystemMouseCursors.click,
                  child: Container(
                    height: 270,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: ProtocolColors.bgVoid,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: ProtocolColors.borderSubtle),
                    ),
                    child: CustomPaint(
                      painter: Core3DPainter(
                        yaw: _yaw,
                        pitch: _pitch,
                        pulse: _pulse,
                        progress: progress,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: ProtocolColors.bgVoid,
                  color: progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.crimson,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                I18n.t('core_hint'),
                textAlign: TextAlign.center,
                style: ProtocolTheme.sans(size: 12.5, color: ProtocolColors.textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 7 Weaver Fragments Card
        BentoCard(
          accentColor: ProtocolColors.gold,
          padding: const EdgeInsets.all(24),
          borderRadius: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 6,
                children: [
                  Text(
                    I18n.t('illusion_title'),
                    style: ProtocolTheme.display(size: 20, color: ProtocolColors.textPrimary),
                  ),
                  Text(
                    I18n.t('illusion_fragment_of', {'cur': _fragmentIdx + 1, 'total': 7}),
                    style: ProtocolTheme.mono(size: 12, color: ProtocolColors.gold),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: List.generate(7, (idx) {
                  final isCurrent = idx == _fragmentIdx;
                  final isRead = s.weaverRead.contains(idx);
                  return CyberButton(
                    label: '0${idx + 1}',
                    compact: true,
                    filled: isCurrent,
                    accentColor: isCurrent
                        ? ProtocolColors.crimson
                        : (isRead ? ProtocolColors.emerald : ProtocolColors.textSecondary),
                    onPressed: () {
                      AudioService.click();
                      _selectFragment(idx);
                    },
                  );
                }),
              ),
              const SizedBox(height: 16),
              if (s.weaverClaimed)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: ProtocolColors.emerald.withAlpha(22),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: ProtocolColors.emerald.withAlpha(90)),
                  ),
                  child: Text(
                    I18n.t('illusion_weaver_bonus'),
                    textAlign: TextAlign.center,
                    style: ProtocolTheme.mono(
                      size: 12,
                      weight: FontWeight.w700,
                      color: ProtocolColors.emerald,
                    ),
                  ),
                ),
              Container(
                constraints: const BoxConstraints(minHeight: 150),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: ProtocolColors.bgVoid,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: ProtocolColors.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _currentTitle(),
                      style: ProtocolTheme.display(size: 16, color: ProtocolColors.gold),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      visibleText,
                      style: ProtocolTheme.sans(
                        size: 14.5,
                        color: ProtocolColors.textPrimary,
                        height: 1.6,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 10,
                runSpacing: 8,
                children: [
                  CyberButton(
                    label: I18n.t('illusion_prev'),
                    compact: true,
                    onPressed: _fragmentIdx > 0 ? () => _selectFragment(_fragmentIdx - 1) : null,
                  ),
                  CyberButton(
                    label: _paused ? I18n.t('illusion_resume') : I18n.t('illusion_pause'),
                    compact: true,
                    accentColor: ProtocolColors.gold,
                    onPressed: () => setState(() => _paused = !_paused),
                  ),
                  CyberButton(
                    label: I18n.t('illusion_next'),
                    compact: true,
                    onPressed: _fragmentIdx < 6 ? () => _selectFragment(_fragmentIdx + 1) : null,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── SUB-TAB 1: MENDEL GENETICS BIO-LAB & GROWERSIM MANUAL ──
  Widget _buildMendelLab() {
    final sections = [
      (titleKey: 'man_h_1', items: ['man_1_1', 'man_1_2', 'man_1_3', 'man_1_4']),
      (titleKey: 'man_h_2', items: ['man_2_1', 'man_2_2', 'man_2_3', 'man_2_4']),
      (titleKey: 'man_h_3', items: ['man_3_1', 'man_3_2', 'man_3_3', 'man_3_4']),
      (titleKey: 'man_h_4', items: ['man_4_1', 'man_4_2', 'man_4_3']),
      (titleKey: 'man_h_5', items: ['man_5_1', 'man_5_2', 'man_5_3']),
      (titleKey: 'man_h_6', items: ['man_6_1', 'man_6_2', 'man_6_3']),
    ];

    final q = _searchQuery.trim().toLowerCase();
    final filteredSections = sections.where((sec) {
      if (q.isEmpty) return true;
      if (I18n.t(sec.titleKey).toLowerCase().contains(q)) return true;
      return sec.items.any((k) => I18n.t(k).toLowerCase().contains(q));
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // @GrowerSim_bot Hero Strip
        BentoCard(
          accentColor: ProtocolColors.emerald,
          padding: const EdgeInsets.all(20),
          borderRadius: 22,
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 14,
            runSpacing: 12,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    I18n.t('bot_banner_title'),
                    style: ProtocolTheme.display(size: 18, color: ProtocolColors.emerald),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    I18n.t('bot_banner_sub'),
                    style: ProtocolTheme.sans(size: 13, color: ProtocolColors.textSecondary),
                  ),
                ],
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  CyberButton(
                    label: I18n.t('game_growersim_bot_btn'),
                    compact: true,
                    filled: true,
                    accentColor: ProtocolColors.emerald,
                    icon: Icons.send_rounded,
                    onPressed: () {
                      AudioService.click();
                      WebBridge.openUrl('https://t.me/GrowerSim_bot');
                    },
                  ),
                  CyberButton(
                    label: _copiedBot ? I18n.t('copied') : I18n.t('qr_copy_bot_link'),
                    compact: true,
                    accentColor: _copiedBot ? ProtocolColors.emerald : ProtocolColors.textSecondary,
                    onPressed: () {
                      WebBridge.copyText('https://t.me/GrowerSim_bot');
                      AudioService.copy();
                      setState(() => _copiedBot = true);
                      Future.delayed(const Duration(seconds: 2), () {
                        if (mounted) setState(() => _copiedBot = false);
                      });
                    },
                  ),
                  CyberButton(
                    label: 'QR',
                    compact: true,
                    accentColor: ProtocolColors.emerald,
                    onPressed: _showBotQr,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Interactive Harvest & Genetics Calculator
        BentoCard(
          accentColor: ProtocolColors.crimson,
          padding: const EdgeInsets.all(24),
          borderRadius: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                I18n.t('calc_title'),
                style: ProtocolTheme.display(size: 20, color: ProtocolColors.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                I18n.t('calc_subtitle'),
                style: ProtocolTheme.sans(size: 13, color: ProtocolColors.textSecondary),
              ),
              const SizedBox(height: 14),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  CyberButton(
                    label: I18n.t('calc_preset_1'),
                    compact: true,
                    onPressed: () => _applyPreset('starter'),
                  ),
                  CyberButton(
                    label: I18n.t('calc_preset_2'),
                    compact: true,
                    accentColor: ProtocolColors.gold,
                    onPressed: () => _applyPreset('pro'),
                  ),
                  CyberButton(
                    label: I18n.t('calc_preset_3'),
                    compact: true,
                    accentColor: ProtocolColors.emerald,
                    onPressed: () => _applyPreset('quantum'),
                  ),
                  CyberButton(
                    label: I18n.t('calc_reset'),
                    compact: true,
                    onPressed: () => _applyPreset('reset'),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              LayoutBuilder(
                builder: (_, c) {
                  final wide = c.maxWidth >= 620;
                  final fieldW = wide ? (c.maxWidth - 16) / 2 : c.maxWidth;
                  return Wrap(
                    spacing: 16,
                    runSpacing: 14,
                    children: [
                      SizedBox(
                        width: fieldW,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(I18n.t('calc_label_strain'),
                                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textSecondary)),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              initialValue: _strain,
                              isExpanded: true,
                              dropdownColor: ProtocolColors.bgSurfaceElevated,
                              style: ProtocolTheme.sans(size: 13),
                              decoration: InputDecoration(
                                isDense: true,
                                filled: true,
                                fillColor: ProtocolColors.bgVoid,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              items: [
                                DropdownMenuItem(value: '1.0', child: Text(I18n.t('calc_strain_1'))),
                                DropdownMenuItem(value: '1.35', child: Text(I18n.t('calc_strain_2'))),
                                DropdownMenuItem(value: '1.8', child: Text(I18n.t('calc_strain_3'))),
                                DropdownMenuItem(value: '3.0', child: Text(I18n.t('calc_strain_4'))),
                              ],
                              onChanged: (v) {
                                if (v == null) return;
                                setState(() => _strain = v);
                                _recalculate();
                              },
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        width: fieldW,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(I18n.t('calc_label_light'),
                                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textSecondary)),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              initialValue: _light,
                              isExpanded: true,
                              dropdownColor: ProtocolColors.bgSurfaceElevated,
                              style: ProtocolTheme.sans(size: 13),
                              decoration: InputDecoration(
                                isDense: true,
                                filled: true,
                                fillColor: ProtocolColors.bgVoid,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              items: [
                                DropdownMenuItem(value: '1.0', child: Text(I18n.t('calc_light_1'))),
                                DropdownMenuItem(value: '1.25', child: Text(I18n.t('calc_light_2'))),
                                DropdownMenuItem(value: '1.6', child: Text(I18n.t('calc_light_3'))),
                              ],
                              onChanged: (v) {
                                if (v == null) return;
                                setState(() => _light = v);
                                _recalculate();
                              },
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        width: fieldW,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${I18n.t('calc_label_hp')}: $_hp%',
                                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textSecondary)),
                            Slider(
                              value: _hp.toDouble(),
                              min: 10,
                              max: 100,
                              divisions: 90,
                              activeColor: ProtocolColors.emerald,
                              onChanged: (v) {
                                setState(() => _hp = v.round());
                                _recalculate();
                              },
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        width: fieldW,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${I18n.t('calc_label_streak')}: $_streak',
                                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textSecondary)),
                            Slider(
                              value: _streak.toDouble(),
                              min: 0,
                              max: 30,
                              divisions: 30,
                              activeColor: ProtocolColors.gold,
                              onChanged: (v) {
                                setState(() => _streak = v.round());
                                _recalculate();
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 16),

              // 4 Telemetry Output Tiles
              LayoutBuilder(
                builder: (_, c) {
                  final cols = c.maxWidth >= 680 ? 4 : (c.maxWidth >= 380 ? 2 : 1);
                  const gap = 10.0;
                  final tileW = (c.maxWidth - gap * (cols - 1)) / cols;
                  final metrics = [
                    (I18n.t('calc_res_biomass'), '${_output.biomass} g', (_output.biomass / 950).clamp(0.0, 1.0), ProtocolColors.emerald),
                    (I18n.t('calc_res_thc'), '${_output.thc}%', (_output.thc / 36).clamp(0.0, 1.0), ProtocolColors.crimson),
                    (I18n.t('calc_res_bman'), '${_output.bmanValue} BMAN', (_output.bmanValue / 2200).clamp(0.0, 1.0), ProtocolColors.gold),
                    (I18n.t('calc_res_cup'), '${_output.cupScore} PTS', (_output.cupScore / 3600).clamp(0.0, 1.0), ProtocolColors.cyan),
                  ];
                  return Wrap(
                    spacing: gap,
                    runSpacing: gap,
                    children: metrics.map((m) {
                      return SizedBox(
                        width: tileW,
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: ProtocolColors.bgVoid,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: ProtocolColors.borderSubtle),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m.$1,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: ProtocolTheme.mono(size: 10, color: ProtocolColors.textSecondary),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                m.$2,
                                style: ProtocolTheme.display(size: 20, color: m.$4),
                              ),
                              const SizedBox(height: 8),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(999),
                                child: LinearProgressIndicator(
                                  value: m.$3,
                                  minHeight: 4,
                                  backgroundColor: ProtocolColors.bgSurfaceElevated,
                                  color: m.$4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
              const SizedBox(height: 12),

              // Mendel Ratio & Mutation Strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: ProtocolColors.bgVoid,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: ProtocolColors.borderSubtle),
                ),
                child: Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  spacing: 12,
                  runSpacing: 6,
                  children: [
                    Text(
                      'MENDEL F2 RATIO: 25% AA • 50% Aa • 25% aa',
                      style: ProtocolTheme.mono(size: 11.5, color: ProtocolColors.emerald),
                    ),
                    Text(
                      '${I18n.t('calc_res_mutation')}: ${_output.mutationChance}%',
                      style: ProtocolTheme.mono(
                        size: 11.5,
                        weight: FontWeight.w700,
                        color: ProtocolColors.gold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Searchable Knowledge Base Accordions
        TextField(
          style: ProtocolTheme.sans(size: 13.5),
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.search_rounded, color: ProtocolColors.crimson, size: 19),
            hintText: I18n.t('manual_search_placeholder'),
            hintStyle: ProtocolTheme.sans(size: 13, color: ProtocolColors.textDim),
            filled: true,
            fillColor: ProtocolColors.bgSurface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: ProtocolColors.borderSubtle),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: ProtocolColors.borderSubtle),
            ),
          ),
          onChanged: (v) => setState(() => _searchQuery = v),
        ),
        const SizedBox(height: 12),

        for (var i = 0; i < filteredSections.length; i++) ...[
          _buildManualAccordion(i, filteredSections[i], forceOpen: q.isNotEmpty),
          const SizedBox(height: 10),
        ],
      ],
    );
  }

  Widget _buildManualAccordion(
    int idx,
    ({String titleKey, List<String> items}) sec, {
    required bool forceOpen,
  }) {
    final open = forceOpen || _expandedManualIdx == idx;
    return CyberPanel(
      padding: EdgeInsets.zero,
      borderRadius: 16,
      borderColor: open ? ProtocolColors.crimson.withAlpha(90) : ProtocolColors.borderSubtle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              AudioService.click();
              setState(() => _expandedManualIdx = open ? -1 : idx);
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      I18n.t(sec.titleKey),
                      style: ProtocolTheme.display(
                        size: 14.5,
                        color: open ? ProtocolColors.textPrimary : ProtocolColors.textMuted,
                      ),
                    ),
                  ),
                  Icon(
                    open ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                    color: ProtocolColors.textSecondary,
                  ),
                ],
              ),
            ),
          ),
          if (open)
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(color: ProtocolColors.borderSubtle, height: 1),
                  const SizedBox(height: 12),
                  for (final itemKey in sec.items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _ManualBullet(raw: I18n.t(itemKey)),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ── SUB-TAB 2: PROJECTS, ICE TERMINAL & ACHIEVEMENTS GALLERY ──
  Widget _buildProjectsAndTerminal() {
    final s = widget.state;
    final st = _syncStatus;

    final projects = [
      (
        title: I18n.t('game_slots_title'),
        desc: I18n.t('game_slots_desc'),
        status: I18n.t('game_slots_status'),
        accent: ProtocolColors.gold,
        extra: '${I18n.t('top_balance')}: ${s.balance} ₿',
        cta: I18n.t('game_slots_play_btn'),
        onTap: () => widget.onSelectMainTab(1),
      ),
      (
        title: I18n.t('game_growersim_title'),
        desc: I18n.t('game_growersim_desc'),
        status: I18n.t('game_growersim_status'),
        accent: ProtocolColors.emerald,
        extra: I18n.t('game_growersim_footnote'),
        cta: I18n.t('game_growersim_bot_btn'),
        onTap: () => WebBridge.openUrl('https://t.me/GrowerSim_bot'),
      ),
      (
        title: I18n.t('game_1_title'),
        desc: I18n.t('game_1_desc'),
        status: I18n.t('game_1_status'),
        accent: ProtocolColors.crimson,
        extra: '${I18n.t('game_1_timer')} ${_formatCountdown()}',
        cta: _notifiedTerminus ? I18n.t('game_1_btn_subscribed') : I18n.t('game_1_btn'),
        onTap: () {
          AudioService.click();
          setState(() => _notifiedTerminus = true);
        },
      ),
      (
        title: I18n.t('game_3_title'),
        desc: I18n.t('game_3_desc'),
        status: I18n.t('game_3_status'),
        accent: ProtocolColors.cyan,
        extra: I18n.t('game_3_footnote'),
        cta: I18n.t('game_3_lab_btn'),
        onTap: () => setState(() => _subTab = 1),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Ecosystem Cards Grid
        LayoutBuilder(
          builder: (_, c) {
            final wide = c.maxWidth >= 700;
            final cardW = wide ? (c.maxWidth - 14) / 2 : c.maxWidth;
            return Wrap(
              spacing: 14,
              runSpacing: 14,
              children: projects.map((p) {
                return SizedBox(
                  width: cardW,
                  child: BentoCard(
                    accentColor: p.accent,
                    padding: const EdgeInsets.all(20),
                    borderRadius: 20,
                    onTap: p.onTap,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p.status,
                          style: ProtocolTheme.mono(size: 10.5, weight: FontWeight.w700, color: p.accent),
                        ),
                        const SizedBox(height: 8),
                        Text(p.title, style: ProtocolTheme.display(size: 18)),
                        const SizedBox(height: 6),
                        Text(
                          p.desc,
                          style: ProtocolTheme.sans(size: 13, color: ProtocolColors.textSecondary, height: 1.45),
                        ),
                        const SizedBox(height: 12),
                        Text(p.extra, style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textDim)),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                p.cta,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: ProtocolTheme.sans(size: 13, weight: FontWeight.w600, color: p.accent),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(Icons.arrow_forward_rounded, size: 15, color: p.accent),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
        const SizedBox(height: 18),

        // ICE Security Terminal & Node GitHub Sync Telemetry Card
        BentoCard(
          accentColor: ProtocolColors.crimson,
          padding: const EdgeInsets.all(22),
          borderRadius: 22,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.terminal_rounded, color: ProtocolColors.crimson, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'BOZHEMAN ≡ CLI & NODE SYNC',
                      style: ProtocolTheme.display(size: 17),
                    ),
                  ),
                  if (st != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: ProtocolColors.bgVoid,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: (st.online ? ProtocolColors.emerald : ProtocolColors.textDim)
                              .withAlpha(90),
                        ),
                      ),
                      child: Text(
                        st.online ? '${st.branch}@${st.commit}' : 'STATIC',
                        style: ProtocolTheme.mono(
                          size: 11,
                          color: st.online ? ProtocolColors.emerald : ProtocolColors.textDim,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  CyberButton(
                    label: s.hackClaimed ? '✓ ICE BREACHED (+250 ₿)' : 'HACK ICE SECURITY (+250 ₿)',
                    compact: true,
                    filled: !s.hackClaimed,
                    accentColor: s.hackClaimed ? ProtocolColors.emerald : ProtocolColors.crimson,
                    icon: Icons.security_rounded,
                    onPressed: s.hackClaimed ? null : () => s.executeHackCommand(),
                  ),
                  CyberButton(
                    label: I18n.t('term_toggle'),
                    compact: true,
                    accentColor: ProtocolColors.gold,
                    icon: Icons.terminal_rounded,
                    onPressed: () {
                      AudioService.click();
                      showDialog<void>(
                        context: context,
                        builder: (_) => TerminalModal(
                          state: s,
                          onNavigate: widget.onNavigate,
                        ),
                      );
                    },
                  ),
                  if (st != null && st.online)
                    CyberButton(
                      label: I18n.t('server_sync_btn'),
                      compact: true,
                      accentColor: ProtocolColors.emerald,
                      onPressed: () async {
                        AudioService.click();
                        final res = await ApiService.triggerGitHubPull();
                        if (mounted) setState(() => _syncStatus = res);
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Achievements Gallery
        CyberPanel(
          padding: const EdgeInsets.all(22),
          borderRadius: 22,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      I18n.t('ach_modal_title'),
                      style: ProtocolTheme.display(size: 17, color: ProtocolColors.gold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${s.achievements.length} / ${ProtocolState.achievementsCatalog.length}',
                    style: ProtocolTheme.mono(
                      size: 13,
                      weight: FontWeight.w700,
                      color: ProtocolColors.emerald,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              LayoutBuilder(
                builder: (_, c) {
                  final cols = c.maxWidth >= 620 ? 2 : 1;
                  const gap = 10.0;
                  final itemW = (c.maxWidth - gap * (cols - 1)) / cols;
                  return Wrap(
                    spacing: gap,
                    runSpacing: gap,
                    children: ProtocolState.achievementsCatalog.map((def) {
                      final unlocked = s.achievements.contains(def.id);
                      return SizedBox(
                        width: itemW,
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: unlocked
                                ? ProtocolColors.bgSurfaceElevated
                                : ProtocolColors.bgVoid.withAlpha(170),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: unlocked
                                  ? ProtocolColors.gold.withAlpha(120)
                                  : ProtocolColors.borderSubtle,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(def.icon, style: const TextStyle(fontSize: 22)),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      I18n.t(def.titleKey),
                                      style: ProtocolTheme.sans(
                                        size: 13,
                                        weight: FontWeight.w700,
                                        color: unlocked
                                            ? ProtocolColors.gold
                                            : ProtocolColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      I18n.t(def.descKey),
                                      style: ProtocolTheme.sans(
                                        size: 11.5,
                                        color: ProtocolColors.textDim,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                unlocked ? Icons.check_circle_rounded : Icons.lock_outline_rounded,
                                size: 18,
                                color: unlocked ? ProtocolColors.emerald : ProtocolColors.textDim,
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
      ],
    );
  }
}

class _ManualBullet extends StatelessWidget {
  final String raw;

  const _ManualBullet({required this.raw});

  @override
  Widget build(BuildContext context) {
    final parsed = I18n.splitStrong(raw);
    return RichText(
      text: TextSpan(
        style: ProtocolTheme.sans(size: 13.5, color: ProtocolColors.textSecondary, height: 1.5),
        children: [
          const TextSpan(text: '• '),
          if (parsed.title != null)
            TextSpan(
              text: '${parsed.title} ',
              style: ProtocolTheme.sans(
                size: 13.5,
                weight: FontWeight.w700,
                color: ProtocolColors.textPrimary,
                height: 1.5,
              ),
            ),
          TextSpan(text: parsed.body),
        ],
      ),
    );
  }
}
