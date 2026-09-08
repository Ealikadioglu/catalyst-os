---
name: unslop
description: Cut the length that carries no information out of prose a human will read. Use before writing spec.md, research.md, handoff.md, validation.md, journal entries, commit messages, PR bodies, or a reply.
---

# Unslop

> **When to invoke:** Before writing any artifact a human will read: `spec.md`, `research.md`,
> `handoff.md`, `validation.md`, journal entries, commit messages, PR bodies, and your reply.
> **Used by:** Scribe and Arbiter always. Any agent composing prose.
> **Type:** Rigid.

## Purpose

Cut the length that carries no information. The reader is a tired engineer picking this up cold,
not an auditor of how you got here.

## The Iron Law

```
WRITE IT CLEAN AS YOU DRAFT IT
```

A cleanup pass afterward does not work. You will read your own sentence as fine because you wrote
it. Do not generate the bad sentence.

## The four that actually happen here

Measured across shipped specs. These are the ones that cost real tokens in this framework.

### 1. Delete the chronicle

A reversed decision is not history worth keeping. Write the decision that stands and delete the
path to it.

| Do not write | Write |
|--------------|-------|
| `## Corrections Carried From Research` | the corrected fact, in place |
| `## Why the phase shape changed` | the phase shape |
| `## RESOLVED — the 14 unowned reds → scope granted as T-36` | nothing; the tasks are done |
| "We tried X, then Y broke, so we moved to Z" | "Z, because Y." |

One exception: a reversal the next builder would otherwise repeat. That earns **one line** in
`handoff.md` under Gotchas, never a section. "Tried X. It deadlocks under concurrent claims."

### 2. Reference, do not restate

A requirement is defined once, in `spec.md`. Everything downstream names it.

```
WRONG  tasks.md: T-11 — Covers REQ-004. [40 lines re-explaining what REQ-004 wants]
RIGHT  tasks.md: T-11 — Covers REQ-004, AC-2.
```

If a task row needs the requirement's content to be understood, the requirement is underwritten.
Fix `spec.md`; do not paste it forward. The same rule holds for `handoff.md` restating
`validation.md`, and `research.md` restating the codebase.

### 3. Spend emphasis like it costs something

Bold, CAPS, and blockquote warnings mark the exceptional. When every paragraph has them they mark
nothing, and the reader skims past the one line that mattered.

- At most one bold span per paragraph. If two things are both critical, neither is.
- CAPS only for gates the framework already defines: `BLOCKING`, `RED`, `GREEN`, `MUST`.
- No blockquote that only repeats the sentence above it in a louder voice.

### 4. Do not argue with an imagined reader

```
WRONG  A future reviewer will see two exhaustion paths and reach for a tidy-up.
       That tidy-up is wrong, and it is wrong for the same reason the operator
       rejected overloading 'skipped' in the first place.
RIGHT  'skipped' means the call was never placed. 'exhausted' means it was placed
       and the retry budget ran out. Guarded by dialler-status.test.ts.
```

State the invariant once. If it must not be changed, guard it with a test, a lint, or a CI check.
Prose asking a future agent not to touch something is the weakest guard available, and
`.claude/rules/code-comments.md` already forbids parking that rationale in the code.

## Match the artifact

One file, one job. Mixing them is what makes them long.

| File | Job | Voice |
|------|-----|-------|
| `spec.md` | What must be true when this is done | Dry. No opinion, no history, no persuasion. |
| `research.md` | Findings with sources | Dry. A finding the spec did not use is cut, not archived. |
| `tasks.md` | The DAG and its progress | Terse. Rows and codes. No rationale. |
| `validation.md` | What was run, what it returned | Dry. Evidence, not narrative. |
| `journal/*.md` | Deviations and abandoned approaches | This is where the chronicle belongs. |
| `handoff.md` | What a teammate needs to pick this up | Colleague voice. Opinion allowed here and nowhere else. |
| Commit / PR | What changed and why | Imperative, subject under 72 chars. |

## Sentence rules

These govern the prose you write into artifacts, not the framework's own skill files.

- No em dash inside a sentence. End the sentence, or use a comma. The `T-11 — name` form in a
  heading or a table cell is a label separator, not punctuation, and stays.
- No colon as a mid-sentence connector. Before a list is fine.
- Sentence case headings. A heading names the section; it does not narrate an event.
- One thought per sentence. Split anything the reader must re-read to parse.
- Name the actor: "the resolver writes", not "is written".
- Say the mechanism, not the feeling. Not "the schema stays clean" but "a column rename fails the
  build".
- One name per thing, everywhere. Do not cycle synonyms for the same concept.
- Cut any sentence that would read the same in another project's docs.
- No "I hope this helps", no "Great question", no "Let me know if".

## Before you hand it over

Two checks, both on the text you just wrote.

1. **Cut test.** Delete each sentence in turn. If the reader loses nothing, it stays deleted.
2. **Cold-read test.** A teammate opens this file knowing nothing about the session. Does the file
   tell them what is true now? Anything that only makes sense as a record of your session is
   chronicle. Move it to `journal/` or delete it.
