import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';

class LabScreen extends StatefulWidget {
  final ProtocolState state;

  const LabScreen({super.key, required this.state});

  @override
  State<LabScreen> createState() => _LabScreenState();
}

class _LabScreenState extends State<LabScreen> {
  late String _strain;
  late int _hp;
  late int _streak;
  late String _light;
  String _searchQuery = '';
  bool _copiedBot = false;

  HarvestOutput _output = ApiService.localHarvest(
    strainMult: 1.0,
    hp: 95,
    streak: 7,
    lightMult: 1.0,
  );

  @override
  void initState() {
    super.initState();
    _strain = widget.state.calcStrain;
    _hp = widget.state.calcHp;
    _streak = widget.state.calcStreak;
    _light = widget.state.calcLight;
    _recalculate(save: false);
  }

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

  @override
  Widget build(BuildContext context) {
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

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 960),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // @GrowerSim_bot Launch Banner
              CyberPanel(
                borderColor: ProtocolColors.emerald.withAlpha(110),
                child: Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 12,
                  runSpacing: 10,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          I18n.t('bot_banner_title'),
                          style: ProtocolTheme.mono(
                            size: 14,
                            weight: FontWeight.w700,
                            color: ProtocolColors.emerald,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          I18n.t('bot_banner_sub'),
                          style: ProtocolTheme.mono(size: 12, color: ProtocolColors.textSecondary),
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
                          icon: Icons.send,
                          onPressed: () {
                            AudioService.click();
                            WebBridge.openUrl('https://t.me/GrowerSim_bot');
                          },
                        ),
                        CyberButton(
                          label: _copiedBot ? I18n.t('copied') : I18n.t('qr_copy_bot_link'),
                          compact: true,
                          accentColor: _copiedBot ? ProtocolColors.emerald : ProtocolColors.textDim,
                          onPressed: () {
                            WebBridge.copyText('https://t.me/GrowerSim_bot');
                            AudioService.copy();
                            setState(() => _copiedBot = true);
                            Future.delayed(const Duration(seconds: 2), () {
                              if (mounted) setState(() => _copiedBot = false);
                            });
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Mendel Genetics & Harvest Calculator
              CyberPanel(
                borderColor: ProtocolColors.borderBright,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      I18n.t('calc_title'),
                      style: ProtocolTheme.mono(
                        size: 15,
                        weight: FontWeight.w700,
                        color: ProtocolColors.crimson,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      I18n.t('calc_subtitle'),
                      style: ProtocolTheme.mono(size: 12, color: ProtocolColors.textDim),
                    ),
                    const SizedBox(height: 12),

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
                    const SizedBox(height: 14),

                    // Controls Grid
                    LayoutBuilder(
                      builder: (_, c) {
                        final wide = c.maxWidth >= 620;
                        final fieldW = wide ? (c.maxWidth - 14) / 2 : c.maxWidth;
                        return Wrap(
                          spacing: 14,
                          runSpacing: 12,
                          children: [
                            SizedBox(
                              width: fieldW,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(I18n.t('calc_label_strain'),
                                      style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textMuted)),
                                  const SizedBox(height: 6),
                                  DropdownButtonFormField<String>(
                                    initialValue: _strain,
                                    dropdownColor: ProtocolColors.surfaceElevated,
                                    style: ProtocolTheme.mono(size: 12),
                                    decoration: const InputDecoration(
                                      isDense: true,
                                      border: OutlineInputBorder(),
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
                                      style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textMuted)),
                                  const SizedBox(height: 6),
                                  DropdownButtonFormField<String>(
                                    initialValue: _light,
                                    dropdownColor: ProtocolColors.surfaceElevated,
                                    style: ProtocolTheme.mono(size: 12),
                                    decoration: const InputDecoration(
                                      isDense: true,
                                      border: OutlineInputBorder(),
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
                                      style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textMuted)),
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
                                      style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textMuted)),
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
                    const SizedBox(height: 12),

                    // Results Bars
                    _MetricBar(
                      label: I18n.t('calc_res_biomass'),
                      valueText: '${_output.biomass} g',
                      ratio: (_output.biomass / 950).clamp(0.0, 1.0),
                      color: ProtocolColors.emerald,
                    ),
                    _MetricBar(
                      label: I18n.t('calc_res_thc'),
                      valueText: '${_output.thc}%',
                      ratio: (_output.thc / 36).clamp(0.0, 1.0),
                      color: ProtocolColors.crimson,
                    ),
                    _MetricBar(
                      label: I18n.t('calc_res_bman'),
                      valueText: '${_output.bmanValue} BMAN',
                      ratio: (_output.bmanValue / 2200).clamp(0.0, 1.0),
                      color: ProtocolColors.gold,
                    ),
                    _MetricBar(
                      label: I18n.t('calc_res_cup'),
                      valueText: '${_output.cupScore} PTS',
                      ratio: (_output.cupScore / 3600).clamp(0.0, 1.0),
                      color: ProtocolColors.textPrimary,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${I18n.t('calc_res_mutation')}: ${_output.mutationChance}%',
                      style: ProtocolTheme.mono(
                        size: 12,
                        weight: FontWeight.w700,
                        color: ProtocolColors.gold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 5-Stage Pipeline
              CyberPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      I18n.t('stages_title'),
                      style: ProtocolTheme.mono(
                        size: 13,
                        weight: FontWeight.w700,
                        color: ProtocolColors.emerald,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5']
                          .map(
                            (k) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: ProtocolColors.bgPure,
                                border: Border.all(color: ProtocolColors.emerald.withAlpha(90)),
                              ),
                              child: Text(
                                I18n.t(k),
                                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textPrimary),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Searchable System Manual
              TextField(
                style: ProtocolTheme.mono(size: 13),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search, color: ProtocolColors.crimson, size: 18),
                  hintText: I18n.t('manual_search_placeholder'),
                  hintStyle: ProtocolTheme.mono(size: 12, color: ProtocolColors.textDim),
                  border: const OutlineInputBorder(
                    borderSide: BorderSide(color: ProtocolColors.borderSubtle),
                  ),
                ),
                onChanged: (v) => setState(() => _searchQuery = v),
              ),
              const SizedBox(height: 12),

              for (final sec in filteredSections) ...[
                CyberPanel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        I18n.t(sec.titleKey),
                        style: ProtocolTheme.mono(
                          size: 13,
                          weight: FontWeight.w700,
                          color: ProtocolColors.crimson,
                        ),
                      ),
                      const SizedBox(height: 8),
                      for (final itemKey in sec.items) ...[
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: _ManualBullet(raw: I18n.t(itemKey)),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricBar extends StatelessWidget {
  final String label;
  final String valueText;
  final double ratio;
  final Color color;

  const _MetricBar({
    required this.label,
    required this.valueText,
    required this.ratio,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(label, style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textSecondary)),
              ),
              Text(valueText, style: ProtocolTheme.mono(size: 12, weight: FontWeight.w700, color: color)),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: ratio,
            minHeight: 5,
            backgroundColor: ProtocolColors.bgPure,
            color: color,
          ),
        ],
      ),
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
        style: ProtocolTheme.mono(size: 12, color: ProtocolColors.textSecondary, height: 1.45),
        children: [
          const TextSpan(text: '• '),
          if (parsed.title != null)
            TextSpan(
              text: '${parsed.title} ',
              style: ProtocolTheme.mono(
                size: 12,
                weight: FontWeight.w700,
                color: ProtocolColors.textPrimary,
                height: 1.45,
              ),
            ),
          TextSpan(text: parsed.body),
        ],
      ),
    );
  }
}
