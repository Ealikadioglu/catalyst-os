---
name: mobile-development
description: Build Flutter and Dart features including widgets, Riverpod or Bloc state, GoRouter navigation, and platform channels. Use when implementing mobile code during a build phase.
---

# Mobile Development

> **When to invoke:** When implementing mobile features with Flutter and Dart.
> **Used by:** The Artificer agent (during `/forge-spec` build phase).
> **Type:** Flexible — adapt the phase pipeline to the task, but never skip TDD or `flutter analyze`.

## Purpose

Build high-quality, cross-platform Flutter apps: composable widgets, disciplined state management, declarative navigation, and jank-free performance — all under strict TDD.

## Scope

This skill covers **Flutter 3+ / Dart**:

- State management — Riverpod and Bloc/Cubit
- Navigation — GoRouter with deep linking
- Widget composition and animation
- Platform channels and native (iOS/Android) integration
- Performance profiling and rebuild elimination

If the project's `tech-stack.md` specifies a different mobile stack (e.g. React Native), STOP and ask — this skill assumes Flutter.

## Companion References

Load the reference that matches the task. Don't read all of them up front.

| Reference | Load when... |
|-----------|-------------|
| `references/state-management.md` | Choosing/implementing Riverpod or Bloc, wiring providers/notifiers |
| `references/navigation.md` | Building routes, deep linking, guarded/nested navigation |
| `references/widget-patterns.md` | Composing widgets, handling the four states, animations |
| `references/testing.md` | Writing widget/integration tests, mocking providers |
| `references/performance.md` | Diagnosing jank, reducing rebuilds, DevTools profiling |

## Phase Pipeline

A flexible 5-phase flow. Each phase has a checkpoint that must pass before advancing.

```
1. SETUP    → project structure + dependencies    ── checkpoint: `flutter pub get` clean
2. STATE    → providers / blocs defined            ── checkpoint: `flutter analyze` clean
3. WIDGETS  → screens + reusable widgets           ── checkpoint: widget tests written (red)
4. TEST     → widget + integration coverage        ── checkpoint: all tests PASS (green)
5. OPTIMIZE → profile + eliminate rebuilds         ── checkpoint: no avoidable jank
```

Within Catalyst's build, phases 3–4 are where TDD lives: tests written by Enforcer must be RED before the Artificer implements to GREEN. See `.claude/skills/build-orchestration/SKILL.md`.

## MUST DO

- Use `const` constructors wherever the widget is immutable
- Give dynamically built list items stable keys
- Use `Consumer`/`ConsumerWidget` (Riverpod) or `BlocBuilder` (Bloc) to scope rebuilds
- Handle all four states in any data-driven screen: loading, error, empty, success
- Run `flutter analyze` — it must be clean before reporting done
- One state-management approach per project — don't mix Riverpod and Bloc arbitrarily

## MUST NOT DO

- Define widget classes inside a `build()` method
- Mutate state directly — go through the notifier/bloc
- Reach for `setState` for app-wide or shared state
- Ignore platform differences (iOS vs Android) where they matter
- Ship without profiling a screen that animates or scrolls large lists

## Standard Checklist

1. Confirm the state-management approach from the spec / existing code
2. Write widget tests first (red) — see `references/testing.md`
3. Model state in a provider/bloc — see `references/state-management.md`
4. Compose the widget tree with the four states — see `references/widget-patterns.md`
5. Wire navigation — see `references/navigation.md`
6. Make tests pass (green), refactor
7. Run `flutter analyze` — clean
8. Profile if the screen scrolls/animates — see `references/performance.md`
9. Update `tasks.md`, then report with actual test + analyze output
