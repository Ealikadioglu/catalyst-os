# DAG Workflow System

> A declarative, schema-driven workflow engine: workflows are DAGs of nodes with explicit
> edges, validated acyclic, executed by threading one mutable context through the graph.
> Pseudo-code only — generalize freely.

## When to use

- Multi-step processing where steps have a clear dependency order (extract → transform → score → persist).
- You want each step (node) isolated, testable, and reusable across workflows.
- Some steps are LLM calls, some are deterministic, some fan out concurrently.
- You want a picture of the pipeline (visualization) and a one-command local run.

If your flow is a single linear function with no branching and no reuse, this is overkill — just write the function.

## Architecture & why

```
Event (minimal id payload, JSON)
   │  parsed into a Pydantic event_schema
   ▼
[start node] ──► [node] ──► [router] ──► [node A]      one mutable TaskContext
                              └────────► [node B]      threaded through every node
                                            │
                                       [concurrent: X ‖ Y ‖ Z]
                                            ▼
                                        [terminal node]
```

Core ideas:

1. **Declarative graph, not imperative wiring.** A workflow is a class with ONE class variable — a `WorkflowSchema` listing the start node and, per node, its outgoing edges. Edges are node-class references. No decorators, no manual `if next == ...`.
2. **DAG validated at construction.** On instantiation the engine checks: no cycles (DFS), all nodes reachable from `start` (BFS), and any node with >1 outgoing edge **must** be a router. This catches wiring bugs before the first run.
3. **One context threaded through.** A single `TaskContext` carries the parsed event plus a `nodes` dict where each node writes its output under its own class name. Downstream nodes read upstream outputs by key.
4. **Chain-of-Responsibility execution.** The engine walks from `start`, calling `node.process(ctx)`, then picks the next node: `connections[0]` for linear nodes, `router.route(ctx)` for routers, `asyncio.gather` for concurrent fan-out. Terminates when a node has no connections.

Why this shape: nodes stay tiny and pure (in → context → out), the graph is inspectable/visualizable, and adding a step is "write a node + add one edge."

## Pattern (pseudo-code)

### 1. The schema types

```python
class NodeConfig(BaseModel):
    node: type[Node]
    connections: list[type[Node]] = []      # outgoing edges (node classes)
    is_router: bool = False                  # required if len(connections) > 1
    concurrent_nodes: list[type[Node]] = []  # for fan-out

class WorkflowSchema(BaseModel):
    event_schema: type[BaseModel]            # validates the incoming event dict
    start: type[Node]
    nodes: list[NodeConfig]
```

### 2. A node — the unit of work

```python
class Node(ABC):
    @property
    def node_name(self) -> str:
        return type(self).__name__           # state key

    @abstractmethod
    async def process(self, ctx: TaskContext) -> TaskContext: ...
```

```python
class TaskContext(BaseModel):
    event: Any                    # the parsed event_schema instance
    nodes: dict[str, Any] = {}    # per-node outputs, keyed by node_name
    should_stop: bool = False

    def update_node(self, node_name, **kw):   # merge-write this node's output
        self.nodes[node_name] = {**self.nodes.get(node_name, {}), **kw}
    def stop_workflow(self):
        self.should_stop = True
```

A concrete node reads `ctx.event` + upstream outputs, writes its own:

```python
class GapAnalysisNode(Node):
    async def process(self, ctx):
        run = ctx.nodes["LoadRunDataNode"]["run_row"]   # read upstream
        gaps = compute_gaps(run)                          # deterministic work
        ctx.update_node(self.node_name, gaps=gaps)        # write output
        return ctx
```

### 3. A workflow — declare the graph

```python
class MyWorkflow(Workflow):
    workflow_schema = WorkflowSchema(
        event_schema=MyEventSchema,
        start=LoadDataNode,
        nodes=[
            NodeConfig(node=LoadDataNode,     connections=[GapAnalysisNode]),
            NodeConfig(node=GapAnalysisNode,  connections=[LlmPolishNode]),
            NodeConfig(node=LlmPolishNode,    connections=[PersistNode]),
            NodeConfig(node=PersistNode,      connections=[]),   # terminal
        ],
    )

    async def on_error(self, ctx, error):    # overridable hook
        mark_run_failed(ctx.event.run_id, error)
```

### 4. Node taxonomy

- **Plain `Node`** — deterministic step (shown above).
- **`AgentNode`** — an LLM step. Declares `get_agent_config()` (provider, model, structured `output_type`, system prompt, settings, retries) and calls one entry point `await self.run_with_logging(ctx, user_prompt=...)`. See [[ai-llm-integration]].
- **`Router`** — `process` is a no-op; implements `route(ctx) -> Node` returning the *next node instance*. Required when a node has >1 connection.
  ```python
  class KindRouter(Router):
      def route(self, ctx):
          return {"a": NodeA, "b": NodeB}[ctx.event.kind]()
  ```
