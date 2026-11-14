import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
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
    expect(matrix.length, 29);
    expect(matrix.first.length, 29);
  });

  testWidgets('V2 Home screen renders ultra-clean 3-world Bento portal without overflow', (tester) async {
    tester.view.physicalSize = const Size(1280, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final state = ProtocolState();
    await tester.pumpWidget(BozhemanProtocolApp(injectedState: state));
    await tester.pump();

    expect(find.text('BOZHEMAN ≡ PROTOCOL'), findsOneWidget);
    expect(find.text('Twitch'), findsOneWidget);
    expect(find.text('YouTube'), findsOneWidget);
    expect(find.text('Instagram'), findsOneWidget);
    expect(find.text('TikTok'), findsOneWidget);
    expect(find.text('SLOTS 777'), findsNWidgets(2)); // Nav pill + bottom portal card
    expect(find.text('NEURAL LAB'), findsNWidgets(2)); // Nav pill + bottom portal card
  });

  testWidgets('V2 layout works cleanly on 320px narrow mobile across all worlds without throwing', (tester) async {
    tester.view.physicalSize = const Size(320, 740);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final state = ProtocolState();
    await tester.pumpWidget(BozhemanProtocolApp(injectedState: state));
    await tester.pump();
    expect(find.text('BOZHEMAN ≡ PROTOCOL'), findsOneWidget);
    expect(tester.takeException(), isNull);

    // Switch to SLOTS 777 on 320px mobile
    await tester.tap(find.text('SLOTS 777').first);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.takeException(), isNull);

    // Switch to NEURAL LAB and its sub-tabs on 320px mobile
    await tester.tap(find.text('NEURAL LAB').first);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.takeException(), isNull);

    await tester.tap(find.textContaining('Менделя'));
    await tester.pump();
    expect(tester.takeException(), isNull);

    await tester.tap(find.textContaining('Терминал'));
    await tester.pump();
    expect(tester.takeException(), isNull);
  });

  testWidgets('Switching to SLOTS 777 and NEURAL LAB worlds works cleanly', (tester) async {
    tester.view.physicalSize = const Size(1280, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final state = ProtocolState();
    await tester.pumpWidget(BozhemanProtocolApp(injectedState: state));
    await tester.pump();

    // Tap SLOTS 777 nav pill (first match in HudBar)
    await tester.tap(find.text('SLOTS 777').first);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));
    expect(find.text('1000'), findsOneWidget);

    // Tap NEURAL LAB nav pill
    await tester.tap(find.text('NEURAL LAB').first);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));
    expect(find.textContaining('0 / 10'), findsOneWidget);
  });
}
