# Changelog

## Unreleased

- Agents no longer pin a model. The `model:` field is gone from every agent's frontmatter, and the workflow docs no longer name a model per agent. Subagents now run on the parent session's model instead of Sonnet, and Catalyst works on hosts that don't recognise `opus` / `sonnet` (such as pi with Gemini).
