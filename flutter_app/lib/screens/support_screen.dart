import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';
import '../widgets/qr_painter.dart';

class SupportScreen extends StatefulWidget {
  final ProtocolState state;

  const SupportScreen({super.key, required this.state});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  String? _copiedAddress;

  void _copyWallet(String addr) {
    WebBridge.copyText(addr);
    AudioService.copy();
    widget.state.unlockAchievement('CRYPTO_PATRON');
    setState(() => _copiedAddress = addr);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copiedAddress = null);
    });
  }

  void _showQrDialog(String title, String data) {
    AudioService.click();
    widget.state.unlockAchievement('CRYPTO_PATRON');
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
                title,
                style: ProtocolTheme.mono(size: 14, weight: FontWeight.w700, color: ProtocolColors.gold),
              ),
              const SizedBox(height: 14),
              QrCodeWidget(
                data: data,
                size: 204,
                moduleColor: ProtocolColors.crimson,
              ),
              const SizedBox(height: 10),
              SelectableText(
                data,
                textAlign: TextAlign.center,
                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textSecondary),
              ),
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
    const steamUrl = 'https://steamcommunity.com/tradeoffer/new/?partner=158634293&token=U2y7ekdF';
    const dmarketInv =
        'https://dmarket.com/ua/ingame-items/item-list/csgo-skins?sagaAddress=0x064Ca91243119Da8484b401984eC625554Ec9b30&exchangeTab=f2fOffers';

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 940),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                I18n.t('support_title'),
                style: ProtocolTheme.mono(size: 20, weight: FontWeight.w700, color: ProtocolColors.crimson),
              ),
              const SizedBox(height: 14),

              // Crypto Gateways
              CyberPanel(
                borderColor: ProtocolColors.borderBright,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      I18n.t('crypto_gateways'),
                      style: ProtocolTheme.mono(size: 14, weight: FontWeight.w700, color: ProtocolColors.gold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      I18n.t('crypto_net_warning'),
                      style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textMuted),
                    ),
                    const SizedBox(height: 12),
                    for (final w in ApiService.defaultWallets) ...[
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: ProtocolColors.bgPure,
                          border: Border.all(color: ProtocolColors.borderSubtle),
                        ),
                        child: Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 10,
                          runSpacing: 8,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  w.symbol,
                                  style: ProtocolTheme.mono(
                                    size: 13,
                                    weight: FontWeight.w700,
                                    color: ProtocolColors.gold,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: ProtocolColors.borderSubtle),
                                  ),
                                  child: Text(w.network, style: ProtocolTheme.mono(size: 10, color: ProtocolColors.textDim)),
                                ),
                              ],
                            ),
                            SelectableText(
                              w.address,
                              style: ProtocolTheme.mono(size: 12, color: ProtocolColors.textPrimary),
                            ),
                            Wrap(
                              spacing: 6,
                              children: [
                                CyberButton(
                                  label: _copiedAddress == w.address ? I18n.t('copied') : I18n.t('copy_btn'),
                                  compact: true,
                                  accentColor: _copiedAddress == w.address
                                      ? ProtocolColors.emerald
                                      : ProtocolColors.crimson,
                                  onPressed: () => _copyWallet(w.address),
                                ),
                                CyberButton(
                                  label: I18n.t('qr_btn_label'),
                                  compact: true,
                                  accentColor: ProtocolColors.gold,
                                  onPressed: () => _showQrDialog('${w.symbol} (${w.network})', w.address),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Steam Trade + Partner Referrals
              CyberPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      I18n.t('steam_send_items'),
                      style: ProtocolTheme.mono(size: 14, weight: FontWeight.w700, color: ProtocolColors.crimson),
                    ),
                    const SizedBox(height: 10),
                    CyberButton(
                      label: I18n.t('steam_send'),
                      icon: Icons.swap_horiz,
                      onPressed: () {
                        AudioService.click();
                        WebBridge.openUrl(steamUrl);
                      },
                    ),
                    const SizedBox(height: 18),
                    Text(
                      I18n.t('referral_systems'),
                      style: ProtocolTheme.mono(size: 14, weight: FontWeight.w700, color: ProtocolColors.crimson),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        CyberButton(
                          label: 'DMarket',
                          onPressed: () => WebBridge.openUrl('https://dmarket.com?ref=9Slq8aucc0'),
                        ),
                        CyberButton(
                          label: 'CSGOEmpire',
                          onPressed: () => WebBridge.openUrl('https://csgoempire.com/r/bozheman'),
                        ),
                        CyberButton(
                          label: 'SWAP.GG',
                          onPressed: () => WebBridge.openUrl('https://swap.gg/?r=uqOV9EAMXC'),
                        ),
                        CyberButton(
                          label: I18n.t('ref_dmarket_inv'),
                          accentColor: ProtocolColors.gold,
                          onPressed: () => WebBridge.openUrl(dmarketInv),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      I18n.t('ref_disclaimer'),
                      style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textDim),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Node QR Share
              CyberPanel(
                child: Column(
                  children: [
                    Text(
                      I18n.t('site_qr_label'),
                      style: ProtocolTheme.mono(size: 12, weight: FontWeight.w700, color: ProtocolColors.crimson),
                    ),
                    const SizedBox(height: 10),
                    const QrCodeWidget(data: 'https://bozheman.com', size: 150),
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
