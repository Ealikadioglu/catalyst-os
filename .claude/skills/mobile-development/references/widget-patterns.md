# Widget Patterns

## The Four States

Every data-driven screen renders exactly one of:

- **Loading** — skeleton or spinner, never a blank frame
- **Error** — message + retry affordance
- **Empty** — explains the emptiness, offers next action
- **Success** — the data

With Riverpod `AsyncValue`:

```dart
ref.watch(itemsProvider).when(
  loading: () => const LoadingView(),
  error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(itemsProvider)),
  data: (items) => items.isEmpty ? const EmptyView() : ItemList(items: items),
);
```

## Composition

- Extract widget CLASSES, never helper methods that return `Widget` — classes get `const` and their own rebuild boundary.
- Never declare a widget class inside a `build()` method.
- Keep `build()` pure: no side effects, no allocation of controllers.
- Use `const` constructors for every immutable widget — this is the single biggest rebuild win.
- Give list items stable keys (`ValueKey(item.id)`), not index-based keys.

```dart
// GOOD — const class, own rebuild boundary
class _Avatar extends StatelessWidget {
  const _Avatar(this.url);
  final String url;
  @override
  Widget build(BuildContext context) => CircleAvatar(backgroundImage: NetworkImage(url));
}
```

## Layout & Adaptivity

- Use `LayoutBuilder` / `MediaQuery` for responsive breakpoints (phone / tablet / foldable).
- Honor platform: `Theme.of(context).platform` to branch Material vs Cupertino affordances where it matters.
- Respect safe areas (`SafeArea`) and dynamic text scaling.

## Animation

- Prefer implicit animations (`AnimatedContainer`, `AnimatedOpacity`) for simple transitions.
- Reach for explicit controllers (`AnimationController`) only when you need fine control; dispose them.
- Don't animate inside long lists without profiling — see `performance.md`.

## Accessibility

- Add `Semantics` labels to icon-only buttons and images.
- Ensure tap targets are ≥ 48dp.
- Don't hard-code text sizes that ignore the user's scale factor.
