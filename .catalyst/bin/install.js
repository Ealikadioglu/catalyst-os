#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../../package.json');

const banner = `
${cyan}   ██████╗ █████╗ ████████╗ █████╗ ██╗  ██╗   ██╗███████╗████████╗
  ██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██║  ╚██╗ ██╔╝██╔════╝╚══██╔══╝
  ██║     ███████║   ██║   ███████║██║   ╚████╔╝ ███████╗   ██║
  ██║     ██╔══██║   ██║   ██╔══██║██║    ╚██╔╝  ╚════██║   ██║
  ╚██████╗██║  ██║   ██║   ██║  ██║███████╗██║   ███████║   ██║
   ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝   ╚══════╝   ╚═╝${reset}

  Catalyst OS ${dim}v${pkg.version}${reset}
  AI-native spec-driven development framework for Claude Code, Pi & Codex
`;

/**
 * Harness metadata and directory conventions
 */
const HARNESS_CONFIGS = {
  claude: {
    name: 'Claude Code',
    dir: '.claude',
    commandsDir: 'commands',
    writeClaudeMd: true,
  },
  pi: {
    name: 'Pi',
    dir: '.pi',
    commandsDir: 'prompts',
    writeClaudeMd: false,
  },
  codex: {
    name: 'OpenAI Codex',
    dir: '.codex',
    commandsDir: 'prompts',
    writeClaudeMd: false,
  },
};

/**
 * Parse CLI args
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let harness = null;
  let hasHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      hasHelp = true;
    } else if (arg === '--harness' || arg === '-H') {
      harness = args[i + 1] ? args[i + 1].toLowerCase() : null;
      i++;
    } else if (arg.startsWith('--harness=')) {
      harness = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('-H=')) {
      harness = arg.split('=')[1].toLowerCase();
    }
  }

  return { hasHelp, harness };
}

/**
 * Normalize harness input string
 */
function normalizeHarness(input) {
  if (!input) return null;
  const val = input.trim().toLowerCase();
  if (['1', 'claude', 'claude-code', 'claudecode'].includes(val)) return 'claude';
  if (['2', 'pi'].includes(val)) return 'pi';
  if (['3', 'codex', 'openai', 'openai-codex'].includes(val)) return 'codex';
  if (['4', 'all', 'both', 'every'].includes(val)) return 'all';
  return null;
}

/**
 * Prompt user for harness selection if not supplied via CLI
 */
async function resolveHarness(cliHarness) {
  if (cliHarness) {
    const normalized = normalizeHarness(cliHarness);
    if (normalized) return normalized;
    console.log(`  ${yellow}Warning:${reset} Unknown harness '${cliHarness}'. Defaulting to Claude Code.\n`);
    return 'claude';
  }

  // If in CI, default to Claude Code immediately
  if (process.env.CI) {
    return 'claude';
  }

  return new Promise((resolve) => {
    let resolved = false;

    if (process.stdin.isTTY) {
      console.log(`  ${yellow}? Which AI coding harness do you use?${reset}`);
      console.log(`    ${cyan}1)${reset} Claude Code  ${dim}(.claude/)${reset} ${dim}[default]${reset}`);
      console.log(`    ${cyan}2)${reset} Pi           ${dim}(.pi/)${reset}`);
      console.log(`    ${cyan}3)${reset} OpenAI Codex ${dim}(.codex/)${reset}`);
      console.log(`    ${cyan}4)${reset} All          ${dim}(Claude Code + Pi + Codex)${reset}\n`);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: Boolean(process.stdin.isTTY),
    });

    const promptText = process.stdin.isTTY ? '  Select [1-4] (default: 1): ' : '';

    rl.question(promptText, (answer) => {
      if (resolved) return;
      resolved = true;
      rl.close();
      const choice = answer.trim();
      const normalized = normalizeHarness(choice);
      if (normalized) {
        resolve(normalized);
      } else if (!choice) {
        resolve('claude');
      } else {
        if (process.stdin.isTTY) {
          console.log(`  ${dim}Unrecognized selection '${choice}', defaulting to Claude Code.${reset}\n`);
        }
        resolve('claude');
      }
    });

    rl.on('close', () => {
      if (!resolved) {
        resolved = true;
        resolve('claude');
      }
    });
  });
}

