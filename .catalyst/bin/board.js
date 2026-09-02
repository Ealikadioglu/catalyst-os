#!/usr/bin/env node
/**
 * board.js — deterministic spec-lifecycle board generator.
 *
 * Reconciles `.catalyst/main/roadmap.md` and `.catalyst/dashboard.html` with
 * what is actually on disk in `.catalyst/specs/`. No model in the loop: this
 * is what every lifecycle command runs instead of hand-writing the dashboard.
 *
 *   node .catalyst/bin/board.js --by "/forge-spec"
 *   node .catalyst/bin/board.js --by "/plan-project" --init   # create roadmap.md if missing
 *
 * State detection (single source of truth, mirrored in the
 * `spec-lifecycle-board` skill):
 *
 *   Backlog      roadmap.md entry only, no spec folder           → /catalyze-spec
 *   Planned      spec.md exists, no tasks.md                     → /forge-spec
 *   In Progress  tasks.md exists, no passing validation.md       → /audit-spec
 *   Audited      validation.md says Overall Status: PASS         → /seal-spec
 *   Done         folder lives in .catalyst/specs/completed/      → (none)
 *
 * Planning judgment (Backlog order, Vision) is human/model-owned: those
 * sections of roadmap.md are preserved verbatim. Everything derivable from
 * disk is regenerated. Exit 0 on success, 1 when no project root is found.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readIf(p) {
  return exists(p) ? fs.readFileSync(p, 'utf8') : null;
}

function listDirs(p) {
  if (!exists(p)) return [];
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

/** Walk up from `start` to the nearest directory containing `.catalyst/main`. */
function findRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (exists(path.join(dir, '.catalyst', 'main'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// spec.md parsing
// ---------------------------------------------------------------------------

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (!m) return { fm, body: md };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { fm, body: md.slice(m[0].length) };
}

function firstHeading(body) {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

function firstParagraphAfter(body, headingRegex) {
  const lines = body.split(/\r?\n/);
  let start = 0;
  if (headingRegex) {
    const idx = lines.findIndex((l) => headingRegex.test(l));
    if (idx === -1) return null;
    start = idx + 1;
  }
  const para = [];
  for (let i = start; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith('#')) {
      if (para.length) break;
      if (headingRegex) break;
      continue;
    }
    if (l.startsWith('<!--') || l.startsWith('---') || l.startsWith('```')) {
      if (para.length) break;
      continue;
    }
    if (!l) {
      if (para.length) break;
      continue;
    }
    para.push(l.replace(/^>\s?/, ''));
  }
  return para.length ? para.join(' ') : null;
}

function truncate(s, n) {
  if (!s) return '';
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + '…' : clean;
}

function readSpec(dir, slug) {
  const raw = readIf(path.join(dir, 'spec.md'));
  if (raw == null) return null;
  const { fm, body } = parseFrontmatter(raw);
  const status = (fm.status || '').toLowerCase();
  if (status === 'rejected' || status === 'discarded') return null;
  const name = firstHeading(body) || slug;
  const scope =
    firstParagraphAfter(body, /^##\s+(overview|summary|tl;dr)/i) ||
    firstParagraphAfter(body.replace(/^#\s.+$/m, ''), null);
  return { slug, name, scope: truncate(scope, 180), fm };
}

function validationPassed(dir) {
  const v = readIf(path.join(dir, 'validation.md'));
  if (v == null) return false;
  return /overall\s+status[^\n]*\bPASS(ED)?\b/i.test(v) || /READY FOR APPROVAL/i.test(v);
}

function sealedDate(dir, fm) {
  for (const k of ['sealed', 'completed', 'archived', 'sealed_on', 'completed_on', 'date']) {
    if (fm[k] && /^\d{4}-\d{2}-\d{2}/.test(fm[k])) return fm[k].slice(0, 10);
  }
  try {
    return fs.statSync(path.join(dir, 'spec.md')).mtime.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/** Classify every spec folder on disk. */
function scanSpecs(root) {
  const specsDir = path.join(root, '.catalyst', 'specs');
  const out = { planned: [], inProgress: [], audited: [], done: [] };

  for (const slug of listDirs(specsDir)) {
    if (slug === 'completed') continue;
    const dir = path.join(specsDir, slug);
    const s = readSpec(dir, slug);
    if (!s) continue;
    const hasTasks = exists(path.join(dir, 'tasks.md'));
    if (hasTasks && validationPassed(dir)) {
      out.audited.push({ ...s, command: `!/seal-spec @${slug}` });
    } else if (hasTasks) {
      out.inProgress.push({ ...s, command: `!/audit-spec @${slug}` });
    } else {
      out.planned.push({ ...s, command: `!/forge-spec @${slug}` });
    }
  }

  const doneDir = path.join(specsDir, 'completed');
  for (const slug of listDirs(doneDir)) {
    const dir = path.join(doneDir, slug);
    const s = readSpec(dir, slug);
    if (!s) continue;
    out.done.push({ name: s.name, slug, date: sealedDate(dir, s.fm) });
  }
  out.done.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.slug.localeCompare(a.slug));

  for (const list of [out.planned, out.inProgress, out.audited]) {
    for (const item of list) delete item.fm;
  }
  return out;
}

// ---------------------------------------------------------------------------
// roadmap.md parsing
// ---------------------------------------------------------------------------

const PRIORITY_WORDS = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };

function normalizeTitle(t) {
  return t
    .replace(/[^\p{L}\p{N}\s/]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function classifySection(title) {
  const n = normalizeTitle(title);
  if (n.includes('next up')) return 'nextUp';
  if (n.includes('backlog')) return 'backlog';
  if (n.includes('in progress')) return 'inProgress';
  if (n.startsWith('planned')) return 'planned';
  if (n.includes('audited')) return 'audited';
  if (n === 'done' || n.startsWith('done ') || n.startsWith('shipped')) return 'done';
  if (n.includes('vision')) return 'vision';
  return 'other';
}

/** Split markdown into a header and `## ` sections (raw bodies kept). */
function splitSections(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let header = [];
  let current = null;
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const h = !inFence && line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      current = { title: h[1], kind: classifySection(h[1]), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    } else {
      header.push(line);
    }
  }
  return {
    header: header.join('\n').replace(/\s+$/, ''),
    sections: sections.map((s) => ({ ...s, body: s.body.join('\n') })),
  };
}

function field(entryText, label) {
  const m = entryText.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, 'i'));
  return m ? m[1].trim() : '';
}

function lastCommandBlock(text) {
  const blocks = [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  const cmds = blocks.filter((b) => b.startsWith('!/'));
  return cmds.length ? cmds[cmds.length - 1] : '';
}

function parsePriority(raw) {
  const n = raw.toLowerCase();
  for (const word of Object.keys(PRIORITY_WORDS)) if (n.includes(word)) return PRIORITY_WORDS[word];
  if (raw.includes('🔴')) return 'critical';
  if (raw.includes('🟠')) return 'high';
  if (raw.includes('🟡')) return 'medium';
  if (raw.includes('🟢')) return 'low';
  return '';
}

function parseBacklog(body) {
  const entries = [];
  const parts = body.split(/^(?=###\s)/m).filter((p) => /^###\s/.test(p));
  parts.forEach((raw, i) => {
    const head = raw.match(/^###\s+(?:(\d+)\.\s*)?(.+?)\s*$/m);
    const name = head ? head[2].trim() : `Entry ${i + 1}`;
    const rank = head && head[1] ? parseInt(head[1], 10) : i + 1;
    const slug = field(raw, 'Catalyze as').replace(/`/g, '').trim();
    const bodyOnly = raw.replace(/^###[^\n]*\n?/, '').replace(/\n---\s*$/, '').replace(/\s+$/, '');
    entries.push({
      rank,
      name,
      slug,
      scope: field(raw, 'Scope'),
      doneWhen: field(raw, 'Done when'),
      dependsOn: field(raw, 'Depends on'),
      priority: parsePriority(field(raw, 'Priority')),
      command: lastCommandBlock(raw),
      raw: bodyOnly,
    });
  });
  entries.sort((a, b) => a.rank - b.rank);
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

function parseTable(body) {
  const rows = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'))
    .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  if (rows.length < 2) return [];
  return rows.slice(2).filter((r) => r.some((c) => c && c !== '-'));
}

function parseVision(body) {
  return parseTable(body)
    .map(([goal = '', description = '', prereq = '']) => ({ goal, description, prereq }))
    .filter((v) => v.goal);
}

/** Parse roadmap.md into planning-owned data + preserved raw sections. */
function parseRoadmap(md) {
  const { header, sections } = splitSections(md || '');
  const backlogSection = sections.find((s) => s.kind === 'backlog');
  const visionSection = sections.find((s) => s.kind === 'vision');
  return {
    header,
    backlog: backlogSection ? parseBacklog(backlogSection.body) : [],
    vision: visionSection ? parseVision(visionSection.body) : [],
    preserved: sections.filter((s) => !['nextUp', 'planned', 'inProgress', 'audited', 'done'].includes(s.kind)),
  };
}

// ---------------------------------------------------------------------------
// Next Up
// ---------------------------------------------------------------------------

function resolveNextUp(r) {
  if (r.audited && r.audited.length) {
    const s = r.audited[0];
    return { name: s.name, slug: s.slug, why: 'Audit passed — seal it to finish the cycle.', command: s.command };
  }
  if (r.inProgress && r.inProgress.length) {
    const s = r.inProgress[0];
    return { name: s.name, slug: s.slug, why: 'Build in progress — finish and audit it before starting anything new.', command: s.command };
  }
  if (r.planned && r.planned.length) {
    const s = r.planned[0];
    return { name: s.name, slug: s.slug, why: 'Spec is shaped and the board is clear — forge it.', command: s.command };
  }
  if (r.backlog && r.backlog.length) {
    const b = r.backlog[0];
    return { name: b.name, slug: b.slug || '', why: 'Backlog #1 — nothing is in flight, catalyze the next spec.', command: b.command };
  }
  return null;
}

// ---------------------------------------------------------------------------
// roadmap.md rendering
// ---------------------------------------------------------------------------

const DEFAULT_HEADER = `# Project Roadmap

> **The roadmap is a queue of specs, not a checklist of tasks.**
> One entry = one spec = one forge cycle (one PR-sized unit of work).
> Tasks live in each spec's \`tasks.md\`, never here.
> Sections are **lifecycle states** — a spec moves across the board as it progresses:
> \`Backlog → Planned → In Progress → Audited → Done\`.
> Backlog and Vision are planning-owned (\`/plan-project\`); every other section is
> regenerated from disk by \`node .catalyst/bin/board.js\`.

---`;

function renderNextUp(nu) {
  const body = nu
    ? `**${nu.name}** — ${nu.why}\n\n\`\`\`\n${nu.command}\n\`\`\``
    : '_Nothing queued. Add Backlog entries with `/plan-project`._';
  return `## ▶ Next Up\n\n${body}\n\n---`;
}

function renderBacklog(entries) {
  const intro =
    '<!--\nIdeas we WILL build, not yet catalyzed. ORDERED queue — the number IS the priority.\nOne entry = one spec. Split anything that needs more than ~5-8 tasks.\nEdited by /plan-project only; entries drop off automatically once catalyzed.\n-->';
  if (!entries.length) return `## 🗂️ Backlog\n\n${intro}\n\n_Empty. Run \`/plan-project\` to queue the next specs._\n\n---`;
  const items = entries.map((e) => `### ${e.rank}. ${e.name}\n${e.raw}`.replace(/\s+$/, '')).join('\n\n---\n\n');
  return `## 🗂️ Backlog\n\n${intro}\n\n${items}\n\n---`;
}

function renderSpecList(title, comment, items, extra) {
  if (!items.length) return `## ${title}\n\n${comment}\n\n_None._\n\n---`;
  const cards = items
    .map((s) => {
      const scope = s.scope ? `\n**Scope:** ${s.scope}` : '';
      return `### ${s.name}\n**Slug:** \`${s.slug}\`${scope}\n\n\`\`\`\n${s.command}\n\`\`\`${extra ? `\n${extra(s)}` : ''}`;
    })
    .join('\n\n');
  return `## ${title}\n\n${comment}\n\n${cards}\n\n---`;
}

function renderDone(items) {
  const rows = items.length
    ? items.map((d) => `| ${d.name} | \`${d.slug}\` | ${d.date || ''} |`).join('\n')
    : '| _none yet_ | | |';
  return `## ✅ Done\n\n<!-- Sealed/archived specs (.catalyst/specs/completed/). Newest first. -->\n\n| Spec | Slug | Sealed |\n|------|------|--------|\n${rows}\n\n---`;
}

function renderRoadmap(parsed, specs, nextUp) {
  const parts = [
    parsed.header || DEFAULT_HEADER,
    renderNextUp(nextUp),
    renderBacklog(parsed.backlog),
    renderSpecList('📋 Planned', '<!-- spec.md exists (catalyzed), no tasks.md yet. Ready to forge. -->', specs.planned, (s) =>
      `> Or \`!/forge-spec-worktree @${s.slug}\` to run forge → audit → seal unattended in an isolated worktree.`
    ),
    renderSpecList('🔨 In Progress', '<!-- tasks.md exists, build ongoing. Keep to 0-1 specs (WIP limit). -->', specs.inProgress),
    renderSpecList('🔬 Audited', '<!-- validation.md shows Overall Status: PASS, not yet sealed. -->', specs.audited),
    renderDone(specs.done),
  ];
  for (const s of parsed.preserved) {
    if (s.kind === 'backlog') continue; // re-rendered above
    parts.push(`## ${s.title}\n${s.body.replace(/\s+$/, '')}`);
  }
  return parts.join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// dashboard.html rendering
// ---------------------------------------------------------------------------

const DOCS = {
  mission: 'mission.md',
  techStack: 'tech-stack.md',
  architecture: 'architecture.md',
  concerns: 'concerns.md',
  conventions: 'conventions.md',
};

function projectIdentity(root, mission) {
  let project = null;
  let tagline = null;
  if (mission) {
    const h1 = firstHeading(mission);
    if (h1 && !/^mission( template)?$/i.test(h1.trim())) {
      project = h1.replace(/^mission\s*[:—-]\s*/i, '').trim();
    }
    const quote = mission.match(/^>\s*(?!\[)(.+?)\s*$/m);
    if (quote) tagline = quote[1].trim();
  }
  if (!project) {
    const pkg = readIf(path.join(root, 'package.json'));
    if (pkg) {
      try {
        project = JSON.parse(pkg).name || null;
      } catch {
        project = null;
      }
    }
  }
  return { project: project || path.basename(root), tagline: tagline || '' };
}

function buildData(root, parsed, specs, nextUp, opts) {
  const docs = {};
  for (const [key, file] of Object.entries(DOCS)) {
    const md = readIf(path.join(root, '.catalyst', 'main', file));
    if (md && md.trim()) docs[key] = md;
  }
  const { project, tagline } = projectIdentity(root, docs.mission);
  const strip = (s) => ({ name: s.name, slug: s.slug, scope: s.scope || '', command: s.command });
  return {
    project,
    tagline,
    generated: opts.today || today(),
    generatedBy: opts.by || 'board.js',
    roadmap: {
      nextUp: nextUp || null,
      backlog: parsed.backlog.map(({ raw, ...b }) => b),
      planned: specs.planned.map(strip),
      inProgress: specs.inProgress.map(strip),
      audited: specs.audited.map(strip),
      done: specs.done,
      vision: parsed.vision,
    },
    docs,
  };
}

function renderDashboard(template, data) {
  const json = JSON.stringify(data, null, 2).replace(/<\//g, '<\\/');
  const re = /(\/\/ === DATA:START[^\n]*\n)[\s\S]*?(\n\/\/ === DATA:END)/;
  if (!re.test(template)) throw new Error('temp-dashboard.html has no DATA:START/DATA:END markers');
  return template.replace(re, (_, a, b) => `${a}const DATA = ${json};${b}`);
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

function sync(root, opts = {}) {
  const mainDir = path.join(root, '.catalyst', 'main');
  const roadmapPath = path.join(mainDir, 'roadmap.md');
  const existing = readIf(roadmapPath);
  if (existing == null && !opts.init) {
    return { skipped: true, reason: 'no roadmap.md (pass --init or run /plan-project to create one)' };
  }

  const specs = scanSpecs(root);
  const parsed = parseRoadmap(existing || '');

  // A Backlog entry graduates the moment a spec folder carries its slug.
  const onDisk = [...specs.planned, ...specs.inProgress, ...specs.audited, ...specs.done].map((s) => s.slug);
  parsed.backlog = parsed.backlog.filter(
    (b) => !b.slug || !onDisk.some((slug) => slug === b.slug || slug.endsWith(`-${b.slug}`))
  );
  parsed.backlog.forEach((b, i) => (b.rank = i + 1));

  const nextUp = resolveNextUp({ ...specs, backlog: parsed.backlog });

  fs.mkdirSync(mainDir, { recursive: true });
  fs.writeFileSync(roadmapPath, renderRoadmap(parsed, specs, nextUp));

  let dashboardPath = null;
  const template = readIf(path.join(mainDir, 'temp', 'temp-dashboard.html'));
  if (template) {
    dashboardPath = path.join(root, '.catalyst', 'dashboard.html');
    fs.writeFileSync(dashboardPath, renderDashboard(template, buildData(root, parsed, specs, nextUp, opts)));
  }

  return {
    roadmap: roadmapPath,
    dashboard: dashboardPath,
    nextUp,
    counts: {
      backlog: parsed.backlog.length,
      planned: specs.planned.length,
      inProgress: specs.inProgress.length,
      audited: specs.audited.length,
      done: specs.done.length,
    },
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--by') opts.by = argv[++i];
    else if (a === '--root') opts.root = argv[++i];
    else if (a === '--init') opts.init = true;
    else if (a === '--quiet' || a === '-q') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function cli(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(`Usage: node .catalyst/bin/board.js [--by "/command"] [--init] [--root <dir>] [--quiet]

Reconciles .catalyst/main/roadmap.md and .catalyst/dashboard.html with the spec
folders on disk. Backlog + Vision sections are preserved; everything else is
regenerated. --init creates roadmap.md when the project has none.`);
    return 0;
  }
  const root = findRoot(opts.root || process.cwd());
  if (!root) {
    console.error('board.js: no .catalyst/main found from here upward — run inside a Catalyst project.');
    return 1;
  }
  const r = sync(root, opts);
  if (opts.quiet) return 0;
  if (r.skipped) {
    console.log(`Board: skipped — ${r.reason}`);
    return 0;
  }
  const c = r.counts;
  const rel = (p) => (p ? path.relative(root, p) : '(no template — dashboard not written)');
  console.log(
    `Board synced${opts.by ? ` by ${opts.by}` : ''}: ${c.backlog} backlog · ${c.planned} planned · ${c.inProgress} in progress · ${c.audited} audited · ${c.done} done`
  );
  console.log(`Next Up: ${r.nextUp ? `${r.nextUp.name} → ${r.nextUp.command}` : 'nothing queued'}`);
  console.log(`roadmap:   ${rel(r.roadmap)}`);
  console.log(`dashboard: ${rel(r.dashboard)}`);
  return 0;
}

module.exports = { findRoot, scanSpecs, parseRoadmap, resolveNextUp, renderRoadmap, renderDashboard, buildData, sync, cli };

if (require.main === module) process.exit(cli());
