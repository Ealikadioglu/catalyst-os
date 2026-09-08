# LangSmith Integration

> Optional, import-guarded observability for LLM calls: `@traceable` per call, RunTree
> spans, token/cost metadata, and a prompt hub that mirrors your local prompt loader.
> Pseudo-code only.

## When to use

- You call LLMs (see [[ai-llm-integration]]) and want traces of prompts, outputs, latency, tokens, and cost.
- You want tracing to be **optional** — enabled by env, a silent no-op when the SDK/keys are absent.
- You want to name runs by `workflow.node` so traces map onto your [[dag-workflows]].
- Optionally: manage prompts centrally in the LangSmith Hub while keeping a local fallback.

## Architecture & why

```
env flag ──► guarded import ──► singleton service
   │            (no SDK / no key ⇒ traceable = None ⇒ everything no-ops)
   ▼
per LLM call: @traceable(run_type="llm", name="workflow.node")
   │  wraps agent.run(); attaches usage_metadata (tokens) + metadata (model, provider)
   ▼
LangSmith UI: run tree grouped by workflow, token/cost rendered, feedback for evals
```

**Key decision — tracing must never break the app.** Import the SDK inside a `try/except`; if it fails, bind the symbols to `None` and make the decorators pass-through. A missing key disables tracing silently rather than crashing a worker.

**Key decision — decorator per call, not global callbacks.** No LangChain callback handler, no LangGraph. Each LLM call is wrapped with `@traceable` at the point of the call, so the trace name and metadata are local and precise. (LangChain core is used *only* for prompt templating, if at all.)

**Key decision — use the modern `LANGSMITH_*` env names**, not the legacy `LANGCHAIN_TRACING_V2` / `LANGCHAIN_API_KEY`.

## Pattern (pseudo-code)

### 1. Guarded import + enable flag

```python
# services/tracing.py
try:
    from langsmith import Client, traceable
    from langsmith.run_trees import RunTree
except ImportError:
    Client = traceable = RunTree = None      # tracing becomes a no-op

TRACING_ENABLED = (
    os.getenv("LANGSMITH_TRACING", "").lower() == "true"
    or bool(os.getenv("LANGSMITH_API_KEY"))
)
PROJECT = os.getenv("LANGSMITH_PROJECT", "my-project")
```

### 2. A no-op-safe traceable

```python
def ls_traceable(**deco_kwargs):
    if not (TRACING_ENABLED and traceable):
        return lambda fn: fn          # pass-through when disabled
    return traceable(**deco_kwargs)
```

### 3. Wrap the LLM call (the primary usage)

Inside `run_with_logging` (see [[ai-llm-integration]] §3):

```python
async def run_with_logging(self, ctx, user_prompt, **kw):
    workflow = self._workflow_name()          # from module path, e.g. "MyWorkflow"
    node = self.node_name
    model = normalize_model_name(self.config.model_name)   # strip "provider/" prefix

    @ls_traceable(run_type="llm", name=f"{workflow}.{node}")
    async def _traced():
        result = await self.agent.run(user_prompt=user_prompt, **kw)
        usage = extract_usage(result)
        # attach token counts to the current run so the UI renders them
        run = get_current_run_tree()
        if run:
            run.update(
                extra={"usage_metadata": {
                    "input_tokens": usage.request, "output_tokens": usage.response,
                    "total_tokens": usage.total}},
                metadata={"ls_model_name": model, "ls_provider": self.config.provider.value})
        return result

    return (await _traced(langsmith_extra={
        "metadata": {"ls_model_name": model, "ls_provider": self.config.provider.value}})).output
```

### 4. A reusable trace/span service surface (optional)

For non-LLM operations (retrieval, scoring) that you still want on the trace:

