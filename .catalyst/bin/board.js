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
 * sections of roadmap.md are preserved verbatim. Backlog `### N.` numbers are
 * permanent IDs, not ranks. Done rows are merged, never dropped. Everything
 * else derivable from disk is regenerated. Exit 0 on success, 1 when no project root is found.
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
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    const item = line.match(/^\s*-\s+(.*)$/);
    if (kv) {
      fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
      listKey = fm[kv[1]] ? null : kv[1];
    } else if (item && listKey) {
      fm[listKey] = fm[listKey] ? `${fm[listKey]}, ${item[1].trim()}` : item[1].trim();
    }
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
  return { slug, name, scope: truncate(scope, 180), requires: parseList(fm.requires), fm };
}

/** `[a, b]`, `a, b`, or a single value → array of trimmed strings. */
function parseList(raw) {
  if (!raw) return [];
  return raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((x) => x.trim().replace(/^["'`]|["'`]$/g, ''))
    .filter(Boolean);
}

function validationPassed(dir) {
  const v = readIf(path.join(dir, 'validation.md'));
  if (v == null) return false;
  return /overall\s+status[^\n]*\bPASS(ED)?\b/i.test(v) || /READY FOR APPROVAL/i.test(v);
}

/** `fromMtime` marks a guess: a fresh clone stamps every file with today. */
function sealedDate(dir, fm) {
  for (const k of ['sealed', 'completed', 'archived', 'sealed_on', 'completed_on', 'date']) {
    if (fm[k] && /^\d{4}-\d{2}-\d{2}/.test(fm[k])) return { date: fm[k].slice(0, 10), fromMtime: false };
  }
  try {
    return { date: fs.statSync(path.join(dir, 'spec.md')).mtime.toISOString().slice(0, 10), fromMtime: true };
  } catch {
    return { date: '', fromMtime: true };
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
    const sealed = sealedDate(dir, s.fm);
    out.done.push({ name: s.name, slug, date: sealed.date, guessed: sealed.fromMtime, requires: s.requires });
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

const NEXT_ID_RE = /^<!--\s*board:next-id\s+(\d+)\s*-->\s*$/;
const EMPTY_BACKLOG = '_Empty. Run `/plan-project` to queue the next specs._';
const BACKLOG_INTRO =
  '<!--\nIdeas we WILL build, not yet catalyzed. ORDERED queue: position is priority, top is next.\n`### N.` is a permanent ID that `Depends on: #N` refers to. Never renumber; write new\nentries without a number and board.js assigns one. One entry = one spec.\nEntries drop off once catalyzed or marked ✅. Free text between `---` separators is kept.\n-->';

function parseEntry(raw, name, id) {
  const slug = field(raw, 'Catalyze as').replace(/`/g, '').trim();
  return {
    id,
    name,
    slug,
    scope: field(raw, 'Scope'),
    doneWhen: field(raw, 'Done when'),
    dependsOn: field(raw, 'Depends on'),
    priority: parsePriority(field(raw, 'Priority')),
    command: lastCommandBlock(raw),
    raw: raw.replace(/\s+$/, ''),
  };
}

/**
 * Split the Backlog body into a verbatim preamble and an ordered list of blocks:
 * `### ` entries and free-text blocks (track headers, notes). An entry ends at a
 * `---` line or a blockquoted heading (`> ### Track`), so free text is never
 * swallowed into the entry above it.
 */
function parseBacklog(body) {
  const preamble = [];
  const blocks = [];
  let cur = null;
  let inFence = false;
  let nextId = 0;
  const close = () => {
    if (cur && (cur.type === 'entry' || cur.lines.join('').trim())) blocks.push(cur);
    cur = null;
  };
  for (const line of body.split(/\r?\n/)) {
    const marker = !inFence && line.trim().match(NEXT_ID_RE);
    if (marker) {
      nextId = Math.max(nextId, parseInt(marker[1], 10));
      continue;
    }
    const fence = /^```/.test(line.trim());
    const head = !inFence && line.match(/^###\s+(?:(\d+)\.\s*)?(.+?)\s*$/);
    if (head) {
      close();
      cur = { type: 'entry', id: head[1] ? parseInt(head[1], 10) : null, name: head[2].trim(), lines: [] };
    } else if (!inFence && cur && line.trim() === '---') {
      close();
      cur = { type: 'text', lines: [] };
    } else if (!inFence && cur && cur.type === 'entry' && /^>\s*#{1,6}\s/.test(line)) {
      close();
      cur = { type: 'text', lines: [line] };
    } else if (cur) {
      cur.lines.push(line);
    } else if (line.trim() !== EMPTY_BACKLOG) {
      preamble.push(line);
    }
    if (fence) inFence = !inFence;
  }
  close();

  // IDs are permanent: keep every written number, give unnumbered or duplicate
  // entries a fresh one past the high-water mark so a graduated ID is never reused.
  const seen = new Set();
  for (const b of blocks) if (b.type === 'entry' && b.id) nextId = Math.max(nextId, b.id + 1);
  nextId = Math.max(nextId, 1);
  const items = blocks.map((b) => {
    if (b.type === 'text') return { type: 'text', text: b.lines.join('\n').trim() };
    let id = b.id;
    if (!id || seen.has(id)) id = nextId++;
    seen.add(id);
    return { type: 'entry', entry: parseEntry(b.lines.join('\n').replace(/^\s*\n/, ''), b.name, id) };
  });

  let intro = preamble.join('\n').trim();
  if (!intro || /the number IS the priority/i.test(intro)) {
    intro = intro.replace(/<!--[\s\S]*?the number IS the priority[\s\S]*?-->/i, '').trim();
    intro = intro ? `${BACKLOG_INTRO}\n\n${intro}` : BACKLOG_INTRO;
  }
  return { intro, items, nextId };
}

/** A Backlog entry the planner already marked finished: ✅ in the title, ~~struck~~, or **Status:** done. */
function markedDone(e) {
  return /✅/.test(e.name) || /^~~.+~~$/.test(e.name) || /^(✅|done|shipped|complete[d]?)\b/i.test(field(e.raw, 'Status'));
}

function cleanDoneName(name) {
  return name
    .replace(/~~/g, '')
    .replace(/✅/g, '')
    .replace(/[\s—–:(\[-]*\b(done|shipped)\b[\])]*\s*$/i, '')
    .trim();
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

function parseDone(body) {
  return parseTable(body)
    .map(([name = '', slug = '', date = '']) => ({ name, slug: slug.replace(/`/g, '').trim(), date }))
    .filter((d) => d.name && !/^_none yet_$/.test(d.name));
}

/** Parse roadmap.md into planning-owned data + preserved raw sections. */
function parseRoadmap(md) {
  const { header, sections } = splitSections(md || '');
  const backlogSection = sections.find((s) => s.kind === 'backlog');
  const visionSection = sections.find((s) => s.kind === 'vision');
  const doneSection = sections.find((s) => s.kind === 'done');
  const layout = parseBacklog(backlogSection ? backlogSection.body : '');
  return {
    header,
    backlog: layout.items.filter((i) => i.type === 'entry').map((i) => i.entry),
    backlogLayout: layout,
    done: doneSection ? parseDone(doneSection.body) : [],
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
    return { name: b.name, slug: b.slug || '', why: `Top of Backlog (#${b.id}) — nothing is in flight, catalyze the next spec.`, command: b.command };
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

function renderBacklog(layout, entries) {
  const live = new Set(entries.map((e) => e.id));
  const blocks = layout.items
    .filter((i) => i.type === 'text' || live.has(i.entry.id))
    .map((i) => (i.type === 'text' ? i.text : `### ${i.entry.id}. ${i.entry.name}\n${i.entry.raw}`.replace(/\s+$/, '')));
  if (!entries.length) blocks.push(EMPTY_BACKLOG);
  const marker = `<!-- board:next-id ${layout.nextId} -->`;
  return `## 🗂️ Backlog\n\n${layout.intro}\n\n${marker}\n\n${blocks.join('\n\n---\n\n')}\n\n---`;
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
    ? items.map((d) => `| ${d.name} | ${d.slug ? `\`${d.slug}\`` : ''} | ${d.date || ''} |`).join('\n')
    : '| _none yet_ | | |';
  return `## ✅ Done\n\n<!-- Sealed/archived specs (.catalyst/specs/completed/). Newest first. -->\n\n| Spec | Slug | Sealed |\n|------|------|--------|\n${rows}\n\n---`;
}

function renderRoadmap(parsed, specs, nextUp) {
  const parts = [
    parsed.header || DEFAULT_HEADER,
    renderNextUp(nextUp),
    renderBacklog(parsed.backlogLayout, parsed.backlog),
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
// roadmap.json — flat, machine-readable view for autopilot orchestrators.
// Derived from roadmap.md + disk; roadmap.md stays the planning source.
// ---------------------------------------------------------------------------

/** Read the few project-config.yaml keys the JSON exposes (no YAML dependency). */
function readConfig(root) {
  const yaml = readIf(path.join(root, '.catalyst', 'main', 'project-config.yaml')) || '';
  const cfg = {};
  let block = '';
  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^(\s*)([A-Za-z_][\w-]*):\s*(.*?)\s*(?:#.*)?$/);
    if (!m) continue;
    const value = m[3].replace(/^["']|["']$/g, '');
    if (!m[1]) {
      block = m[2];
      if (value) cfg[block] = value;
    } else if (m[1].length === 2) {
      cfg[`${block}.${m[2]}`] = value;
    }
  }
  return cfg;
}

const shortId = (slug) => slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
const slugify = (s) => normalizeTitle(s).replace(/[\s/]+/g, '-');
const bare = (cmd) => (cmd || '').replace(/^!/, '');

function buildRoadmapJson(root, parsed, specs, nextUp, opts) {
  const cfg = readConfig(root);
  const ids = new Map(); // backlog `#N` → id
  for (const b of parsed.backlog) ids.set(b.id, b.slug || slugify(b.name));

  const items = [
    ...[...specs.done]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map((d) => ({
        id: d.slug ? shortId(d.slug) : slugify(d.name),
        status: 'done',
        title: d.name,
        requires: d.requires || [],
        folder: d.slug && exists(path.join(root, '.catalyst', 'specs', 'completed', d.slug)) ? `completed/${d.slug}` : null,
        sealed: d.date || null,
      })),
    ...[['audited', specs.audited], ['in-progress', specs.inProgress], ['planned', specs.planned]].flatMap(([status, list]) =>
      list.map((s) => ({
        id: shortId(s.slug),
        status,
        title: s.name,
        goal: s.scope || '',
        requires: s.requires || [],
        folder: s.slug,
        command: bare(s.command),
        ...(status === 'planned' ? { autopilot_command: `/forge-spec-worktree @${s.slug}` } : {}),
      }))
    ),
    ...parsed.backlog.map((b) => ({
      id: ids.get(b.id),
      status: 'backlog',
      title: b.name,
      goal: b.scope,
      done_when: b.doneWhen,
      priority: b.priority || null,
      requires: b.dependsOn
        .split(/[,;]|\band\b/)
        .map((t) => t.trim())
        .filter((t) => t && !/^(nothing|none|-|—|n\/a)$/i.test(t))
        .map((t) => {
          const n = t.match(/#(\d+)/);
          if (n) return ids.get(parseInt(n[1], 10)) || t;
          return t.replace(/`/g, '');
        }),
      command: bare(b.command),
    })),
    ...parsed.vision.map((v) => ({
      id: slugify(v.goal),
      status: 'vision',
      title: v.goal,
      goal: v.description,
      requires: parseList(v.prereq),
    })),
  ];

  // Resolve every `requires` to a known id; anything unresolvable blocks readiness.
  const byId = new Map(items.map((i) => [i.id, i]));
  const resolve = (ref) => {
    const key = shortId(ref);
    if (byId.has(key)) return key;
    if (byId.has(slugify(ref))) return slugify(ref);
    const hit = items.find((i) => i.id.endsWith(`-${key}`) || key.endsWith(`-${i.id}`));
    return hit ? hit.id : null;
  };
  for (const item of items) {
    const unresolved = [];
    item.requires = item.requires
      .map((r) => {
        const id = resolve(r);
        if (!id) unresolved.push(r);
        return id;
      })
      .filter(Boolean);
    if (item.status === 'done' || item.status === 'vision') continue;
    const waiting = item.requires.filter((r) => byId.get(r).status !== 'done');
    item.ready = !waiting.length && !unresolved.length;
    if (!item.ready) item.blocked_by = [...waiting, ...unresolved];
  }

  const context = {};
  const rel = (...p) => path.join('.catalyst', ...p);
  for (const [key, file] of Object.entries({ ...DOCS, roadmap: 'roadmap.md', projectConfig: 'project-config.yaml' })) {
    if (exists(path.join(root, '.catalyst', 'main', file))) context[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = rel('main', file);
  }
  if (cfg.plan && exists(path.join(root, cfg.plan))) context.plan = cfg.plan;
  if (exists(path.join(root, '.catalyst', 'references'))) context.references = rel('references');

  const { project, tagline } = projectIdentity(root, readIf(path.join(root, '.catalyst', 'main', 'mission.md')));
  const next = nextUp && items.find((i) => (nextUp.slug ? i.id === shortId(nextUp.slug) || i.folder === nextUp.slug : i.title === nextUp.name));
  return {
    schema: 1,
    project,
    summary: tagline,
    generated: opts.today || today(),
    generated_by: opts.by || 'board.js',
    context,
    autopilot: {
      base_branch: cfg['autopilot.branch'] || cfg['git.development_branch'] || null,
      auto_merge: /^(true|on|yes)$/i.test(cfg['autopilot.auto_merge'] || ''),
    },
    next: next ? { id: next.id, command: next.status === 'planned' ? next.autopilot_command : next.command } : null,
    specs: items,
  };
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

  // Done keeps every row it ever had; disk wins for the slugs it still holds,
  // and a spec reopened out of completed/ leaves the history.
  const active = new Set([...specs.planned, ...specs.inProgress, ...specs.audited].map((s) => s.slug));
  const history = [...specs.done];
  const known = (d) => history.some((h) => (d.slug ? h.slug === d.slug : !h.slug && normalizeTitle(h.name) === normalizeTitle(d.name)));
  for (const d of parsed.done) {
    const disk = d.slug && history.find((h) => h.slug === d.slug);
    if (disk && disk.guessed && d.date) disk.date = d.date;
    else if (!disk && !active.has(d.slug) && !known(d)) history.push(d);
  }
  for (const h of history) delete h.guessed;

  // A Backlog entry graduates once a spec carries its slug (or, slugless, its
  // name), or once the planner marks it done; a marked one with no spec joins Done.
  const onDisk = [...specs.planned, ...specs.inProgress, ...specs.audited, ...specs.done];
  const shipped = (b) =>
    b.slug
      ? [...onDisk, ...history].some((s) => s.slug && (s.slug === b.slug || s.slug.endsWith(`-${b.slug}`)))
      : onDisk.some((s) => normalizeTitle(s.name) === normalizeTitle(b.name));
  parsed.backlog = parsed.backlog.filter((b) => {
    if (shipped(b)) return false;
    if (!markedDone(b)) return true;
    const d = { name: cleanDoneName(b.name), slug: b.slug, date: opts.today || today() };
    if (!known(d)) history.push(d);
    return false;
  });
  history.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.slug || '').localeCompare(a.slug || ''));
  specs.done = history;

  const nextUp = resolveNextUp({ ...specs, backlog: parsed.backlog });

  fs.mkdirSync(mainDir, { recursive: true });
  fs.writeFileSync(roadmapPath, renderRoadmap(parsed, specs, nextUp));

  let dashboardPath = null;
  const template = readIf(path.join(mainDir, 'temp', 'temp-dashboard.html'));
  if (template) {
    dashboardPath = path.join(root, '.catalyst', 'dashboard.html');
    fs.writeFileSync(dashboardPath, renderDashboard(template, buildData(root, parsed, specs, nextUp, opts)));
  }

  // Opt-in: written once roadmap.json exists (created by /roadmap-json, i.e. --json).
  let jsonPath = path.join(mainDir, 'roadmap.json');
  if (opts.json || exists(jsonPath)) {
    fs.writeFileSync(jsonPath, JSON.stringify(buildRoadmapJson(root, parsed, specs, nextUp, opts), null, 2) + '\n');
  } else {
    jsonPath = null;
  }

  return {
    roadmap: roadmapPath,
    dashboard: dashboardPath,
    json: jsonPath,
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
    else if (a === '--json') opts.json = true;
    else if (a === '--quiet' || a === '-q') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function cli(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(`Usage: node .catalyst/bin/board.js [--by "/command"] [--init] [--json] [--root <dir>] [--quiet]

Reconciles .catalyst/main/roadmap.md and .catalyst/dashboard.html with the spec
folders on disk. Backlog + Vision sections are preserved; everything else is
regenerated. --init creates roadmap.md when the project has none. --json also
writes .catalyst/main/roadmap.json; once it exists every run refreshes it.`);
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
  if (r.json) console.log(`json:      ${rel(r.json)}`);
  return 0;
}

module.exports = { findRoot, scanSpecs, parseRoadmap, resolveNextUp, renderRoadmap, renderDashboard, buildData, buildRoadmapJson, sync, cli };

if (require.main === module) process.exit(cli());
