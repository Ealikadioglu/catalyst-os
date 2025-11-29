---
name: react-development
description: >
  Build React components, hooks, and pages. Use when implementing UI
  features or creating React components.
agent: shaper
---

# React Development

Build React components and features.

## When to Use

- Creating components
- Building pages
- Writing custom hooks

## Process

1. **Check project patterns**
   - Component structure
   - Styling approach
   - State management

2. **Design component**
   - Props interface
   - State needs

3. **Implement with TDD**
   - Component tests exist
   - Implement component
   - Verify tests pass

4. **Add styling**
   - Follow project approach
   - Responsive design

## Component Pattern

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant, children, onClick }: ButtonProps) {
  return (
    <button className={styles[variant]} onClick={onClick}>
      {children}
    </button>
  )
}
```

## Checklist

- [ ] TypeScript types
- [ ] Component tests
- [ ] Responsive
- [ ] Accessible
