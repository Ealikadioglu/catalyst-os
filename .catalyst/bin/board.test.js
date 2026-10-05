#!/usr/bin/env node
/**
 * Tests for board.js — the deterministic spec-lifecycle board generator.
 * Run: node .catalyst/bin/board.test.js   (or: npm test)
 * Zero dependencies: node:assert + a tiny runner.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const board = require('./board.js');

const TEMPLATE = fs.readFileSync(
  path.join(__dirname, '..', 'main', 'temp', 'temp-dashboard.html'),
  'utf8'
);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}\n    ${err.message}`);
  }
}

/** Build a throwaway project on disk and return its root. */
function fixture(opts = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'catalyst-board-'));
  const main = path.join(root, '.catalyst', 'main');
  fs.mkdirSync(path.join(main, 'temp'), { recursive: true });
  fs.mkdirSync(path.join(root, '.catalyst', 'specs', 'completed'), { recursive: true });
  fs.writeFileSync(path.join(main, 'temp', 'temp-dashboard.html'), TEMPLATE);
  if (opts.mission !== false) {
    fs.writeFileSync(
      path.join(main, 'mission.md'),
      '# Mission: Example App\n\n> Make the example effortless.\n\n## The Pain\n\n- Users repeat manual steps\n'
    );
  }
  if (opts.roadmap) fs.writeFileSync(path.join(main, 'roadmap.md'), opts.roadmap);
  return root;
}