- **`ConcurrentNode`** — fans out `concurrent_nodes` via `asyncio.gather(*[n.process(ctx) for n in ...])` on one thread.

### 5. The engine (the walk)

```python
class Workflow(ABC):
    workflow_schema: ClassVar[WorkflowSchema]

    def __init__(self):
        validate_acyclic(self.workflow_schema)      # DFS: no cycles
        validate_reachable(self.workflow_schema)    # BFS from start
        validate_routers(self.workflow_schema)      # >1 edge ⇒ is_router
        self.configs = index_by_node_class(...)

    def run(self, event: dict) -> TaskContext:      # for Celery/scripts (new loop)
        return asyncio.run(self._run(event))

    async def run_async(self, event: dict):         # for existing loops (FastAPI/Jupyter)
        return await self._run(event)

    async def _run(self, event: dict) -> TaskContext:
        ctx = TaskContext(event=self.workflow_schema.event_schema(**event))  # parse!
        current = self.workflow_schema.start
        try:
            while current and not ctx.should_stop:
                node = self._get_or_create(current)   # instances cached & reused
                if not is_router(node):
                    await node.process(ctx)
                current = self._next(current, ctx)     # connections[0] | router.route | None
        except Exception as e:
            await self.on_error(ctx, e); raise
        return ctx
```

### 6. Registry — name → class

```python
class WorkflowRegistry(Enum):
    MY_WORKFLOW   = MyWorkflow
    OTHER_FLOW    = OtherWorkflow

# dispatch by name
workflow = WorkflowRegistry[event_row.workflow_type].value()
workflow.run(event_row.payload)
```

### 7. Event contract

`events/{workflow_name}_event.json` — a flat object of the *minimal identifiers*; nodes hydrate the rest from the DB. Use **real** ids so the local run actually works.

```json
{ "run_id": 26 }
```

### 8. Triggering (production)

Two ways, both ending in `workflow.run(event)` — detailed in [[celery-polling-architecture]]:

- **DB-event dispatch:** an `Event` row is inserted; a Celery task loads it, looks up the workflow in the registry, runs it, writes the pruned `TaskContext` back.
- **Beat pollers:** a scheduled task scans a table for `status='pending'`, **atomically claims** each row, and runs the workflow in-process.

> Actor-less runs (pollers) have no JWT. Any `NOT NULL created_by` column must be stamped with a `"system"` sentinel. See [[supabase-migrations-rls]].

### 9. Visualization + playground

```python
# visualize: build a graphviz Digraph from workflow_schema.nodes
#   node per config (diamond if is_router), Event ellipse → start, edge per (node → connection)
generate(MyWorkflow())

# playground: one cell, runs against the LOCAL DB (the real E2E check)
event = load_event("my_workflow_event")
result = MyWorkflow().run(event)
```

## Variations

- **String edges vs class edges.** Class references (shown) give you import-time safety and easy refactors. String names decouple modules but lose type checking.
- **Router rules vs router code.** Either a `route()` method (imperative) or a declarative rules list mapping predicates → node. Code is more flexible; rules are more inspectable.
- **Concurrency granularity.** `asyncio.gather` on one thread is right for IO-bound (LLM/DB) fan-out. CPU-bound work needs a process pool, not this.

## Trade-offs

- **Declarative graph** costs a little ceremony (schema + registry) but pays back in validation, visualization, and uniform execution.
- **Single mutable context** is convenient but is shared state — nodes must namespace their writes under `node_name` and treat upstream reads as read-only.
- **Instances cached across runs** — nodes must be stateless between runs (all per-run state lives in `TaskContext`, not on `self`).

## Gotchas

1. **>1 connection without `is_router=True` fails validation** — that's the intended guardrail; add a router.
2. **The event dict is parsed into `event_schema` inside `run`** — pass a plain dict, not a pre-built model.
3. **Nodes are reused across runs** — never store run state on the node instance.
4. **`run` vs `run_async`** — `run` starts a new event loop (Celery/CLI); inside an existing loop (FastAPI/Jupyter) you MUST use `run_async` or `asyncio.run` will throw.
5. **Pollers must stamp `created_by="system"`** or Postgres NOT-NULL (23502) strands the row mid-flight.

## Checklist — Definition of Done for a NEW workflow

A workflow is **not done** when the code compiles. Ship all four artifacts (this is repeatedly forgotten):

- [ ] **1. Register** the class in the `WorkflowRegistry` enum.
- [ ] **2. Event JSON** at `events/{workflow_name}_event.json` with real, runnable ids.
- [ ] **3. Playground cell** — `load_event(...)` + `workflow.run(event)`.
- [ ] **4. Visualize cell** — `generate(MyWorkflow())`.
- [ ] Poller-triggered? Stamp `created_by="system"` on any NOT-NULL actor column.
- [ ] Ran end-to-end against the local DB and inspected the resulting `TaskContext`.
