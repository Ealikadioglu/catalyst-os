# State Management

Pick ONE approach per project. If the spec or `tech-stack.md` names one, use it. If not, STOP and ask.

## Choosing

| Use Riverpod when... | Use Bloc/Cubit when... |
|----------------------|------------------------|
| You want compile-safe DI and less boilerplate | The team already standardizes on Bloc |
| State is derived/composed from other state | Logic is event-driven with clear transitions |
| You favor providers + `ref.watch` | You favor explicit events → states + a stream |

Never mix the two for the same feature.

## Riverpod

- Prefer `NotifierProvider` / `AsyncNotifierProvider` (Riverpod 2+) over legacy `StateNotifier`.
- Read with `ref.watch` in `build`; act with `ref.read` in callbacks.
- Model async data as `AsyncValue` and render with `.when(data/error/loading)`.
- Scope rebuilds with `Consumer` / `ConsumerWidget`; use `select` to watch one field.

```dart
final counterProvider = NotifierProvider<Counter, int>(Counter.new);

class Counter extends Notifier<int> {
  @override
  int build() => 0;
  void increment() => state++;
}
```

```dart
class CounterText extends ConsumerWidget {
  const CounterText({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Text('$count');
  }
}
```

## Bloc / Cubit

- Cubit for simple state; Bloc when you want an explicit event log.
- Keep events and states immutable (use `equatable` or `freezed`).
- Read with `context.watch`/`BlocBuilder`; dispatch with `context.read<X>().add(...)`.
- Use `buildWhen`/`listenWhen` to scope rebuilds and side effects.

```dart
class CounterCubit extends Cubit<int> {
  CounterCubit() : super(0);
  void increment() => emit(state + 1);
}
```

## Rules

- Business logic lives in the notifier/bloc, never in the widget.
- Never mutate state directly — go through the notifier/bloc method.
- Represent the four states (loading / error / empty / success) in the state model, not with ad-hoc flags scattered across widgets.
- Dispose controllers and subscriptions; Riverpod auto-disposes with `autoDispose`.