function spec(root, slug, files, completed = false) {
  const dir = path.join(root, '.catalyst', 'specs', completed ? 'completed' : '', slug);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

const SPEC_MD = (title, extra = '') =>
  `---\nspec: x\nstatus: draft\ndomain: example\n${extra}---\n\n# ${title}\n\n## Overview\n\nRetry failed jobs according to the configured policy.\n\n## Requirements\n\n- R1\n`;

const ROADMAP_WITH_BACKLOG = `# Project Roadmap

> The roadmap is a queue of specs.

---

## ▶ Next Up

**stale** — stale pointer that must be regenerated

\`\`\`
!/forge-spec @stale
\`\`\`

---

## 🗂️ Backlog

### 1. Two-Factor Auth
**Catalyze as:** \`two-factor-auth\`
**Scope:** TOTP-based 2FA on login.
**Done when:** User enrolls and verifies TOTP.
**Depends on:** nothing
**Priority:** 🟠 High

**Seed prompt:**
\`\`\`
TOTP two-factor authentication on login
\`\`\`

\`\`\`
!/catalyze-spec "TOTP two-factor authentication on login"
\`\`\`

---

### 2. Audit Log
**Catalyze as:** \`audit-log\`
**Scope:** Record security-sensitive actions.
**Done when:** Logins and role changes are logged.
**Depends on:** #1
**Priority:** 🟡 Medium

\`\`\`
!/catalyze-spec "security audit log"
\`\`\`

---

## 📋 Planned

### Old Planned Entry
**Slug:** \`2026-01-01-old\`

---

## ✅ Done

| Spec | Slug | Sealed |
|------|------|--------|
| Old | \`2026-01-01-old\` | 2026-01-02 |

---

## Vision / Someday

| Goal | Description | Prerequisite Specs |
|------|-------------|--------------------|
| SSO | Enterprise single sign-on | two-factor-auth |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-01 | Initial roadmap created | \`/catalyze-project\` |
`;

console.log('\nboard.js\n');

// ---------------------------------------------------------------------------
console.log('State detection');

test('spec.md only → planned', () => {
  const root = fixture();
  spec(root, '2026-09-01-retry', { 'spec.md': SPEC_MD('Retry Truth') });
  const s = board.scanSpecs(root);
  assert.strictEqual(s.planned.length, 1);
  assert.strictEqual(s.planned[0].slug, '2026-09-01-retry');
  assert.strictEqual(s.planned[0].name, 'Retry Truth');
  assert.strictEqual(s.planned[0].command, '!/forge-spec @2026-09-01-retry');
  assert.match(s.planned[0].scope, /^Retry failed jobs/);
});

test('--from spec with absolute plan: path in frontmatter → still planned', () => {
  const root = fixture();
  spec(root, '2026-09-01-retry', {
    'spec.md': SPEC_MD('Retry Truth', 'plan: /Users/me/vault/plans/retry: v2.md\n'),
  });
  const s = board.scanSpecs(root);
  assert.strictEqual(s.planned.length, 1);
  assert.strictEqual(s.planned[0].name, 'Retry Truth');
});

test('tasks.md present → in progress', () => {
  const root = fixture();
  spec(root, '2026-09-01-retry', { 'spec.md': SPEC_MD('Retry Truth'), 'tasks.md': '# Tasks' });
  const s = board.scanSpecs(root);
  assert.strictEqual(s.inProgress.length, 1);
  assert.strictEqual(s.inProgress[0].command, '!/audit-spec @2026-09-01-retry');
});

test('validation.md with PASS → audited; FAIL stays in progress', () => {
  const root = fixture();
  spec(root, '2026-09-01-pass', {
    'spec.md': SPEC_MD('Pass'),
    'tasks.md': '# Tasks',
    'validation.md': '# Validation\n\n## Overall Status: PASS\n',
  });
  spec(root, '2026-09-02-fail', {
    'spec.md': SPEC_MD('Fail'),
    'tasks.md': '# Tasks',
    'validation.md': '# Validation\n\n## Overall Status: FAIL\n',
  });
  const s = board.scanSpecs(root);
  assert.deepStrictEqual(s.audited.map((x) => x.slug), ['2026-09-01-pass']);
  assert.deepStrictEqual(s.inProgress.map((x) => x.slug), ['2026-09-02-fail']);
  assert.strictEqual(s.audited[0].command, '!/seal-spec @2026-09-01-pass');
});

test('completed/ folder → done, with sealed date from frontmatter', () => {
  const root = fixture();
  spec(root, '2026-08-01-setup', { 'spec.md': SPEC_MD('Setup', 'sealed: 2026-08-05\n') }, true);
  const s = board.scanSpecs(root);
  assert.strictEqual(s.done.length, 1);
  assert.strictEqual(s.done[0].name, 'Setup');
  assert.strictEqual(s.done[0].date, '2026-08-05');
});

test('rejected specs and non-spec entries are ignored', () => {
  const root = fixture();
  spec(root, '2026-09-01-nope', { 'spec.md': SPEC_MD('Nope', 'status: rejected\n').replace('status: draft\n', '') });
  fs.writeFileSync(path.join(root, '.catalyst', 'specs', 'spec-structure.yaml'), 'version: 3');
  const s = board.scanSpecs(root);
  assert.strictEqual(s.planned.length + s.inProgress.length + s.audited.length, 0);
});

// ---------------------------------------------------------------------------
console.log('\nNext Up resolution');

test('audited beats in-progress beats planned beats backlog', () => {
  const pick = (r) => board.resolveNextUp(r).command;
  assert.match(pick({ audited: [{ slug: 'a', name: 'A', command: '!/seal-spec @a' }], inProgress: [{ slug: 'b' }], planned: [], backlog: [] }), /seal-spec @a/);
  assert.match(pick({ audited: [], inProgress: [{ slug: 'b', name: 'B', command: '!/audit-spec @b' }], planned: [{ slug: 'c' }], backlog: [] }), /audit-spec @b/);
  assert.match(pick({ audited: [], inProgress: [], planned: [{ slug: 'c', name: 'C', command: '!/forge-spec @c' }], backlog: [{ rank: 1 }] }), /forge-spec @c/);
  assert.match(pick({ audited: [], inProgress: [], planned: [], backlog: [{ rank: 1, name: 'D', command: '!/catalyze-spec "d"' }] }), /catalyze-spec "d"/);
});

test('empty board → null next up', () => {
  assert.strictEqual(board.resolveNextUp({ audited: [], inProgress: [], planned: [], backlog: [] }), null);
});

// ---------------------------------------------------------------------------
console.log('\nroadmap.md parsing and regeneration');

test('backlog entries are parsed with all fields', () => {
  const parsed = board.parseRoadmap(ROADMAP_WITH_BACKLOG);
  assert.strictEqual(parsed.backlog.length, 2);
  const b = parsed.backlog[0];
  assert.strictEqual(b.id, 1);
  assert.strictEqual(b.name, 'Two-Factor Auth');
  assert.strictEqual(b.slug, 'two-factor-auth');
  assert.strictEqual(b.scope, 'TOTP-based 2FA on login.');
  assert.strictEqual(b.doneWhen, 'User enrolls and verifies TOTP.');
  assert.strictEqual(b.dependsOn, 'nothing');
  assert.strictEqual(b.priority, 'high');
  assert.strictEqual(b.command, '!/catalyze-spec "TOTP two-factor authentication on login"');
  assert.strictEqual(parsed.vision.length, 1);
  assert.strictEqual(parsed.vision[0].goal, 'SSO');
});

test('sync rewrites managed sections and preserves backlog, vision, changelog verbatim', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  spec(root, '2026-09-01-retry', { 'spec.md': SPEC_MD('Retry Truth'), 'tasks.md': '# Tasks' });
  spec(root, '2026-08-01-setup', { 'spec.md': SPEC_MD('Setup', 'sealed: 2026-08-05\n') }, true);

  const result = board.sync(root, { by: '/forge-spec' });
  const md = fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.md'), 'utf8');

  assert.ok(!md.includes('stale pointer'), 'stale Next Up was replaced');
  assert.ok(md.includes('!/audit-spec @2026-09-01-retry'), 'Next Up points at the in-progress spec');
  assert.ok(!md.includes('Old Planned Entry'), 'stale Planned entry removed');
  assert.ok(md.includes('### 1. Two-Factor Auth'), 'backlog #1 preserved');
  assert.ok(md.includes('### 2. Audit Log'), 'backlog #2 preserved');
  assert.ok(md.includes('| SSO | Enterprise single sign-on | two-factor-auth |'), 'vision preserved');
  assert.ok(md.includes('Initial roadmap created'), 'changelog preserved');
  assert.ok(md.includes('| Setup | `2026-08-01-setup` | 2026-08-05 |'), 'done row added from disk');
  assert.ok(md.includes('| Old | `2026-01-01-old` | 2026-01-02 |'), 'existing done row kept');
  assert.strictEqual(result.counts.inProgress, 1);
  assert.strictEqual(result.counts.done, 2);
});

