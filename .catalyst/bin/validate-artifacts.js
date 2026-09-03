#!/usr/bin/env node
/**
 * Validate structural integrity of all catalyst-os artifacts.
 * Run: node .catalyst/bin/validate-artifacts.js
 * Exit code: 0 = all valid, 1 = errors found
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  ⚠ ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

// --- Helpers ---

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function listDir(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full);
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  // Simple YAML key extraction (no full parser needed)
  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

// --- Validators ---

console.log('\n📦 Catalyst OS Artifact Validation\n');

// 1. Skills
console.log('Skills:');
const skillDirs = listDir('.claude/skills').filter(d => !d.startsWith('.'));
if (skillDirs.length === 0) {
  error('No skills found in .claude/skills/');
} else {
  for (const dir of skillDirs) {
    const skillPath = `.claude/skills/${dir}/SKILL.md`;
    const content = readFile(skillPath);
    if (!content) {
      error(`${skillPath} — missing`);
    } else if (content.trim().length < 10) {
      error(`${skillPath} — empty or too short`);
    } else {
      ok(dir);
    }
  }
}

// 2. Agents
console.log('\nAgents:');
const agentFiles = listDir('.claude/agents').filter(f => f.endsWith('.md'));
if (agentFiles.length === 0) {
  error('No agents found in .claude/agents/');
} else {
  const requiredFields = ['name', 'description', 'model'];
  for (const file of agentFiles) {
    const content = readFile(`.claude/agents/${file}`);
    if (!content) {
      error(`${file} — cannot read`);
      continue;
    }
    const fm = extractFrontmatter(content);
    if (!fm) {
      error(`${file} — missing YAML frontmatter`);
      continue;
    }
    const missing = requiredFields.filter(f => !fm[f]);
    if (missing.length > 0) {
      error(`${file} — missing frontmatter fields: ${missing.join(', ')}`);
      continue;
    }
    // `skills:` preloads full skill content into the subagent at startup.
    // A name with no directory behind it preloads nothing, silently.
    const fmBlock = content.match(/^---\n([\s\S]*?)\n---/)[1];
    if (/^skills:[ \t]*\S/m.test(fmBlock)) {
      error(`${file} — skills: must be a YAML list, not an inline value`);
      continue;
    }
    const listed = (fmBlock.match(/^skills:\n(?:[ \t]+-[ \t]*\S+\n?)+/m) || [''])[0]
      .split('\n').slice(1)
      .map(l => l.replace(/^[ \t]+-[ \t]*/, '').trim())
      .filter(Boolean);
    const unknown = listed.filter(s => !skillDirs.includes(s));
    if (unknown.length > 0) {
      error(`${file} — skills: references non-existent skill(s): ${unknown.join(', ')}`);
    } else {
      ok(`${file.replace('.md', '')}${listed.length ? ` (preloads: ${listed.join(', ')})` : ''}`);
    }
  }
}

// 3. Commands
console.log('\nCommands:');
const cmdFiles = listDir('.claude/commands').filter(f => f.endsWith('.md'));
if (cmdFiles.length === 0) {
  error('No commands found in .claude/commands/');
} else {
  for (const file of cmdFiles) {
    const content = readFile(`.claude/commands/${file}`);
    if (!content || content.trim().length < 10) {
      error(`${file} — empty or too short`);
    } else {
      ok(file.replace('.md', ''));
    }
  }
}

// 4. Skill Index consistency (using-skills references vs actual skills)
console.log('\nSkill Index:');
const usingSkills = readFile('.claude/skills/using-skills/SKILL.md');
if (usingSkills) {
  // Extract skill paths from the index tables
  const pathMatches = usingSkills.matchAll(/`\.claude\/skills\/([^/]+)\/SKILL\.md`/g);
  const referenced = new Set();
  for (const m of pathMatches) {
    referenced.add(m[1]);
  }

  // Check referenced skills exist
  for (const skill of referenced) {
    if (!fileExists(`.claude/skills/${skill}/SKILL.md`)) {
      error(`using-skills references "${skill}" but .claude/skills/${skill}/SKILL.md doesn't exist`);
    }
  }

  // Check actual skills are referenced
  for (const dir of skillDirs) {
    if (!referenced.has(dir)) {
      warn(`Skill "${dir}" exists but is not listed in using-skills/SKILL.md`);
    }
  }

  if (errors === 0) ok('All skill references valid');
} else {
  error('using-skills/SKILL.md not found');
}

