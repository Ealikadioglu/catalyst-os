# Changelog

## 3.13.1

- Every command now carries a `$ARGUMENTS` placeholder. Pi and Codex drop arguments that a prompt template never references, so `/catalyze-spec "..."` and ten other commands lost their input there. `npm run validate` now fails on a command without the placeholder.

## 3.13.0

- Agents no longer pin a model. The `model:` field is gone from every agent's frontmatter, and the workflow docs no longer name a model per agent. Subagents now run on the parent session's model instead of Sonnet, and Catalyst works on hosts that don't recognise `opus` / `sonnet` (such as pi with Gemini).