test('a backlog entry whose slug was catalyzed drops off the backlog', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  spec(root, '2026-09-02-two-factor-auth', { 'spec.md': SPEC_MD('Two-Factor Auth') });
  board.sync(root, { by: '/catalyze-spec' });
  const md = fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.md'), 'utf8');
  assert.ok(!md.includes('### 1. Two-Factor Auth'), 'catalyzed entry removed from backlog');
  assert.ok(md.includes('### 2. Audit Log'), 'remaining entry keeps its ID');
  assert.ok(md.includes('!/forge-spec @2026-09-02-two-factor-auth'), 'appears as Planned');
});

test('IDs are permanent: new entries get a fresh ID, never a graduated one', () => {
  const roadmap = ROADMAP_WITH_BACKLOG.replace('## 📋 Planned', '### Rate Limits\n**Catalyze as:** `rate-limits`\n\n---\n\n## 📋 Planned');
  const root = fixture({ roadmap });
  spec(root, '2026-09-02-audit-log', { 'spec.md': SPEC_MD('Audit Log') });
  board.sync(root, { by: '/catalyze-spec' });
  const p = path.join(root, '.catalyst', 'main', 'roadmap.md');
  let md = fs.readFileSync(p, 'utf8');
  assert.ok(md.includes('### 1. Two-Factor Auth') && md.includes('### 3. Rate Limits'));
  fs.writeFileSync(p, md.replace('## 📋 Planned', '### Webhooks\n\n---\n\n## 📋 Planned'));
  board.sync(root, { by: '/plan-project' });
  md = fs.readFileSync(p, 'utf8');
  assert.ok(md.includes('### 4. Webhooks'), 'next ID survives graduation of #2');
});

test('backlog intro and free text between entries survive graduation', () => {
  const roadmap = ROADMAP_WITH_BACKLOG
    .replace('## 🗂️ Backlog\n', '## 🗂️ Backlog\n\nOur own intro.\n')
    .replace('---\n\n### 2. Audit Log', '---\n\n> ### Track B: Compliance\n> Ships after auth.\n\n---\n\n### 2. Audit Log');
  const root = fixture({ roadmap });
  spec(root, '2026-09-02-two-factor-auth', { 'spec.md': SPEC_MD('Two-Factor Auth') });
  board.sync(root, { by: '/catalyze-spec' });
  const md = fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.md'), 'utf8');
  assert.ok(md.includes('Our own intro.'));
  assert.ok(md.includes('> ### Track B: Compliance\n> Ships after auth.\n\n---\n\n### 2. Audit Log'));
});

test('done rows for specs no longer on disk are kept; reopened specs leave Done', () => {
  const roadmap = ROADMAP_WITH_BACKLOG.replace('| Old | `2026-01-01-old` | 2026-01-02 |', '| Old | `2026-01-01-old` | 2026-01-02 |\n| Back | `2026-01-03-back` | 2026-01-04 |');
  const root = fixture({ roadmap });
  spec(root, '2026-01-03-back', { 'spec.md': SPEC_MD('Back') });
  board.sync(root, { by: '/sync-project' });
  const md = fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.md'), 'utf8');
  assert.ok(md.includes('| Old | `2026-01-01-old` | 2026-01-02 |'));
  assert.ok(!md.includes('| Back |'));
});

