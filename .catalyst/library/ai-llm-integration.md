# Connecting to AI / LLM Systems

> A provider-agnostic LLM layer built on a universal client abstraction (PydanticAI-style)
> with OpenRouter as primary transport, structured output, prompt caching, token accounting,
> and graceful degradation. Pseudo-code only.

## When to use

- You call LLMs from application/worker code and want to swap providers without rewriting callers.
- You need structured (schema-validated) output, not free text.
- You care about cost/token accounting, retries, and fallback across providers.
- You want prompt caching for large repeated prefixes (documents).

Pairs naturally with [[dag-workflows]] (each LLM step is an `AgentNode`) and [[langsmith-integration]] (tracing).

## Architecture & why

```
Node declares AgentConfig ──► universal Agent (PydanticAI) ──► provider model factory
  (provider, model,             │  one entry: run_with_logging     ┌─ OpenAI / Azure
   output_type, prompt,         │  (tracing, tokens, cache,        ├─ Anthropic
   settings, retries)           │   partial-JSON recovery)         ├─ Gemini
                                ▼                                   ├─ Bedrock
                          per-provider httpx.AsyncClient            ├─ Ollama (on-prem)
                                                                    └─ OpenRouter ─► any model
```

**Key decision — one abstraction, many providers.** Callers describe *what* they want (`AgentConfig`): a provider enum, a model name, a Pydantic `output_type`, a system prompt, and settings. A factory maps the provider enum to a concrete model object. Callers never touch provider SDKs directly.

**Key decision — OpenRouter as the default transport.** OpenRouter is OpenAI-compatible and reaches every model behind one API key, with provider fallback, routing preferences, and privacy controls. Direct-provider branches (Anthropic, Gemini, Bedrock, Ollama) remain for when you need them.

**Key decision — async only, no streaming (by default).** Batch/pipeline work wants a single awaited result with a validated schema, not a token stream. Add streaming only where a UI needs it.

## Pattern (pseudo-code)

### 1. The declarative config + provider enum

```python
class ModelProvider(Enum):
    OPENAI, AZURE_OPENAI, ANTHROPIC, GEMINI, OLLAMA, BEDROCK, OPENROUTER = auto()...

@dataclass
class AgentConfig:
    model_provider: ModelProvider
    model_name: str
    output_type: type          # a Pydantic model → structured output
    system_prompt: str
    model_settings: ModelSettings          # temperature, max_tokens, timeout, extra_body
    retries: int = 2
    tools: list = ()           # optional function-calling tools
    mcp_servers: list = ()      # optional MCP servers
```

### 2. The provider → model factory

```python
def build_model(cfg: AgentConfig, http_client):
    match cfg.model_provider:
        case ModelProvider.ANTHROPIC:
            return AnthropicModel(cfg.model_name, provider=AnthropicProvider(http_client=http_client))
        case ModelProvider.GEMINI:
            return GeminiModel(cfg.model_name, provider=GoogleProvider(...))
        case ModelProvider.OLLAMA:                       # on-prem escape hatch
            return OpenAIModel(cfg.model_name, provider=OpenAIProvider(base_url=OLLAMA_BASE_URL))
        case ModelProvider.BEDROCK:
            return BedrockConverseModel(cfg.model_name, ...)
        case ModelProvider.OPENROUTER:                   # default: any model via one key
            return OpenAIModel(cfg.model_name, provider=OpenAIProvider(
                base_url=OPENROUTER_BASE_URL,
                api_key=os.environ["OPENROUTER_API_KEY"],
                http_client=http_client,
                # OpenRouter analytics headers:
                default_headers={"HTTP-Referer": APP_URL, "X-Title": APP_NAME}))
```

### 3. The agent node — lazy init + one entry point

