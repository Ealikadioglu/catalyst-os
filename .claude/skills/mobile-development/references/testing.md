# Testing

Flutter tests are TDD-ready. In Catalyst, Enforcer writes them RED first; the Artificer makes them GREEN.

## Layers

| Layer | Tool | Tests |
|-------|------|-------|
| Unit | `flutter_test` | Notifiers, blocs, pure Dart logic |
| Widget | `flutter_test` + `WidgetTester` | A widget renders and reacts correctly |
| Integration | `integration_test` | Full flows on a device/emulator |
| Golden | `matchesGoldenFile` | Pixel-level UI regression (use sparingly) |

## Widget Test Skeleton

```dart
testWidgets('shows count and increments on tap', (tester) async {
  await tester.pumpWidget(
    const ProviderScope(child: MaterialApp(home: CounterScreen())),
  );

  expect(find.text('0'), findsOneWidget);

  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();

  expect(find.text('1'), findsOneWidget);
});
```

## Mocking Providers (Riverpod)

Override providers in the test's `ProviderScope`:

```dart
await tester.pumpWidget(
  ProviderScope(
    overrides: [itemsProvider.overrideWith((ref) => Future.value(fakeItems))],
    child: const MaterialApp(home: ItemsScreen()),
  ),
);
await tester.pumpAndSettle();
```

## Rules

- `pump()` advances one frame; `pumpAndSettle()` waits for animations/futures — pick deliberately.
- Test the four states: assert loading, error (+ retry), empty, and success paths.
- Prefer finding by semantics/text/key over widget type.
- Test bloc transitions with `bloc_test` (`blocTest`, `expect: [...]`).
- Keep golden tests few and platform-pinned — they're brittle across font/render changes.
- Run `flutter test` and confirm the RED→GREEN transition; include the output when reporting.