// 5. spec-structure.yaml file references
console.log('\nSpec Structure:');
const specStructure = readFile('.catalyst/specs/spec-structure.yaml');
if (specStructure) {
  ok('spec-structure.yaml exists');

  // Scribe mirrors the spec-folder allowlist in its own table. A copy that
  // drifts is how `journal/` ended up forbidden by the gatekeeper that was
  // supposed to permit it. spec-structure.yaml is the authority.
  const filesBlock = specStructure.match(/^files:\n([\s\S]*?)^\S/m)?.[1] || '';
  const schemaFiles = new Set(
    [...filesBlock.matchAll(/^  ([\w.\-/]+):$/gm)].map(m => m[1])
  );
  const scribe = readFile('.claude/agents/scribe.md') || '';
  const table = scribe.match(/### STRICT ALLOWLIST[\s\S]*?\n\n\*\*ANY OTHER FILE/);
  const scribeFiles = new Set(
    [...(table?.[0] || '').matchAll(/^\| `([\w.\-/]+)` \|/gm)].map(m => m[1])
  );

  if (schemaFiles.size === 0 || scribeFiles.size === 0) {
    error('could not parse the allowlist from spec-structure.yaml or scribe.md');
  } else {
    const missing = [...schemaFiles].filter(f => !scribeFiles.has(f));
    const extra = [...scribeFiles].filter(f => !schemaFiles.has(f));
    if (missing.length) error(`scribe.md allowlist is missing: ${missing.join(', ')}`);
    if (extra.length) error(`scribe.md allows what the schema does not: ${extra.join(', ')}`);
    if (!missing.length && !extra.length) {
      ok(`allowlist parity (${schemaFiles.size} entries)`);
    }
  }
} else {
  error('.catalyst/specs/spec-structure.yaml missing');
}

// 6. Core files
console.log('\nCore Files:');
const coreFiles = ['CLAUDE.md', 'AGENTS.md', 'package.json', '.catalyst/main/project-config.yaml', '.catalyst/bin/board.js', '.catalyst/main/temp/temp-dashboard.html'];
for (const f of coreFiles) {
  if (fileExists(f)) {
    ok(f);
  } else {
    error(`${f} — missing`);
  }
}

// 7. Dashboard template must carry the DATA markers board.js replaces
console.log('\nDashboard template:');
const tpl = readFile('.catalyst/main/temp/temp-dashboard.html');
if (tpl && /\/\/ === DATA:START/.test(tpl) && /\/\/ === DATA:END/.test(tpl) && tpl.includes('function renderDoc')) {
  ok('DATA markers + renderer present');
} else {
  error('temp-dashboard.html missing DATA:START/DATA:END markers or renderDoc');
}

// 8. Board Sync sections must call the script, never describe hand-generation
console.log('\nBoard sync:');
for (const dir of skillDirs) {
  const c = readFile(`.claude/skills/${dir}/SKILL.md`) || '';
  if (/## Board Sync/.test(c) && !/node \.catalyst\/bin\/board\.js/.test(c)) {
    error(`${dir}: Board Sync section does not call board.js`);
  }
  if (/Generating `dashboard\.html`|const DATA = \{/.test(c)) {
    error(`${dir}: still describes hand-generating dashboard.html`);
  }
}
if (errors === 0) ok('All Board Sync sections delegate to board.js');

// --- Summary ---
console.log('\n' + '─'.repeat(40));
if (errors > 0) {
  console.error(`\n❌ ${errors} error(s), ${warnings} warning(s)\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n⚠️  ${warnings} warning(s), 0 errors\n`);
  process.exit(0);
} else {
  console.log('\n✅ All artifacts valid\n');
  process.exit(0);
}