```python
class AgentNode(Node, ABC):
    @abstractmethod
    def get_agent_config(self) -> AgentConfig: ...
    @abstractmethod
    async def process(self, ctx) -> TaskContext: ...

    async def _init(self):
        cfg = self.get_agent_config()
        self.http = httpx.AsyncClient(timeout=HTTP_CLIENT_TIMEOUT)
        self.agent = Agent(model=build_model(cfg, self.http),
                           output_type=cfg.output_type,
                           system_prompt=cfg.system_prompt,
                           model_settings=cfg.model_settings,
                           retries=cfg.retries, tools=cfg.tools)

    async def run_with_logging(self, ctx, user_prompt, **kw):
        # wraps agent.run() with tracing + token/cost logging + cache + recovery (below)
        result = await self.agent.run(user_prompt=user_prompt, **kw)
        return result.output           # already schema-validated
```

Usage in a node:

```python
class ExtractSymptomsNode(AgentNode):
    def get_agent_config(self):
        return AgentConfig(
            model_provider=ModelProvider.OPENROUTER,
            model_name="google/gemini-2.5-flash",          # primary
            output_type=NativeOutput(SymptomList),          # structured
            system_prompt=PROMPTS.get("extract_symptoms"),
            model_settings=ModelSettings(
                temperature=0.0, max_tokens=65536, timeout=180,
                extra_body={"provider": {"allow_fallbacks": True}}),  # ← REAL fallback toggle
            retries=2)

    async def process(self, ctx):
        out = await self.run_with_logging(ctx, user_prompt=ctx.event.text)
        ctx.update_node(self.node_name, symptoms=out.symptoms)
        return ctx
```

### 4. Provider routing & fallback

Two layers, don't confuse them:

- **Runtime fallback (the one that fires):** `model_settings.extra_body={"provider": {"allow_fallbacks": True}}` per call. OpenRouter falls back to another provider on failure.
- **Config-level preferences:** a config object mapping to OpenRouter request params:
  ```python
  @dataclass
  class RouterConfig:
      custom_base_url: str | None = None
      privacy_mode: bool = False              # → {"data_collection": "deny"}
      fallback_models: list[str] = ()          # e.g. ["anthropic/claude-...", "openai/gpt-..."]
      provider_order: list[str] = ()
      max_cost_per_request: float | None = None
      def to_request_params(self):
          return {"provider": {"order": self.provider_order,
                               "allow": self.allowed, "deny": self.blocked},
                  ("data_collection" if self.privacy_mode else None): "deny", ...}
  ```
- **Per-workflow model strategy:** cheap model for validation, quality model for extraction, with a cost ceiling per job.

> Common shape: a fast/cheap model (e.g. a Flash-tier) is **primary**; commercial flagships (Claude/GPT) are the **fallback**, not the default. Cloud vs on-prem is just picking `OPENROUTER` vs `OLLAMA` in `get_agent_config`.

### 5. Structured output

```python
class SymptomList(BaseModel):
    symptoms: list[str]

output_type = NativeOutput(SymptomList)   # provider-native JSON/structured mode
# also valid: output_type = list[str] / str for simple cases
```

The framework validates against the schema and retries on mismatch (`output_retries`).

### 6. Prompt caching — cacheable prefix swap

For a large document reused across many calls, make it a **stable prefix** so the provider caches it:

```python
# a custom httpx transport injects cache_control on the system message + the
# document block, so repeated calls with the same prefix hit the cache
class CacheControlTransport(httpx.AsyncBaseTransport):
    async def handle_async_request(self, request):
        if request.url.path.endswith("/chat/completions"):
            body = json.loads(request.content)
            mark_ephemeral(body["messages"][0])            # system message
            for m in body["messages"]:
                if DOC_MARKER in m["content"]:              # the big shared document
                    mark_ephemeral(m)
            request = rebuild(request, body)
        return await super().handle_async_request(request)
```

### 7. Retries, token accounting, graceful degradation

```python
async def run_with_logging(self, ctx, user_prompt, **kw):
    est_in = estimate_tokens(user_prompt)         # pre-call estimate (tiktoken)
    try:
        result = await self.agent.run(user_prompt=user_prompt, **kw)
        usage = extract_usage(result)             # request/response/total, dual field-names
        log_cost(usage, self.config)              # OpenRouter: fetch real cost async by gen id
        return result.output
    except TruncatedOutput as e:
        # partial-JSON recovery: salvage a valid prefix instead of failing the whole job
        return recover_partial_json(e.raw_body)
    except Exception as e:
        log_failed_request(e, est_in); raise
```

