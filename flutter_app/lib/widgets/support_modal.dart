import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/web_bridge.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';
import 'qr_painter.dart';

/// Clean modal dialog housing Direct Donations, Crypto Wallets (copy + QR),
/// Steam Trade Offer, and Referral Skin Gateways without cluttering the Home screen.
class SupportModal extends StatefulWidget {
  final ProtocolState state;

  const SupportModal({super.key, required this.state});

  static Future<void> show(BuildContext context, ProtocolState state) {
    AudioService.click();
    return showDialog<void>(
      context: context,
      builder: (_) => SupportModal(state: state),
    );
  }

  @override
  State<SupportModal> createState() => _SupportModalState();
}

class _SupportModalState extends State<SupportModal> {
  String? _copiedAddress;
  WalletEntry? _qrWallet;

  void _copyWallet(String addr) {
    WebBridge.copyText(addr);
    AudioService.copy();
    widget.state.unlockAchievement('CRYPTO_PATRON');
    setState(() => _copiedAddress = addr);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copiedAddress = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    const steamUrl = 'https://steamcommunity.com/tradeoffer/new/?partner=158634293&token=U2y7ekdF';
    const donatelloUrl = 'https://donatello.to/bozheman';
    const dmarketInv =
        'https://dmarket.com/ua/ingame-items/item-list/csgo-skins?sagaAddress=0x064Ca91243119Da8484b401984eC625554Ec9b30&exchangeTab=f2fOffers';

    return Dialog(
      backgroundColor: ProtocolColors.bgSurface,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: ProtocolColors.borderBright),
        borderRadius: BorderRadius.circular(24),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 680, maxHeight: 740),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: ProtocolColors.gold.withAlpha(30),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ProtocolColors.gold.withAlpha(110)),
                    ),
                    child: const Icon(Icons.diamond_outlined, color: ProtocolColors.gold, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          I18n.t('support_title'),
                          style: ProtocolTheme.display(size: 18, color: ProtocolColors.textPrimary),
                        ),
                        Text(
                          'Donatello • Crypto • Steam • CS2',
                          style: ProtocolTheme.sans(size: 12, color: ProtocolColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: ProtocolColors.textSecondary),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: ProtocolColors.borderSubtle, height: 1),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Primary Fast Gateways (Donatello + Steam)
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          CyberButton(
                            label: 'Donatello (${I18n.t('nav_donation').replaceAll('💰 ', '')})',
                            filled: true,
                            accentColor: ProtocolColors.gold,
                            icon: Icons.favorite_outline_rounded,
                            onPressed: () {
                              AudioService.click();
                              WebBridge.openUrl(donatelloUrl);
                            },
                          ),
                          CyberButton(
                            label: I18n.t('steam_send'),
                            icon: Icons.swap_horiz_rounded,
                            accentColor: ProtocolColors.crimson,
                            onPressed: () {
                              AudioService.click();
                              WebBridge.openUrl(steamUrl);
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Inline QR preview when selected
                      if (_qrWallet != null) ...[
                        CyberPanel(
                          borderColor: ProtocolColors.gold.withAlpha(120),
                          backgroundColor: ProtocolColors.bgVoid,
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Text(
                                    '${_qrWallet!.symbol} (${_qrWallet!.network})',
                                    style: ProtocolTheme.mono(
                                      size: 13,
                                      weight: FontWeight.w700,
                                      color: ProtocolColors.gold,
                                    ),
                                  ),
                                  const Spacer(),
                                  GestureDetector(
                                    onTap: () => setState(() => _qrWallet = null),
                                    child: const Icon(Icons.close, size: 18, color: ProtocolColors.textSecondary),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              QrCodeWidget(
                                data: _qrWallet!.address,
                                size: 176,
                                moduleColor: ProtocolColors.gold,
                              ),
                              const SizedBox(height: 10),
                              SelectableText(
                                _qrWallet!.address,
                                textAlign: TextAlign.center,
                                style: ProtocolTheme.mono(size: 11, color: ProtocolColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Crypto Wallets List
                      Text(
                        I18n.t('crypto_gateways'),
                        style: ProtocolTheme.mono(
                          size: 11.5,
                          weight: FontWeight.w700,
                          color: ProtocolColors.textSecondary,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 8),
                      for (final w in ApiService.defaultWallets) ...[
                        Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: ProtocolColors.bgVoid.withAlpha(190),
                            borderRadius: BorderRadius.circular(14),
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
                                    style: ProtocolTheme.display(size: 15, color: ProtocolColors.gold),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: ProtocolColors.bgSurfaceElevated,
                                      borderRadius: BorderRadius.circular(999),
                                      border: Border.all(color: ProtocolColors.borderSubtle),
                                    ),
                                    child: Text(
                                      w.network,
                                      style: ProtocolTheme.mono(size: 10, color: ProtocolColors.textSecondary),
                                    ),
                                  ),
                                ],
                              ),
                              SelectableText(
                                w.address,
                                style: ProtocolTheme.mono(size: 11.5, color: ProtocolColors.textPrimary),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CyberButton(
                                    label: _copiedAddress == w.address ? I18n.t('copied') : I18n.t('copy_btn'),
                                    compact: true,
                                    accentColor: _copiedAddress == w.address
                                        ? ProtocolColors.emerald
                                        : ProtocolColors.crimson,
                                    onPressed: () => _copyWallet(w.address),
                                  ),
                                  const SizedBox(width: 6),
                                  CyberButton(
                                    label: 'QR',
                                    compact: true,
                                    accentColor: ProtocolColors.gold,
                                    onPressed: () {
                                      AudioService.click();
                                      widget.state.unlockAchievement('CRYPTO_PATRON');
                                      setState(() => _qrWallet = w);
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),

                      // Partner Referral Systems
                      Text(
                        I18n.t('referral_systems'),
                        style: ProtocolTheme.mono(
                          size: 11.5,
                          weight: FontWeight.w700,
                          color: ProtocolColors.textSecondary,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          CyberButton(
                            label: 'DMarket',
                            compact: true,
                            onPressed: () => WebBridge.openUrl('https://dmarket.com?ref=9Slq8aucc0'),
                          ),
                          CyberButton(
                            label: 'CSGOEmpire',
                            compact: true,
                            onPressed: () => WebBridge.openUrl('https://csgoempire.com/r/bozheman'),
                          ),
                          CyberButton(
                            label: 'SWAP.GG',
                            compact: true,
                            onPressed: () => WebBridge.openUrl('https://swap.gg/?r=uqOV9EAMXC'),
                          ),
                          CyberButton(
                            label: I18n.t('ref_dmarket_inv'),
                            compact: true,
                            accentColor: ProtocolColors.gold,
                            onPressed: () => WebBridge.openUrl(dmarketInv),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        I18n.t('crypto_net_warning'),
                        style: ProtocolTheme.sans(size: 11.5, color: ProtocolColors.textDim),
                      ),
                    ],
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