```python
class Tracing:
    @contextmanager
    def span(self, name, run_type="chain", tags=(), metadata=None):
        if not (TRACING_ENABLED and RunTree):
            yield; return
        run = RunTree(name=name, run_type=run_type, project_name=PROJECT,
                      tags=[*tags, "my-project"], extra={"metadata": metadata or {}})
        run.post()
        try:
            yield run
        finally:
            run.end(); run.patch()

    def trace(self, name, run_type="chain", **md):   # decorator form (sync + async)
        ...

    def submit_feedback(self, run_id, key, score, comment=None):
        self.client.create_feedback(run_id, key=key, score=score, comment=comment)  # eval loops
```

### 5. Prompt hub (optional) — same interface as local loader

```python
class HubPromptManager:
    def get_prompt(self, name, **vars) -> str:
        template = Client(api_key=os.getenv("LANGSMITH_API_KEY")).pull_prompt(name)
        return render_system_message(template, **vars)

# mirrors the local Jinja loader's get_prompt(name, **vars) → they're swappable
PROMPTS = HubPromptManager() if USE_HUB else LocalPromptManager()
```

## Conventions

- **Run name:** `f"{workflow_name}.{node_name}"` — one glance maps a trace to your DAG.
- **run_type:** `"llm"` for model calls, `"chain"`/`"retriever"` for surrounding steps.
- **Model name normalization:** strip the `provider/` prefix (`"x-ai/grok-4"` → `"grok-4"`) so LangSmith cost/match rules recognize the model.
- **usage_metadata:** always attach `{input_tokens, output_tokens, total_tokens}` so the UI renders tokens/cost.
- **Tags:** auto-append a project tag to every run for filtering.
- **Workflow name derivation:** parse the node's module path (`app.workflows.<x>_workflow_nodes...` → `XWorkflow`).

## Variations

- **`@traceable` decorators applied statically** on functions vs **inline per call** (shown). Inline gives you a per-call dynamic name (`workflow.node`); static is simpler for fixed functions.
- **Manual `RunTree`** when you need explicit start/end control or nested spans outside a single function.
- **Other backends** (OpenLLMetry, Langfuse, plain OTel) fit the same guarded-import + wrap-the-call shape; only the SDK calls change.

## Trade-offs

- **Decorator-per-call** is precise but you must remember to wrap each call site; a global callback handler is automatic but coarser and couples you to LangChain.
- **Prompt hub** centralizes prompt edits (no redeploy) but adds a network dependency and a moving part — keep the local loader as fallback.
- **Attaching full prompts/outputs** to traces is invaluable for debugging but may capture sensitive data — truncate/redact where needed and consider `privacy_mode` upstream.

## Env vars

| Var | Purpose |
|---|---|
| `LANGSMITH_TRACING` | `"true"` to enable (or presence of the key enables it) |
| `LANGSMITH_API_KEY` | auth; absence = tracing off |
| `LANGSMITH_PROJECT` | project/run grouping name |

> Use the `LANGSMITH_*` names. The legacy `LANGCHAIN_TRACING_V2` / `LANGCHAIN_API_KEY` are the old SDK's names — don't mix.

## Gotchas

1. **Guard the import** — no `try/except` means a worker without the SDK crashes on import.
2. **Absent key must no-op, not error** — gate every trace call on `TRACING_ENABLED`.
3. **Normalize the model name** or LangSmith won't match cost rules for `provider/model` strings.
4. **Attach `usage_metadata`** or the UI shows a trace with no tokens/cost.
5. **Query truncation** — cap long prompt fields in metadata (e.g. `query[:200]`) to keep traces readable and cheaper.

## Checklist

- [ ] Guarded import; `traceable/Client/RunTree` fall back to `None`.
- [ ] `TRACING_ENABLED` flag gates everything; disabled = clean no-op.
- [ ] LLM calls wrapped with `@ls_traceable(run_type="llm", name="workflow.node")`.
- [ ] `usage_metadata` + `{ls_model_name, ls_provider}` attached to each run.
- [ ] Model-name normalization applied.
- [ ] (Optional) Prompt hub mirrors the local `get_prompt(name, **vars)` interface.
- [ ] Env uses `LANGSMITH_*` names.
