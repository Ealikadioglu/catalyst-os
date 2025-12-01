---
name: browser-automation
description: >
  Automate browser interactions for testing and validation. TRIGGERS: manual
  testing validation, capturing screenshots, visual verification of UI.
---

# Browser Automation

Automate browser interactions.

## When to Use

- Manual testing validation
- Screenshot capture
- Visual verification

## Browser Tools

```
browser_navigate → Navigate to URL
browser_snapshot → Get page structure
browser_click → Click elements
browser_type → Type text
browser_take_screenshot → Capture page
```

## Testing Flow

1. Navigate to page
2. Snapshot for elements
3. Interact (click, type)
4. Verify state
5. Screenshot if needed

## Common Patterns

### Form Fill
```
1. snapshot - Get form refs
2. type - Fill fields
3. click - Submit
4. snapshot - Verify success
```

### Navigation Test
```
1. navigate - Go to page
2. click - Click link
3. snapshot - Verify new page
```

## Checklist

- [ ] Navigation works
- [ ] Elements interactable
- [ ] Screenshots captured
- [ ] Responsive tested
