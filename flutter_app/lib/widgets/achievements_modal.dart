import 'package:material_ui/material_ui.dart';
import '../l10n/i18n.dart';
import '../state/protocol_state.dart';
import '../theme/protocol_theme.dart';

class AchievementsModal extends StatelessWidget {
  final ProtocolState state;

  const AchievementsModal({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final total = ProtocolState.achievementsCatalog.length;
    final unlockedCount = state.achievements.length;

    return Dialog(
      backgroundColor: ProtocolColors.surfaceDark,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: ProtocolColors.borderBright),
        borderRadius: BorderRadius.circular(4),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 680, maxHeight: 580),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Text(
                    I18n.t('ach_modal_title'),
                    style: ProtocolTheme.mono(
                      size: 15,
                      weight: FontWeight.w700,
                      color: ProtocolColors.gold,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '$unlockedCount / $total',
                    style: ProtocolTheme.mono(size: 13, color: ProtocolColors.emerald),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.close, color: ProtocolColors.textMuted, size: 18),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              LinearProgressIndicator(
                value: unlockedCount / total,
                minHeight: 4,
                backgroundColor: ProtocolColors.bgPure,
                color: ProtocolColors.gold,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.separated(
                  itemCount: total,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, idx) {
                    final def = ProtocolState.achievementsCatalog[idx];
                    final unlocked = state.achievements.contains(def.id);
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: unlocked ? ProtocolColors.surfaceElevated : ProtocolColors.bgPure,
                        border: Border.all(
                          color: unlocked ? ProtocolColors.gold.withAlpha(150) : ProtocolColors.borderSubtle,
                        ),
                        borderRadius: BorderRadius.circular(3),
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
                                  style: ProtocolTheme.mono(
                                    size: 13,
                                    weight: FontWeight.w700,
                                    color: unlocked ? ProtocolColors.gold : ProtocolColors.textDim,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  I18n.t(def.descKey),
                                  style: ProtocolTheme.mono(
                                    size: 11,
                                    color: unlocked ? ProtocolColors.textSecondary : ProtocolColors.textDim,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            unlocked ? Icons.check_circle : Icons.lock_outline,
                            color: unlocked ? ProtocolColors.emerald : ProtocolColors.textDim,
                            size: 18,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
