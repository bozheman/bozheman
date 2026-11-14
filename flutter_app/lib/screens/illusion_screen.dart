import 'dart:async';
import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/audio_service.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';
import '../widgets/core_3d_painter.dart';

class IllusionScreen extends StatefulWidget {
  final ProtocolState state;

  const IllusionScreen({super.key, required this.state});

  @override
  State<IllusionScreen> createState() => _IllusionScreenState();
}

class _IllusionScreenState extends State<IllusionScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _coreLoop;
  double _yaw = 0.4;
  double _pitch = 0.3;
  double _pulse = 0.0;

  int _fragmentIdx = 0;
  int _typedLen = 0;
  bool _paused = false;
  Timer? _typeTimer;

  @override
  void initState() {
    super.initState();
    _coreLoop = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..addListener(() {
        if (!mounted) return;
        setState(() {
          _yaw += 0.008;
          if (_pulse > 0) _pulse = (_pulse - 0.04).clamp(0.0, 1.0);
        });
      });
    _coreLoop.repeat();
    _selectFragment(0);
  }

  @override
  void dispose() {
    _typeTimer?.cancel();
    _coreLoop.dispose();
    super.dispose();
  }

  void _selectFragment(int idx) {
    _typeTimer?.cancel();
    setState(() {
      _fragmentIdx = idx.clamp(0, 6);
      _typedLen = 0;
      _paused = false;
    });
    widget.state.markWeaverRead(_fragmentIdx);
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

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final clicks = s.totalClicks3D;
    final progress = (clicks / 10).clamp(0.0, 1.0);
    final fullText = _currentBody();
    final visibleText = _typedLen >= fullText.length
        ? fullText
        : fullText.substring(0, _typedLen);

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 920),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Interactive Native 3D Protocol Core
              CyberPanel(
                borderColor: progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.borderBright,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Text(
                          I18n.t('canvas_scene').toUpperCase(),
                          style: ProtocolTheme.mono(
                            size: 12,
                            weight: FontWeight.w700,
                            color: ProtocolColors.crimson,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${clicks.clamp(0, 10)} / 10',
                          style: ProtocolTheme.mono(
                            size: 12,
                            weight: FontWeight.w700,
                            color: progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.gold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
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
                          height: 220,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: ProtocolColors.bgPure,
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
                    const SizedBox(height: 10),
                    LinearProgressIndicator(
                      value: progress,
                      minHeight: 4,
                      backgroundColor: ProtocolColors.bgPure,
                      color: progress >= 1.0 ? ProtocolColors.emerald : ProtocolColors.crimson,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      I18n.t('core_hint'),
                      textAlign: TextAlign.center,
                      style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textDim),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Secret Weaver Protocol: 7 Fragments
              CyberPanel(
                borderColor: ProtocolColors.borderBright,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Text(
                          I18n.t('illusion_title'),
                          style: ProtocolTheme.mono(
                            size: 16,
                            weight: FontWeight.w700,
                            color: ProtocolColors.crimson,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          I18n.t('illusion_fragment_of', {'cur': _fragmentIdx + 1, 'total': 7}),
                          style: ProtocolTheme.mono(size: 12, color: ProtocolColors.gold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // 7 Fragment Selector Dots
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: List.generate(7, (idx) {
                        final isCurrent = idx == _fragmentIdx;
                        final isRead = s.weaverRead.contains(idx);
                        return CyberButton(
                          label: '${idx + 1}',
                          compact: true,
                          filled: isCurrent,
                          accentColor: isCurrent
                              ? ProtocolColors.crimson
                              : (isRead ? ProtocolColors.emerald : ProtocolColors.textDim),
                          onPressed: () {
                            AudioService.click();
                            _selectFragment(idx);
                          },
                        );
                      }),
                    ),
                    const SizedBox(height: 14),

                    if (s.weaverClaimed)
                      Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: ProtocolColors.emerald.withAlpha(24),
                          border: Border.all(color: ProtocolColors.emerald.withAlpha(110)),
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

                    // Typewriter Terminal Display
                    Container(
                      constraints: const BoxConstraints(minHeight: 150),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: ProtocolColors.bgPure,
                        border: Border.all(color: ProtocolColors.borderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _currentTitle(),
                            style: ProtocolTheme.mono(
                              size: 14,
                              weight: FontWeight.w700,
                              color: ProtocolColors.gold,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            visibleText,
                            style: ProtocolTheme.mono(
                              size: 13,
                              color: ProtocolColors.textPrimary,
                              height: 1.55,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CyberButton(
                          label: I18n.t('illusion_prev'),
                          compact: true,
                          onPressed: _fragmentIdx > 0 ? () => _selectFragment(_fragmentIdx - 1) : null,
                        ),
                        const SizedBox(width: 8),
                        CyberButton(
                          label: _paused ? I18n.t('illusion_resume') : I18n.t('illusion_pause'),
                          compact: true,
                          accentColor: ProtocolColors.gold,
                          onPressed: () => setState(() => _paused = !_paused),
                        ),
                        const SizedBox(width: 8),
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
          ),
        ),
      ),
    );
  }
}