test('slugless entries graduate when marked ✅ or matched by spec name', () => {
  const roadmap = ROADMAP_WITH_BACKLOG.replace('## 📋 Planned', '### 3. Dark Mode ✅ Done\n\n---\n\n### 4. Search\n\n---\n\n## 📋 Planned');
  const root = fixture({ roadmap });
  spec(root, '2026-09-03-search', { 'spec.md': SPEC_MD('Search') });
  board.sync(root, { by: '/sync-project', today: '2026-09-04' });
  const md = fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.md'), 'utf8');
  assert.ok(!md.includes('### 3. Dark Mode') && !md.includes('### 4. Search'));
  assert.ok(md.includes('| Dark Mode |  | 2026-09-04 |'), 'marked entry recorded in Done');
});

test('missing roadmap.md is a no-op unless --init', () => {
  const root = fixture();
  spec(root, '2026-09-01-retry', { 'spec.md': SPEC_MD('Retry Truth') });
  const r1 = board.sync(root, { by: '/forge-spec' });
  assert.strictEqual(r1.skipped, true);
  assert.ok(!fs.existsSync(path.join(root, '.catalyst', 'main', 'roadmap.md')));
  const r2 = board.sync(root, { by: '/plan-project', init: true });
  assert.strictEqual(r2.skipped, undefined);
  assert.ok(fs.existsSync(path.join(root, '.catalyst', 'main', 'roadmap.md')));
  assert.ok(fs.existsSync(path.join(root, '.catalyst', 'dashboard.html')));
});

test('sync is idempotent', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  spec(root, '2026-09-01-retry', { 'spec.md': SPEC_MD('Retry Truth'), 'tasks.md': '# Tasks' });
  board.sync(root, { by: '/forge-spec', today: '2026-09-02' });
  const first = fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.md'), 'utf8');
  board.sync(root, { by: '/forge-spec', today: '2026-09-02' });
  const second = fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.md'), 'utf8');
  assert.strictEqual(first, second);
});

// ---------------------------------------------------------------------------
console.log('\ndashboard.html generation');

test('dashboard embeds valid JSON DATA with roadmap + raw docs', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  spec(root, '2026-09-01-retry', { 'spec.md': SPEC_MD('Retry Truth'), 'tasks.md': '# Tasks' });
  fs.writeFileSync(path.join(root, '.catalyst', 'main', 'concerns.md'), '# Concerns\n\n</script><b>x</b>\n');
  board.sync(root, { by: '/forge-spec', today: '2026-09-02' });

  const html = fs.readFileSync(path.join(root, '.catalyst', 'dashboard.html'), 'utf8');
  const m = html.match(/\/\/ === DATA:START[^\n]*\nconst DATA = ([\s\S]*?);\n\/\/ === DATA:END/);
  assert.ok(m, 'DATA block present');
  const data = JSON.parse(m[1].replace(/<\\\//g, '</'));
  assert.strictEqual(data.project, 'Example App');
  assert.strictEqual(data.tagline, 'Make the example effortless.');
  assert.strictEqual(data.generated, '2026-09-02');
  assert.strictEqual(data.generatedBy, '/forge-spec');
  assert.strictEqual(data.roadmap.inProgress[0].slug, '2026-09-01-retry');
  assert.strictEqual(data.roadmap.backlog.length, 2);
  assert.strictEqual(data.roadmap.nextUp.command, '!/audit-spec @2026-09-01-retry');
  assert.ok(data.docs.mission.startsWith('# Mission'));
  assert.ok(data.docs.concerns.includes('<b>x</b>'));
  assert.ok(!m[1].includes('</script>'), 'closing script tag is escaped inside DATA');
  assert.ok(html.includes('function renderDoc'), 'renderer shipped from template');
});

test('template-less project still syncs roadmap and reports the missing template', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  fs.unlinkSync(path.join(root, '.catalyst', 'main', 'temp', 'temp-dashboard.html'));
  const r = board.sync(root, { by: '/forge-spec' });
  assert.strictEqual(r.dashboard, null);
  assert.ok(fs.existsSync(path.join(root, '.catalyst', 'main', 'roadmap.md')));
});

// ---------------------------------------------------------------------------
console.log('\nroadmap.json');

