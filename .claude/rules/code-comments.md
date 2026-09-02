# Code Comment Rules

These rules apply to ALL code written or modified, regardless of which skill or agent is active.

## Budget

- A file-level or function-level docblock explains **why**, in **at most 15 lines**, and links the spec (`.catalyst/specs/{slug}`) for the rest.
- Inline comments only where the code cannot say it: a non-obvious invariant, a workaround with its cause, a security/tenant boundary.
- **No decision records in code.** Rationale, alternatives considered, and audit trails live in the spec's `handoff.md` — never in a module header.
- **No narrative in tests.** A test's name states the behaviour; a one-line comment may state the invariant it guards. Nothing else.
- Target: comments under **20% of a production diff** and under **10% of a test diff**. If a file exceeds that, move the prose to `handoff.md` and leave a link.

## Why

Comments are read by every future agent on every future spec that touches the file. A 350-line header on a 90-line module is a tax paid forever, in tokens and attention. The archive exists so the code does not have to carry it.
