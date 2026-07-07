# Performance

Target a steady 60/120fps. Jank = a frame that misses its budget (~16ms at 60fps).

## Diagnose First

- Run in **profile mode** (`flutter run --profile`) — never profile in debug.
- Open **DevTools → Performance**; record while reproducing the jank.
- Use the **Performance overlay** to spot UI-thread vs raster-thread spikes.
- Turn on **"Track widget rebuilds"** to find widgets rebuilding too often.

## Common Fixes

| Symptom | Fix |
|---------|-----|
| Whole subtree rebuilds on state change | Add `const`; split into smaller widgets; scope with `Consumer`/`select`/`buildWhen` |
| Janky long list | Use `ListView.builder`/`SliverList` (lazy), not `ListView(children: [...])` |
| List rebuilds all rows | Stable `ValueKey` per row; `const` row widgets |
| Expensive work in `build()` | Move to notifier/bloc or memoize; `build()` must be cheap and pure |
| Big images stutter | `cacheWidth`/`cacheHeight`, `ResizeImage`, precache above the fold |
| Raster-thread spikes | Reduce `Opacity`/`ClipPath`/shadows; avoid `saveLayer`; use `RepaintBoundary` |

## Rules

- `const` everywhere possible — the cheapest rebuild is the one that doesn't happen.
- Watch the narrowest slice of state (`ref.watch(p.select(...))`, `buildWhen`).
- Wrap independently-repainting subtrees in `RepaintBoundary` (e.g. an animation over a static list).
- Never guess — measure before and after each change and keep the numbers.
- Any screen that scrolls large lists or animates gets a profiling pass before you report done.