const TEXT_EXTS = new Set(['.md', '.yaml', '.yml', '.json', '.txt', '.js', '.sh', '.py']);

/**
 * Rewrite path references (e.g. .claude/ -> .pi/) in text files
 */
function rewriteContent(content, targetPrefix, commandsDir) {
  if (targetPrefix === '.claude') return content;
  return content
    .replaceAll('.claude/commands/', `${targetPrefix}/${commandsDir}/`)
    .replaceAll('.claude/commands', `${targetPrefix}/${commandsDir}`)
    .replaceAll('.claude/', `${targetPrefix}/`);
}

/**
 * Copy file if it exists, optionally rewriting path references
 */
function copyFileWithRewrite(src, dest, targetPrefix = '.claude', commandsDir = 'commands') {
  if (!fs.existsSync(src)) return false;
  if (path.resolve(src) === path.resolve(dest)) return true; // Don't copy onto itself

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const ext = path.extname(src).toLowerCase();
  if (TEXT_EXTS.has(ext) && targetPrefix !== '.claude') {
    const original = fs.readFileSync(src, 'utf8');
    const rewritten = rewriteContent(original, targetPrefix, commandsDir);
    fs.writeFileSync(dest, rewritten, 'utf8');
  } else {
    fs.copyFileSync(src, dest);
  }
  return true;
}

/**
 * Recursively copy directory, optionally rewriting path references
 */
function copyDirWithRewrite(srcDir, destDir, targetPrefix = '.claude', commandsDir = 'commands') {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirWithRewrite(srcPath, destPath, targetPrefix, commandsDir);
    } else {
      copyFileWithRewrite(srcPath, destPath, targetPrefix, commandsDir);
    }
  }
}

/**
 * Ensure the consuming project's .gitignore protects local secrets.
 * If `.catalyst/` (or the secrets file) is already ignored, do nothing.
 */
function ensureGitignore(cwd) {
  const guard = '.catalyst/secrets.local.yaml';
  const gitignorePath = path.join(cwd, '.gitignore');
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
    const lines = content.split(/\r?\n/).map((l) => l.trim());
    const covered = lines.some(
      (l) => l === guard || l === '/.catalyst' || l === '.catalyst' || l === '.catalyst/'
    );
    if (covered) return;
  }
  const block = `${content && !content.endsWith('\n') ? '\n' : ''}\n# Catalyst OS local secrets (never commit)\n${guard}\n`;
  fs.appendFileSync(gitignorePath, block);
  console.log(`  ${green}✓${reset} Added ${guard} to .gitignore`);
}

/**
 * Harnesses whose agents/ dir already exists in the project
 */
function detectInstalledHarnesses(cwd) {
  return Object.keys(HARNESS_CONFIGS).filter((key) =>
    fs.existsSync(path.join(cwd, HARNESS_CONFIGS[key].dir, 'agents'))
  );
}

/**
 * Install agents, commands/prompts, skills, and rules for a specific harness
 */
