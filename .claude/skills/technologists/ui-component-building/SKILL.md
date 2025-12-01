---
name: ui-component-building
description: >
  Build UI components from designs. TRIGGERS: implementing visual components
  from Figma, creating design system components, building complex UI elements.
---

# UI Component Building

Build UI components from designs.

## When to Use

- Implementing from Figma
- Building design system
- Creating complex UI

## Process

1. **Analyze design**
   - Extract tokens
   - Identify components
   - Note states

2. **Build component**
   - Structure first
   - Add styling
   - Handle states

3. **Verify**
   - Compare to design
   - Test all states
   - Check responsive

## Design Tokens

```css
--color-primary: #3B82F6;
--spacing-4: 16px;
--radius-md: 8px;
```

## State Handling

```tsx
const states = {
  default: 'bg-primary',
  hover: 'bg-primary-dark',
  disabled: 'bg-gray-300',
}
```

## Checklist

- [ ] Matches design
- [ ] All states handled
- [ ] Responsive
- [ ] Accessible
