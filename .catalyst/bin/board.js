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
 *   node .catalyst/bin/board.js --wave 1                       # one wave's state, for /forge-wave
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
 * Planning judgment (Waves, Backlog order, Vision) is human/model-owned: those
 * sections of roadmap.md are preserved (Waves gets a status per spec). Backlog `### N.` numbers are
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
  if (/^waves?\b/.test(n)) return 'waves';
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

const WAVES_INTRO =
  '<!--\nOrdered groups of specs run one after another by `/forge-wave <id>`. Planning-owned\n(`/plan-project`): write `### Wave N`, a one- or two-sentence **Goal:**, and the specs as a\nnumbered list of `Catalyze as` slugs in build order. Wave numbers are permanent IDs.\nboard.js fills in the status of each spec; it never reorders or drops one.\n-->';
const STATE_MARK = { done: '✅', audited: '🔬', inProgress: '🔨', planned: '📋', backlog: '🗂️', unknown: '❓' };

/** `### Wave N` blocks: a goal and an ordered list of slugs. The intro comment is kept. */
function parseWaves(body) {
  const intro = [];
  const waves = [];
  let cur = null;
  for (const line of body.split(/\r?\n/)) {
    const head = line.match(/^###\s+Wave\s+(\d+)\b[\s:—–-]*(.*?)\s*$/i);
    if (head) {
      cur = { id: parseInt(head[1], 10), label: head[2], goal: '', slugs: [] };
      waves.push(cur);
      continue;
    }
    if (!cur) {
      if (line.trim() !== '---') intro.push(line);
      continue;
    }
    const goal = line.match(/^\*\*Goal:\*\*\s*(.+)$/i);
    const item = line.match(/^\s*(?:\d+\.|[-*])\s+(.+)$/);
    if (goal) cur.goal = goal[1].trim();
    else if (item) {
      const tick = item[1].match(/`([^`]+)`/);
      const slug = tick ? tick[1] : item[1].replace(/^[^\p{L}\p{N}]+/u, '').split(/\s/)[0];
      if (slug) cur.slugs.push(slug.trim());
    }
  }
  return { intro: intro.join('\n').trim() || WAVES_INTRO, waves };
}

/** Parse roadmap.md into planning-owned data + preserved raw sections. */
function parseRoadmap(md) {
  const { header, sections } = splitSections(md || '');
  const backlogSection = sections.find((s) => s.kind === 'backlog');
  const visionSection = sections.find((s) => s.kind === 'vision');
  const doneSection = sections.find((s) => s.kind === 'done');
  const wavesSection = sections.find((s) => s.kind === 'waves');
  const layout = parseBacklog(backlogSection ? backlogSection.body : '');
  return {
    header,
    backlog: layout.items.filter((i) => i.type === 'entry').map((i) => i.entry),
    backlogLayout: layout,
    waves: wavesSection ? parseWaves(wavesSection.body) : null,
    done: doneSection ? parseDone(doneSection.body) : [],
    vision: visionSection ? parseVision(visionSection.body) : [],
    preserved: sections.filter((s) => !['nextUp', 'waves', 'planned', 'inProgress', 'audited', 'done'].includes(s.kind)),
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

function renderRoadmap(parsed, specs, nextUp, waves) {
  const parts = [
    parsed.header || DEFAULT_HEADER,
    renderNextUp(nextUp),
    ...(waves ? [renderWaves(parsed.waves, waves)] : []),
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

function buildData(root, parsed, specs, nextUp, opts, waves) {
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
      waves: (waves || []).map((w) => ({
        id: w.id,
        goal: w.goal,
        done: w.done,
        next: w.next ? w.next.slug : null,
        specs: w.items.map((i) => ({ slug: i.slug, name: i.name, state: i.state })),
      })),
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
// Waves — each slug resolved to its lifecycle state on disk.
// ---------------------------------------------------------------------------

/** Read the few project-config.yaml keys the board reports (no YAML dependency). */
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

const matchesSlug = (folder, slug) => folder === slug || folder.endsWith(`-${slug}`);
const bare = (cmd) => (cmd || '').replace(/^!/, '');

/** `Depends on:` → slugs; `#N` resolves through the Backlog's permanent IDs. */
function backlogRequires(entry, backlog) {
  return entry.dependsOn
    .split(/[,;]|\band\b/)
    .map((t) => t.trim())
    .filter((t) => t && !/^(nothing|none|-|—|n\/a)$/i.test(t))
    .map((t) => {
      const n = t.match(/#(\d+)/);
      if (!n) return t.replace(/`/g, '');
      const hit = backlog.find((b) => b.id === parseInt(n[1], 10));
      return hit && hit.slug ? hit.slug : t;
    });
}

function resolveWaves(waves, specs, backlog) {
  const find = (slug) => {
    for (const [state, list] of [['audited', specs.audited], ['inProgress', specs.inProgress], ['planned', specs.planned]]) {
      const s = list.find((x) => matchesSlug(x.slug, slug));
      if (s) {
        const command = state === 'planned' ? `/forge-spec-worktree @${s.slug}` : bare(s.command);
        return { slug, state, name: s.name, folder: s.slug, requires: s.requires || [], command };
      }
    }
    const d = specs.done.find((x) => x.slug && matchesSlug(x.slug, slug));
    if (d) return { slug, state: 'done', name: d.name, folder: d.slug, requires: d.requires || [], command: '' };
    const b = backlog.find((x) => x.slug === slug);
    if (b) return { slug, state: 'backlog', name: b.name, folder: null, requires: backlogRequires(b, backlog), command: bare(b.command) };
    return { slug, state: 'unknown', name: '', folder: null, requires: [], command: '' };
  };
  return waves.map((w) => {
    const items = w.slugs.map(find);
    const isDone = (slug) => specs.done.some((x) => x.slug && matchesSlug(x.slug, slug));
    for (const i of items) i.waitingOn = i.state === 'done' ? [] : i.requires.filter((r) => !isDone(r));
    const done = items.filter((i) => i.state === 'done').length;
    const next = items.find((i) => i.state !== 'done') || null;
    return { ...w, items, done, next };
  });
}

function renderWaves(waves, resolved) {
  const blocks = resolved.map((w) => {
    const status = !w.items.length
      ? '_no specs listed_'
      : w.next
        ? `${w.done}/${w.items.length} done · next: \`${w.next.slug}\``
        : `${w.done}/${w.items.length} done · ✅ complete`;
    const list = w.items
      .map((i, n) => {
        const note = i.state === 'unknown' ? ' — not in Backlog or specs' : i.name ? ` — ${i.name}` : '';
        return `${n + 1}. ${STATE_MARK[i.state]} \`${i.slug}\`${note}`;
      })
      .join('\n');
    const head = `### Wave ${w.id}${w.label ? `: ${w.label}` : ''}`;
    return [head, `**Goal:** ${w.goal || '_missing — /plan-project writes one_'}`, `**Status:** ${status}`, '', list].join('\n').replace(/\s+$/, '');
  });
  return `## 🌊 Waves\n\n${waves.intro}\n\n${blocks.join('\n\n')}\n\n---`;
}

/** One wave's state for /forge-wave: base branch, every spec in order, and the next one. */
function waveReport(root, id) {
  const r = sync(root, { by: `/forge-wave ${id}` });
  if (r.skipped) return { error: `no roadmap.md — run /plan-project first` };
  const wave = (r.waves || []).find((w) => w.id === id);
  if (!wave) return { error: `wave ${id} is not in roadmap.md (## 🌊 Waves)` };
  const cfg = readConfig(root);
  return {
    ...wave,
    baseBranch: cfg['autopilot.branch'] || null,
    autoMerge: /^(true|on|yes)$/i.test(cfg['autopilot.auto_merge'] || ''),
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
  const waves = parsed.waves ? resolveWaves(parsed.waves.waves, specs, parsed.backlog) : null;

  fs.mkdirSync(mainDir, { recursive: true });
  fs.writeFileSync(roadmapPath, renderRoadmap(parsed, specs, nextUp, waves));

  let dashboardPath = null;
  const template = readIf(path.join(mainDir, 'temp', 'temp-dashboard.html'));
  if (template) {
    dashboardPath = path.join(root, '.catalyst', 'dashboard.html');
    fs.writeFileSync(dashboardPath, renderDashboard(template, buildData(root, parsed, specs, nextUp, opts, waves)));
  }

  return {
    roadmap: roadmapPath,
    dashboard: dashboardPath,
    nextUp,
    waves,
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
    else if (a === '--wave') opts.wave = parseInt(argv[++i], 10);
    else if (a === '--quiet' || a === '-q') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function cli(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(`Usage: node .catalyst/bin/board.js [--by "/command"] [--init] [--wave <id>] [--root <dir>] [--quiet]

Reconciles .catalyst/main/roadmap.md and .catalyst/dashboard.html with the spec
folders on disk. Backlog + Vision sections are preserved; everything else is
regenerated. --init creates roadmap.md when the project has none. --wave <id>
syncs, then prints that wave's specs in order with their state and the next one.`);
    return 0;
  }
  const root = findRoot(opts.root || process.cwd());
  if (!root) {
    console.error('board.js: no .catalyst/main found from here upward — run inside a Catalyst project.');
    return 1;
  }
  if (opts.wave) return printWave(root, opts.wave);
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

function printWave(root, id) {
  const w = waveReport(root, id);
  if (w.error) {
    console.error(`board.js: ${w.error}`);
    return 1;
  }
  const label = { done: 'done', audited: 'audited', inProgress: 'in progress', planned: 'planned', backlog: 'backlog', unknown: 'UNKNOWN' };
  console.log(`Wave ${w.id}: ${w.goal || '(no goal)'}`);
  console.log(`Base branch: ${w.baseBranch || '(autopilot.branch not set)'} · auto_merge: ${w.autoMerge}`);
  w.items.forEach((i, n) => {
    const wait = i.waitingOn.length ? `  waits on: ${i.waitingOn.join(', ')}` : '';
    const cmd = i.command ? `  ${i.command}` : '';
    console.log(`  ${n + 1}. ${label[i.state].padEnd(11)} ${i.slug}${cmd}${wait}`);
  });
  console.log(w.next ? `Next: ${w.next.slug}${w.next.command ? ` → ${w.next.command}` : ''}` : 'Next: nothing — wave complete');
  return 0;
}

module.exports = { findRoot, scanSpecs, parseRoadmap, resolveNextUp, renderRoadmap, renderDashboard, buildData, waveReport, sync, cli };

if (require.main === module) process.exit(cli());
