import 'dart:math';
import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';
import '../widgets/support_modal.dart';

class HomeScreen extends StatefulWidget {
  final ProtocolState state;
  final ValueChanged<int> onSelectTab;
  final ValueChanged<String>? onNavigate;

  const HomeScreen({
    super.key,
    required this.state,
    required this.onSelectTab,
    this.onNavigate,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _avatarOrbit;

  @override
  void initState() {
    super.initState();
    _avatarOrbit = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
  }

  @override
  void dispose() {
    _avatarOrbit.dispose();
    super.dispose();
  }

  void _openExternal(String url) {
    AudioService.click();
    WebBridge.openUrl(url);
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;

    final socialCards = [
      (
        title: 'Twitch',
        handle: 'twitch.tv/Bozhemany',
        subtitle: I18n.currentLang == 'ru' ? 'Стримы и эфиры' : 'Live Streams & IRL',
        accent: ProtocolColors.violet,
        icon: Icons.live_tv_rounded,
        onTap: () => _openExternal('https://www.twitch.tv/Bozhemany'),
      ),
      (
        title: 'YouTube',
        handle: 'youtube.com/@Bozhemany',
        subtitle: I18n.currentLang == 'ru' ? 'Видео, нарезки и VOD' : 'Videos, Clips & VODs',
        accent: ProtocolColors.crimson,
        icon: Icons.play_arrow_rounded,
        onTap: () => _openExternal('https://www.youtube.com/channel/UC_BgtvZc1dxQbJA1uEeFimw'),
      ),
      (
        title: 'Telegram Bot',
        handle: '@GrowerSim_bot',
        subtitle: I18n.currentLang == 'ru' ? 'Симулятор в Telegram' : 'Interactive TG Game',
        accent: ProtocolColors.emerald,
        icon: Icons.send_rounded,
        onTap: () => _openExternal('https://t.me/GrowerSim_bot'),
      ),
      (
        title: 'TikTok',
        handle: '@bozheman_',
        subtitle: I18n.currentLang == 'ru' ? 'Клипы и хайлайты' : 'Shorts & Highlights',
        accent: ProtocolColors.cyan,
        icon: Icons.music_note_rounded,
        onTap: () => _openExternal('https://www.tiktok.com/@bozheman_'),
      ),
      (
        title: 'Instagram',
        handle: '@bozheman',
        subtitle: I18n.currentLang == 'ru' ? 'Сторис и бэкстейдж' : 'Stories & Lifestyle',
        accent: ProtocolColors.coral,
        icon: Icons.camera_alt_outlined,
        onTap: () => _openExternal('https://www.instagram.com/bozheman'),
      ),
      (
        title: I18n.currentLang == 'ru' ? 'Поддержка' : 'Support & Crypto',
        handle: 'Donatello • USDT • Steam',
        subtitle: I18n.currentLang == 'ru' ? 'Донаты, крипто и скины' : 'Donations, Wallets & Skins',
        accent: ProtocolColors.gold,
        icon: Icons.account_balance_wallet_outlined,
        onTap: () => SupportModal.show(context, s),
      ),
    ];

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1140),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── HERO BANNER CARD ──
              BentoCard(
                accentColor: ProtocolColors.crimson,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 30),
                borderRadius: 24,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final compact = constraints.maxWidth < 620;
                    final avatarWidget = AnimatedBuilder(
                      animation: _avatarOrbit,
                      builder: (_, child) {
                        return CustomPaint(
                          painter: _AvatarHaloPainter(phase: _avatarOrbit.value),
                          child: Padding(
                            padding: const EdgeInsets.all(7),
                            child: child,
                          ),
                        );
                      },
                      child: Container(
                        width: compact ? 84 : 100,
                        height: compact ? 84 : 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: ProtocolColors.bgVoid,
                          border: Border.all(color: ProtocolColors.borderBright, width: 1.5),
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/avatar.png',
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Center(
                              child: Text(
                                'B',
                                style: ProtocolTheme.display(
                                  size: 38,
                                  color: ProtocolColors.crimson,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    );

                    final textContent = Column(
                      crossAxisAlignment:
                          compact ? CrossAxisAlignment.center : CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: ProtocolColors.emerald.withAlpha(20),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: ProtocolColors.emerald.withAlpha(75)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: ProtocolColors.emerald,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'SYSTEM ONLINE',
                                style: ProtocolTheme.mono(
                                  size: 10.5,
                                  weight: FontWeight.w700,
                                  color: ProtocolColors.emerald,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'BOZHEMAN ≡ PROTOCOL',
                          textAlign: compact ? TextAlign.center : TextAlign.start,
                          style: ProtocolTheme.display(
                            size: compact ? 28 : 38,
                            weight: FontWeight.w700,
                            letterSpacing: -0.8,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          I18n.t('home_tagline'),
                          textAlign: compact ? TextAlign.center : TextAlign.start,
                          style: ProtocolTheme.sans(
                            size: 15,
                            color: ProtocolColors.textSecondary,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Wrap(
                          alignment: compact ? WrapAlignment.center : WrapAlignment.start,
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            CyberButton(
                              label: 'Twitch Live',
                              filled: true,
                              accentColor: ProtocolColors.violet,
                              icon: Icons.live_tv_rounded,
                              onPressed: () => _openExternal('https://www.twitch.tv/Bozhemany'),
                            ),
                            CyberButton(
                              label: '@GrowerSim_bot',
                              accentColor: ProtocolColors.emerald,
                              icon: Icons.send_rounded,
                              onPressed: () => _openExternal('https://t.me/GrowerSim_bot'),
                            ),
                            CyberButton(
                              label: I18n.currentLang == 'ru' ? 'Донат / Крипто' : 'Support / Donate',
                              accentColor: ProtocolColors.gold,
                              icon: Icons.account_balance_wallet_outlined,
                              onPressed: () => SupportModal.show(context, s),
                            ),
                          ],
                        ),
                      ],
                    );

                    if (compact) {
                      return Column(
                        children: [
                          avatarWidget,
                          const SizedBox(height: 18),
                          textContent,
                        ],
                      );
                    }

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        avatarWidget,
                        const SizedBox(width: 28),
                        Expanded(child: textContent),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: 28),

              // ── STREAM 01: SOCIAL HIGHWAY BENTO GRID ──
              _SectionTitle(
                tag: '01',
                title: I18n.t('stream1_title').replaceFirst('01 // ', ''),
                subtitle: I18n.t('stream1_sub'),
              ),
              const SizedBox(height: 14),
              LayoutBuilder(
                builder: (_, constraints) {
                  final w = constraints.maxWidth;
                  final cols = w >= 900 ? 3 : (w >= 540 ? 2 : 1);
                  const gap = 14.0;
                  final cardW = (w - gap * (cols - 1)) / cols;
                  return Wrap(
                    spacing: gap,
                    runSpacing: gap,
                    children: socialCards.map((item) {
                      return SizedBox(
                        width: cardW,
                        child: _SocialBentoCard(
                          title: item.title,
                          handle: item.handle,
                          subtitle: item.subtitle,
                          accent: item.accent,
                          icon: item.icon,
                          onTap: item.onTap,
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
              const SizedBox(height: 28),

              // ── STREAM 02 & 03: INTERACTIVE WORLDS PORTALS (EQUAL VISUAL WEIGHT) ──
              LayoutBuilder(
                builder: (_, constraints) {
                  final w = constraints.maxWidth;
                  final cols = w >= 700 ? 2 : 1;
                  const gap = 14.0;
                  final cardW = (w - gap * (cols - 1)) / cols;
                  return Wrap(
                    spacing: gap,
                    runSpacing: gap,
                    children: [
                      SizedBox(
                        width: cardW,
                        child: _WorldPortalCard(
                          badge: 'FREE-TO-PLAY • 0% REAL MONEY',
                          title: 'SLOTS 777',
                          description: I18n.t('stream2_sub'),
                          ctaLabel: I18n.currentLang == 'ru' ? 'Открыть аркаду' : 'Open Arcade',
                          accent: ProtocolColors.gold,
                          icon: Icons.casino_outlined,
                          onTap: () {
                            AudioService.click();
                            widget.onSelectTab(1);
                          },
                        ),
                      ),
                      SizedBox(
                        width: cardW,
                        child: _WorldPortalCard(
                          badge: '3D CORE • GENETICS • LORE',
                          title: 'NEURAL LAB',
                          description: I18n.t('stream3_sub'),
                          ctaLabel: I18n.currentLang == 'ru' ? 'Войти в лабораторию' : 'Enter Neural Lab',
                          accent: ProtocolColors.emerald,
                          icon: Icons.hub_outlined,
                          onTap: () {
                            AudioService.click();
                            widget.onSelectTab(2);
                          },
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 28),

              // Minimalist clean footer
              Center(
                child: Text(
                  'BOZHEMAN ≡ PROTOCOL • BOZHEMAN.COM',
                  style: ProtocolTheme.mono(
                    size: 11,
                    color: ProtocolColors.textDim,
                    letterSpacing: 1.4,
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

class _AvatarHaloPainter extends CustomPainter {
  final double phase;

  _AvatarHaloPainter({required this.phase});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) / 2 - 2;
    final startAngle = phase * pi * 2;

    final trackPaint = Paint()
      ..color = ProtocolColors.borderSubtle
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    canvas.drawCircle(center, radius, trackPaint);

    final arcPaint = Paint()
      ..shader = SweepGradient(
        startAngle: startAngle,
        endAngle: startAngle + pi * 1.4,
        colors: [
          Colors.transparent,
          ProtocolColors.crimson.withAlpha(200),
          ProtocolColors.gold.withAlpha(180),
        ],
        transform: GradientRotation(startAngle),
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.4;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      pi * 1.15,
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _AvatarHaloPainter oldDelegate) => oldDelegate.phase != phase;
}

class _SectionTitle extends StatelessWidget {
  final String tag;
  final String title;
  final String subtitle;

  const _SectionTitle({
    required this.tag,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: ProtocolColors.bgSurfaceElevated,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: ProtocolColors.borderSubtle),
          ),
          child: Text(
            tag,
            style: ProtocolTheme.mono(
              size: 11,
              weight: FontWeight.w700,
              color: ProtocolColors.crimson,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: ProtocolTheme.display(size: 17, letterSpacing: -0.2),
              ),
              Text(
                subtitle,
                style: ProtocolTheme.sans(size: 12.5, color: ProtocolColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SocialBentoCard extends StatelessWidget {
  final String title;
  final String handle;
  final String subtitle;
  final Color accent;
  final IconData icon;
  final VoidCallback onTap;

  const _SocialBentoCard({
    required this.title,
    required this.handle,
    required this.subtitle,
    required this.accent,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BentoCard(
      accentColor: accent,
      padding: const EdgeInsets.all(20),
      borderRadius: 20,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: accent.withAlpha(26),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: accent.withAlpha(85)),
                ),
                child: Icon(icon, color: accent, size: 21),
              ),
              const Spacer(),
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0x0AFFFFFF),
                  border: Border.all(color: ProtocolColors.borderSubtle),
                ),
                child: const Icon(
                  Icons.north_east_rounded,
                  size: 15,
                  color: ProtocolColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            title,
            style: ProtocolTheme.display(size: 19, color: ProtocolColors.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: ProtocolTheme.sans(size: 13, color: ProtocolColors.textSecondary),
          ),
          const SizedBox(height: 10),
          Text(
            handle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: ProtocolTheme.mono(size: 11.5, color: accent),
          ),
        ],
      ),
    );
  }
}

class _WorldPortalCard extends StatelessWidget {
  final String badge;
  final String title;
  final String description;
  final String ctaLabel;
  final Color accent;
  final IconData icon;
  final VoidCallback onTap;

  const _WorldPortalCard({
    required this.badge,
    required this.title,
    required this.description,
    required this.ctaLabel,
    required this.accent,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BentoCard(
      accentColor: accent,
      padding: const EdgeInsets.all(24),
      borderRadius: 22,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: accent.withAlpha(22),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: accent.withAlpha(80)),
                  ),
                  child: Text(
                    badge,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: ProtocolTheme.mono(
                      size: 10,
                      weight: FontWeight.w700,
                      color: accent,
                      letterSpacing: 0.7,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Icon(icon, color: accent, size: 22),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: ProtocolTheme.display(size: 24, letterSpacing: -0.4),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: ProtocolTheme.sans(
              size: 13.5,
              color: ProtocolColors.textSecondary,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Flexible(
                child: Text(
                  ctaLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: ProtocolTheme.sans(
                    size: 13.5,
                    weight: FontWeight.w600,
                    color: accent,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Icon(Icons.arrow_forward_rounded, size: 16, color: accent),
            ],
          ),
        ],
      ),
    );
  }
}
