# Navigation

Use **GoRouter** for declarative, deep-link-ready routing.

## Principles

- Declare routes in one place; keep path strings as named constants.
- Prefer typed route objects / named routes over raw string paths at call sites.
- Support deep links from day one — every screen reachable by URL.
- Guard protected routes with `redirect`, driven by auth state.
- Nest routes for shells (bottom nav, tabs) with `ShellRoute`.

## Skeleton

```dart
final router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final loggedIn = authState.isLoggedIn;
    final loggingIn = state.matchedLocation == '/login';
    if (!loggedIn && !loggingIn) return '/login';
    if (loggedIn && loggingIn) return '/';
    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (c, s) => const HomeScreen()),
    GoRoute(
      path: '/item/:id',
      builder: (c, s) => ItemScreen(id: s.pathParameters['id']!),
    ),
  ],
);
```

## Rules

- Navigate with `context.go` (replace) vs `context.push` (stack) deliberately — know which you want.
- Pass IDs via path/query params, not whole objects; refetch by ID on the target screen.
- Keep `redirect` pure and fast — it runs on every navigation.
- Test deep links: launching directly at `/item/42` must render correctly with no prior stack.
- Handle unknown routes with `errorBuilder`.
