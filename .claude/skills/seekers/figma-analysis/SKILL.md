---
name: figma-analysis
description: >
  Extract design specifications from Figma files. Use when implementing UI
  from Figma designs or extracting design tokens.
agent: surveyor
---

# Figma Analysis

Extract design specifications from Figma.

## When to Use

- Implementing UI from designs
- Extracting design tokens
- Understanding component specs

## Process

1. **Access Figma file**
   - User provides link or exports

2. **Extract design tokens**
   - Colors (hex values)
   - Typography (font, size, weight)
   - Spacing (margins, padding)
   - Border radius, shadows

3. **Document components**
   - Component hierarchy
   - States (default, hover, active)
   - Responsive variants

## Extraction Checklist

- [ ] Primary/secondary colors
- [ ] Font families and sizes
- [ ] Spacing scale
- [ ] Button states
- [ ] Input states

## Output Format

```markdown
## Figma Analysis: {Screen}

### Design Tokens
```css
--color-primary: #3B82F6;
--spacing-4: 16px;
```

### Component Specifications
#### Button - Primary
- Background: var(--color-primary)
- Padding: 12px 24px
```