test('roadmap.json is opt-in: written with --json, then refreshed on every sync', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  const json = path.join(root, '.catalyst', 'main', 'roadmap.json');
  board.sync(root, { by: '/forge-spec' });
  assert.ok(!fs.existsSync(json));
  board.sync(root, { by: '/roadmap-json', json: true });
  assert.ok(fs.existsSync(json));
  spec(root, '2026-09-02-two-factor-auth', { 'spec.md': SPEC_MD('Two-Factor Auth') });
  board.sync(root, { by: '/catalyze-spec' });
  const j = JSON.parse(fs.readFileSync(json, 'utf8'));
  assert.strictEqual(j.specs.find((s) => s.id === 'two-factor-auth').status, 'planned');
});

test('roadmap.json lists every spec flat, with requires resolved and readiness computed', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  spec(root, '2026-08-01-setup', { 'spec.md': SPEC_MD('Setup', 'sealed: 2026-08-05\nrequires:\n  - nothing-real\n') }, true);
  board.sync(root, { by: '/roadmap-json', json: true, today: '2026-09-02' });
  const j = JSON.parse(fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.json'), 'utf8'));
  const by = Object.fromEntries(j.specs.map((s) => [s.id, s]));
  assert.deepStrictEqual(j.specs.map((s) => s.status), ['done', 'done', 'backlog', 'backlog', 'vision']);
  assert.strictEqual(by.setup.folder, 'completed/2026-08-01-setup');
  assert.strictEqual(by.setup.sealed, '2026-08-05');
  assert.strictEqual(by['two-factor-auth'].ready, true);
  assert.deepStrictEqual(by['audit-log'].requires, ['two-factor-auth']);
  assert.strictEqual(by['audit-log'].ready, false);
  assert.deepStrictEqual(by['audit-log'].blocked_by, ['two-factor-auth']);
  assert.deepStrictEqual(by.sso.requires, ['two-factor-auth']);
  assert.deepStrictEqual(j.next, { id: 'two-factor-auth', command: '/catalyze-spec "TOTP two-factor authentication on login"' });
  assert.strictEqual(j.context.roadmap, '.catalyst/main/roadmap.md');
  assert.strictEqual(j.context.mission, '.catalyst/main/mission.md');
});

test('roadmap.json autopilot block reads project-config.yaml', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  const cfg = path.join(root, '.catalyst', 'main', 'project-config.yaml');
  fs.writeFileSync(cfg, 'git:\n  development_branch: "development"\n');
  let j = board.buildRoadmapJson(root, board.parseRoadmap(ROADMAP_WITH_BACKLOG), board.scanSpecs(root), null, {});
  assert.deepStrictEqual(j.autopilot, { base_branch: 'development', auto_merge: false });
  fs.writeFileSync(cfg, 'git:\n  development_branch: "development"\nautopilot:\n  branch: "pre-development"  # comment\n  auto_merge: true\n');
  j = board.buildRoadmapJson(root, board.parseRoadmap(ROADMAP_WITH_BACKLOG), board.scanSpecs(root), null, {});
  assert.deepStrictEqual(j.autopilot, { base_branch: 'pre-development', auto_merge: true });
});

test('a planned spec points autopilot at /forge-spec-worktree', () => {
  const root = fixture({ roadmap: ROADMAP_WITH_BACKLOG });
  spec(root, '2026-09-01-retry', { 'spec.md': SPEC_MD('Retry Truth') });
  board.sync(root, { by: '/roadmap-json', json: true });
  const j = JSON.parse(fs.readFileSync(path.join(root, '.catalyst', 'main', 'roadmap.json'), 'utf8'));
  assert.deepStrictEqual(j.next, { id: 'retry', command: '/forge-spec-worktree @2026-09-01-retry' });
});

// ---------------------------------------------------------------------------
console.log('\nproject root discovery');

test('findRoot walks up from a nested directory and from a worktree', () => {
  const root = fixture();
  const nested = path.join(root, 'src', 'deep');
  fs.mkdirSync(nested, { recursive: true });
  assert.strictEqual(board.findRoot(nested), root);
  // A worktree checkout carries its own .catalyst/main → it is its own root.
  const wt = path.join(root, '.catalyst', 'worktrees', 'slug');
  fs.mkdirSync(path.join(wt, '.catalyst', 'main'), { recursive: true });
  assert.strictEqual(board.findRoot(wt), wt);
  assert.strictEqual(board.findRoot(os.tmpdir()), null);
});

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