function installHarness(harnessKey, src, cwd) {
  const config = HARNESS_CONFIGS[harnessKey];
  const targetDir = path.join(cwd, config.dir);

  console.log(`  ${cyan}Configuring ${config.name}${reset} ${dim}(${config.dir}/)${reset}:`);

  if (fs.existsSync(path.join(targetDir, 'agents'))) {
    console.log(`  ${yellow}Warning:${reset} ${config.dir}/agents already exists`);
    console.log(`  ${dim}Files will be overwritten${reset}`);
  }

  // Install agents
  const agentsSrc = path.join(src, '.claude', 'agents');
  const agentsDest = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsSrc)) {
    copyDirWithRewrite(agentsSrc, agentsDest, config.dir, config.commandsDir);
    console.log(`  ${green}✓${reset} Installed ${config.dir}/agents`);
  }

  // Install commands/prompts
  const commandsSrc = path.join(src, '.claude', 'commands');
  const commandsDest = path.join(targetDir, config.commandsDir);
  if (fs.existsSync(commandsSrc)) {
    copyDirWithRewrite(commandsSrc, commandsDest, config.dir, config.commandsDir);
    console.log(`  ${green}✓${reset} Installed ${config.dir}/${config.commandsDir} ${config.commandsDir === 'prompts' ? '(prompt templates)' : '(slash commands)'}`);
  }

  // Install skills
  const skillsSrc = path.join(src, '.claude', 'skills');
  const skillsDest = path.join(targetDir, 'skills');
  if (fs.existsSync(skillsSrc)) {
    copyDirWithRewrite(skillsSrc, skillsDest, config.dir, config.commandsDir);
    console.log(`  ${green}✓${reset} Installed ${config.dir}/skills`);
  }

  // Install rules
  const rulesSrc = path.join(src, '.claude', 'rules');
  const rulesDest = path.join(targetDir, 'rules');
  if (fs.existsSync(rulesSrc)) {
    copyDirWithRewrite(rulesSrc, rulesDest, config.dir, config.commandsDir);
    console.log(`  ${green}✓${reset} Installed ${config.dir}/rules`);
  }

  // If Claude Code, write 1-line import bridge so Claude Code loads AGENTS.md
  if (config.writeClaudeMd) {
    const claudeMdDest = path.join(cwd, 'CLAUDE.md');
    if (!fs.existsSync(claudeMdDest)) {
      fs.writeFileSync(claudeMdDest, '@AGENTS.md\n');
      console.log(`  ${green}✓${reset} Created CLAUDE.md (@AGENTS.md import bridge)`);
    }
  }

  console.log('');
}

/**
 * Main install entrypoint
 */
