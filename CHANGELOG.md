# Changelog

## 3.15.0

- New `/forge-wave <id>` runs one roadmap wave unattended. It builds the specs one after another, so each spec is catalyzed against the code the previous one merged. For each spec the session writes a brief, opens a fresh herdr tab with a pi agent, has pi run `/catalyze-spec --from` and `/forge-spec-worktree`, gates the spec and the PR, and merges into `autopilot.branch`. It refuses to start without herdr, pi, `gh`, a non-protected `autopilot.branch`, `autopilot.auto_merge: true`, or a clean checkout on that branch. State and the morning report live in `.catalyst/waves/wave-<id>.md`. The process is the new `wave-orchestration` skill.
- `roadmap.md` has an optional `## 🌊 Waves` section that `/plan-project` writes: a numbered wave with a one- or two-sentence goal and its specs in build order. `board.js` marks each spec's state there and on the dashboard. `board.js --wave <id>` prints one wave: the specs in order, their state, the next command, and what each waits on.
- `/roadmap-json` and `roadmap.json` are gone; waves in `roadmap.md` replace them. The installer now deletes files that earlier versions installed and later ones dropped, starting with the `roadmap-json` command and `roadmap.json`.
- `/catalyze-spec --from` keeps the slug the plan names, so the board and `/forge-wave` find the spec.

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
