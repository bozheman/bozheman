import 'package:flutter_test/flutter_test.dart';
import 'package:bozheman_protocol/main.dart';
import 'package:bozheman_protocol/services/api_service.dart';
import 'package:bozheman_protocol/state/protocol_state.dart';
import 'package:bozheman_protocol/widgets/qr_painter.dart';

void main() {
  test('Mendel Harvest calculator produces valid deterministic metrics', () {
    final starter = ApiService.localHarvest(
      strainMult: 1.0,
      hp: 85,
      streak: 3,
      lightMult: 1.0,
    );
    final quantum = ApiService.localHarvest(
      strainMult: 3.0,
      hp: 100,
      streak: 30,
      lightMult: 1.6,
    );

    expect(starter.biomass, greaterThan(0));
    expect(quantum.biomass, greaterThan(starter.biomass));
    expect(quantum.mutationChance, lessThanOrEqualTo(35.0));
  });

  test('Local Slots 777 spin returns 3 valid symbols and hash', () {
    final res = ApiService.localSpin(50);
    expect(res.reels.length, 3);
    expect(res.bet, 50);
    expect(res.hash.length, 64);
  });

  test('QR encoder generates square matrix for crypto addresses', () {
    final matrix = QrMatrixEncoder.encode('TF2MHpNpfaYkhVd855mMfTgusfxG8N7hZa');
    expect(matrix.length, 29); // Version 3 = 29x29 for 34-char address
    expect(matrix.first.length, 29);
  });

  testWidgets('Home screen renders lightweight Three-Stream portal cleanly', (tester) async {
    final state = ProtocolState();
    await tester.pumpWidget(BozhemanProtocolApp(injectedState: state));
    await tester.pump();

    expect(find.text('BOZHEMAN ≡ PROTOCOL'), findsOneWidget);
    expect(find.text('Twitch'), findsOneWidget);
    expect(find.text('YouTube'), findsOneWidget);
    expect(find.text('Instagram'), findsOneWidget);
    expect(find.text('TikTok'), findsOneWidget);
    expect(find.textContaining('01 //'), findsOneWidget);
    expect(find.textContaining('02 //'), findsOneWidget);
    expect(find.textContaining('03 //'), findsOneWidget);
  });
}
