# Changelog

## 3.14.1

- The installer writes the installed version to `.catalyst/bin/VERSION` and rewrites it on every install. `cat .catalyst/bin/VERSION` shows which Catalyst version a project runs.

## 3.14.0

- Requirements in `spec.md` now carry GIVEN/WHEN/THEN scenarios. Each requirement has at least one `AC-n` scenario, numbered across the spec and never reused. The separate Acceptance Criteria list is gone. Requirements describe observable behaviour only; class, file and library names go in Technical Approach. A refactor writes `No behaviour change.` with one guard AC.
- Tests carry the AC ID in their name, and Forger rows name the ACs they cover.
- `/audit-spec` now checks the code against the spec. Enforcer fails the audit when an AC has no test. Inquisitor fails it when the code contradicts a scenario, and flags approach decisions missing from the code. When spec and code disagree and the code is right, Scribe updates the spec before seal.
- `/update-spec` asks three questions to decide between updating the spec and starting a new one. `/catalyze-spec` ends with a four-question plan review.

## 3.13.1

- Every command now carries a `$ARGUMENTS` placeholder. Pi and Codex drop arguments that a prompt template never references, so `/catalyze-spec "..."` and ten other commands lost their input there. `npm run validate` now fails on a command without the placeholder.

## 3.13.0

- Agents no longer pin a model. The `model:` field is gone from every agent's frontmatter, and the workflow docs no longer name a model per agent. Subagents now run on the parent session's model instead of Sonnet, and Catalyst works on hosts that don't recognise `opus` / `sonnet` (such as pi with Gemini).