async function install() {
  console.log(banner);

  const { hasHelp, harness: cliHarness } = parseArgs();

  // Show help if requested
  if (hasHelp) {
    console.log(`  ${yellow}Usage:${reset} npx catalyst-os [options]

  ${yellow}Options:${reset}
    ${cyan}-h, --help${reset}            Show this help message
    ${cyan}-H, --harness <name>${reset}  Target harness: claude, pi, codex, or all (default: interactive prompt)

  ${yellow}Supported harnesses:${reset}
    ${cyan}claude${reset}                Claude Code (.claude/ directory, slash commands in commands/)
    ${cyan}pi${reset}                    Pi coding agent (.pi/ directory, prompt templates in prompts/)
    ${cyan}codex${reset}                 OpenAI Codex (.codex/ directory, prompt templates in prompts/)
    ${cyan}all${reset}                   Install for Claude Code, Pi, and Codex simultaneously

  ${yellow}What gets installed:${reset}
    ${dim}<harness-dir>/${reset}        Agents, skills, rules, and commands/prompts
    ${dim}.catalyst/${reset}            Spec templates, project config, and bin/board.js (dashboard generator)
    ${dim}AGENTS.md${reset}             Universal instructions, architecture, and agent registry

  ${yellow}Example:${reset}
    ${dim}# Interactive setup${reset}
    npx catalyst-os

    ${dim}# Directly initialize for Pi${reset}
    npx catalyst-os --harness pi
`);
    process.exit(0);
  }

  const selectedHarness = await resolveHarness(cliHarness);

  const src = path.join(__dirname, '../..');
  const cwd = process.cwd();

  console.log(`  Installing Catalyst OS to ${cyan}${cwd}${reset}\n`);

  const catalystDir = path.join(cwd, '.catalyst');

  // Harnesses already installed here are refreshed too: updating only the selected one
  // leaves the others on an old framework version that still loads and runs.
  const targetHarnesses = selectedHarness === 'all' ? ['claude', 'pi', 'codex'] : [selectedHarness];
  for (const h of detectInstalledHarnesses(cwd)) {
    if (!targetHarnesses.includes(h)) {
      targetHarnesses.push(h);
      console.log(`  ${dim}•${reset} Also refreshing existing ${HARNESS_CONFIGS[h].dir}/ so it does not go stale\n`);
    }
  }
  // AGENTS.md and templates can point at one harness dir only; prefer .claude when present.
  const primaryHarness = targetHarnesses.includes('claude') ? 'claude' : targetHarnesses[0];
  const primaryDir = HARNESS_CONFIGS[primaryHarness].dir;
  const primaryCommandsDir = HARNESS_CONFIGS[primaryHarness].commandsDir;
  for (const h of targetHarnesses) {
    installHarness(h, src, cwd);
  }

  // Framework-owned config: always refresh on (re)install.
  if (copyFileWithRewrite(path.join(src, '.catalyst/specs/spec-structure.yaml'), path.join(cwd, '.catalyst/specs/spec-structure.yaml'))) {
    console.log(`  ${green}✓${reset} Installed .catalyst/specs/spec-structure.yaml`);
  }

  // Framework-owned runtime: deterministic board/dashboard generator.
  if (copyFileWithRewrite(path.join(src, '.catalyst/bin/board.js'), path.join(cwd, '.catalyst/bin/board.js'))) {
    console.log(`  ${green}✓${reset} Installed .catalyst/bin/board.js (board + dashboard generator)`);
  }

  // Framework-owned document templates (roadmap, dashboard, mission, etc.):
  const tempSrc = path.join(src, '.catalyst', 'main', 'temp');
  const tempDest = path.join(catalystDir, 'main', 'temp');
  if (fs.existsSync(tempSrc)) {
    copyDirWithRewrite(tempSrc, tempDest, primaryDir, primaryCommandsDir);
    console.log(`  ${green}✓${reset} Installed .catalyst/main/temp/ (doc templates)`);
  }

  // User-owned config: create ONLY if missing.
  const pcDest = path.join(cwd, '.catalyst/main/project-config.yaml');
  if (!fs.existsSync(pcDest)) {
    if (copyFileWithRewrite(path.join(src, '.catalyst/main/project-config.yaml'), pcDest)) {
      console.log(`  ${green}✓${reset} Installed .catalyst/main/project-config.yaml`);
    }
  } else {
    console.log(`  ${dim}•${reset} Kept existing .catalyst/main/project-config.yaml`);
  }

  // Install voice runtime (zero-dependency local meeting daemon for /meet-spec)
  const voiceSrc = path.join(src, '.catalyst', 'voice');
  const voiceDest = path.join(catalystDir, 'voice');
  if (fs.existsSync(voiceSrc)) {
    copyDirWithRewrite(voiceSrc, voiceDest);
    console.log(`  ${green}✓${reset} Installed .catalyst/voice/`);
  }

  // Create specs directory if it doesn't exist
  const specsDir = path.join(catalystDir, 'specs');
  if (!fs.existsSync(specsDir)) {
    fs.mkdirSync(specsDir, { recursive: true });
    console.log(`  ${green}✓${reset} Created .catalyst/specs/`);
  }

  // Create local secrets file (git-ignored) if it doesn't exist yet
  const secretsPath = path.join(catalystDir, 'secrets.local.yaml');
  if (!fs.existsSync(secretsPath)) {
    fs.writeFileSync(
      secretsPath,
      '# Catalyst OS — Local Secrets (git-ignored, never commit)\n' +
        '# Optional. Only needed for /meet-spec voice meetings.\n' +
        '# Get a key at https://elevenlabs.io (you pay for your own usage).\n' +
        'elevenlabs_api_key: ""\n'
    );
    console.log(`  ${green}✓${reset} Created .catalyst/secrets.local.yaml`);
  }

  // Safety belt: ensure local secrets file can never be committed
  ensureGitignore(cwd);

  // Install AGENTS.md (rewritten for selected harness)
  const agentsMdSrc = path.join(src, 'AGENTS.md');
  const agentsMdDest = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(agentsMdSrc)) {
    copyFileWithRewrite(agentsMdSrc, agentsMdDest, primaryDir, primaryCommandsDir);
    console.log(`  ${green}✓${reset} Installed AGENTS.md${primaryHarness !== 'claude' ? ` (configured for ${primaryDir}/)` : ''}`);
  }

  console.log(`
  ${green}Done!${reset}

  ${yellow}Next steps:${reset}
    1. Run ${cyan}/catalyze-project${reset} to initialize your project
    2. Run ${cyan}/catalyze-spec${reset} to create your first specification
    3. Run ${cyan}/forge-spec${reset} to implement it

  ${dim}Documentation: https://github.com/Ealikadioglu/catalyst-os${reset}
`);
}

// Run installation
install();
