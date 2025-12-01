---
name: requirement-elicitation
description: >
  Extract clear requirements from vague feature requests. TRIGGERS: feature request,
  new spec, unclear requirements, /catalyze-spec command. Asks targeted clarifying
  questions about scope, users, success criteria, and edge cases.
---

# Requirement Elicitation

Extract requirements through targeted questioning.

## When to Use

- During `/catalyze-spec` workflow
- When user request lacks details
- When multiple interpretations exist

## Process

1. **Analyze the request**
   - Identify core intent
   - Note ambiguous terms
   - List missing information

2. **Formulate questions** (max 5)
   - Scope boundaries
   - User personas
   - Success criteria
   - Edge cases

3. **Ask conversationally**
   - Group related questions
   - Prioritize critical ones
   - Wait for response

## Question Templates

### Scope
- "Should this include [X] or is that out of scope?"
- "What happens when [edge case]?"

### Users
- "Who will primarily use this?"
- "Different user types with different needs?"

### Success
- "How will you know this is working?"
- "What's the most important outcome?"

## Output

Document answers in `planning/requirements.md`