- **Retries:** framework-level (`retries`) + provider fallback (`extra_body`) + manual backoff loops for bulk import/embedding (2/4/8s).
- **Token guards:** read provider-reported usage first; fall back to tiktoken (`cl100k_base` for unknown models), run tiktoken in a thread to avoid blocking the loop.
- **Note:** some tokenizers (e.g. Gemini on non-English/medical text) count ~2.5× what tiktoken estimates — don't trust tiktoken as a hard ceiling for those.

### 8. Embeddings / vector search

```python
# worker-safe: NO fastapi/api imports so Celery workers can use it
EMBEDDING_MODEL = "openai/text-embedding-3-small"   # 1536-d
def embed(text) -> list[float]:
    try:
        return openai_client.embeddings.create(input=[text], model=EMBEDDING_MODEL).data[0].embedding
    except Exception:
        return [0.0] * 1536      # degrade to zero vector, never crash the pipeline
# similarity search via a Postgres RPC (pgvector) — see supabase-migrations-rls
```

## Variations

- **Direct provider SDKs** instead of OpenRouter when you need a provider-specific feature (Bedrock IAM, Anthropic beta headers). Keep them behind the same factory.
- **Streaming** for chat UIs: swap `agent.run()` for `agent.run_stream()` in a dedicated node; don't stream in batch pipelines.
- **Local Jinja prompts vs a prompt hub** — keep the same `get_prompt(name, **vars)` interface so the two are swappable. See [[langsmith-integration]].

## Trade-offs

- **OpenRouter** = one key, easy fallback, but an extra hop and its own uptime. Direct providers = fewer hops, more SDK sprawl.
- **Structured output** costs a schema and occasional retries but eliminates brittle parsing.
- **Prompt caching** saves cost on repeated prefixes but only helps when the prefix is genuinely stable and large.
- **Graceful degradation** (partial JSON, zero vectors) keeps pipelines alive but can mask real failures — log loudly when you degrade.

## Env vars

| Var | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | primary transport (required) |
| `OPENROUTER_BASE_URL` | default `https://openrouter.ai/api/v1` |
| `OPENROUTER_APP_URL` / `OPENROUTER_APP_NAME` | HTTP-Referer / X-Title analytics headers |
| `OPENROUTER_*` | routing/fallback/privacy/cost tuning |
| `OLLAMA_BASE_URL` | on-prem provider |
| `BEDROCK_AWS_ACCESS_KEY_ID` / `_SECRET` / `_REGION` | Bedrock |
| `HTTP_CLIENT_TIMEOUT` / `_CONNECT_TIMEOUT` | httpx timeouts (default 300 / 30s) |

## Gotchas

1. **`extra_body` drives real fallback, not the config dataclass** — a populated `RouterConfig` that nothing passes to the call does nothing.
2. **tiktoken under-counts non-English/medical text (~2.5×)** — don't use it as a hard token ceiling for Gemini-class models.
3. **Embedding/search services must not import the web/api layer** — Celery workers import them and the api package isn't present in the prod worker image.
4. **Per-provider `httpx.AsyncClient`** — build one per node/provider; don't share a global client across providers with different auth.
5. **Blank proxy env vars for Python services under OrbStack** or httpx crashes on every outbound call. See [[docker-compose-orchestration]].

## Checklist

- [ ] `AgentConfig` + provider enum + factory in place; callers never touch provider SDKs.
- [ ] Structured `output_type` (Pydantic) on every extraction/classification node.
- [ ] `extra_body` fallback set where reliability matters.
- [ ] Token/cost logging via one `run_with_logging` entry; tiktoken fallback for missing usage.
- [ ] Partial-JSON recovery for long generations.
- [ ] Embeddings service is worker-safe (no api imports), degrades to zero vector.
- [ ] Tracing wired → [[langsmith-integration]].
