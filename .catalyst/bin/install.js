#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
  AI-native spec-driven development framework for Claude Code
`;

// Parse args
const args = process.argv.slice(2);
const hasHelp = args.includes('--help') || args.includes('-h');

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx catalyst-os [options]

  ${yellow}Options:${reset}
    ${cyan}-h, --help${reset}    Show this help message

  ${yellow}What gets installed:${reset}
    ${dim}.claude/${reset}       Agents, skills, and slash commands
    ${dim}.catalyst/${reset}     Spec templates and project config

  ${yellow}Example:${reset}
    ${dim}# Initialize catalyst-os in your project${reset}
    cd your-project
    npx catalyst-os

  ${yellow}After installation:${reset}
    Run ${cyan}/catalyze-project${reset} to initialize your project
    Run ${cyan}/catalyze-spec${reset} to create your first specification
`);
  process.exit(0);
}

/**
 * Recursively copy directory
 */
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy file if it exists
 */
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
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
 * Install catalyst-os to current directory
 */
function install() {
  const src = path.join(__dirname, '../..');
  const cwd = process.cwd();

  console.log(`  Installing to ${cyan}${cwd}${reset}\n`);

  // Check if already installed
  const claudeDir = path.join(cwd, '.claude');
  const catalystDir = path.join(cwd, '.catalyst');

  if (fs.existsSync(path.join(claudeDir, 'agents'))) {
    console.log(`  ${yellow}Warning:${reset} .claude/agents already exists`);
    console.log(`  ${dim}Files will be overwritten${reset}\n`);
  }

  // Install .claude/agents
  const agentsSrc = path.join(src, '.claude', 'agents');
  const agentsDest = path.join(claudeDir, 'agents');
  if (fs.existsSync(agentsSrc)) {
    copyDir(agentsSrc, agentsDest);
    console.log(`  ${green}✓${reset} Installed .claude/agents`);
  }

  // Install .claude/commands
  const commandsSrc = path.join(src, '.claude', 'commands');
  const commandsDest = path.join(claudeDir, 'commands');
  if (fs.existsSync(commandsSrc)) {
    copyDir(commandsSrc, commandsDest);
    console.log(`  ${green}✓${reset} Installed .claude/commands`);
  }

  // Install .claude/skills
  const skillsSrc = path.join(src, '.claude', 'skills');
  const skillsDest = path.join(claudeDir, 'skills');
  if (fs.existsSync(skillsSrc)) {
    copyDir(skillsSrc, skillsDest);
    console.log(`  ${green}✓${reset} Installed .claude/skills`);
  }

  // Framework-owned config: always refresh on (re)install.
  if (copyFile(path.join(src, '.catalyst/specs/spec-structure.yaml'), path.join(cwd, '.catalyst/specs/spec-structure.yaml'))) {
    console.log(`  ${green}✓${reset} Installed .catalyst/specs/spec-structure.yaml`);
  }

  // Framework-owned document templates (roadmap, dashboard, mission, etc.):
  // always refresh — the commands read these to generate .catalyst/main docs.
  const tempSrc = path.join(src, '.catalyst', 'main', 'temp');
  const tempDest = path.join(catalystDir, 'main', 'temp');
  if (fs.existsSync(tempSrc)) {
    copyDir(tempSrc, tempDest);
    console.log(`  ${green}✓${reset} Installed .catalyst/main/temp/ (doc templates)`);
  }

  // User-owned config: create ONLY if missing — never clobber a customized
  // project-config.yaml (branch settings, voice.language, agent_id, etc.) on update.
  const pcDest = path.join(cwd, '.catalyst/main/project-config.yaml');
  if (!fs.existsSync(pcDest)) {
    if (copyFile(path.join(src, '.catalyst/main/project-config.yaml'), pcDest)) {
      console.log(`  ${green}✓${reset} Installed .catalyst/main/project-config.yaml`);
    }
  } else {
    console.log(`  ${dim}•${reset} Kept existing .catalyst/main/project-config.yaml`);
  }

  // Install voice runtime (zero-dependency local meeting daemon for /meet-spec)
  const voiceSrc = path.join(src, '.catalyst', 'voice');
  const voiceDest = path.join(catalystDir, 'voice');
  if (fs.existsSync(voiceSrc)) {
    copyDir(voiceSrc, voiceDest);
    console.log(`  ${green}✓${reset} Installed .catalyst/voice/`);
  }

  // Create specs directory if it doesn't exist
  const specsDir = path.join(catalystDir, 'specs');
  if (!fs.existsSync(specsDir)) {
    fs.mkdirSync(specsDir, { recursive: true });
    console.log(`  ${green}✓${reset} Created .catalyst/specs/`);
  }

  // Create a local secrets file (git-ignored) if it doesn't exist yet.
  // Optional — only needed for voice meetings (/meet-spec).
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

  // Safety belt: ensure the local secrets file can never be committed.
  ensureGitignore(cwd);

  // Install AGENTS.md
  const agentsMdSrc = path.join(src, 'AGENTS.md');
  const agentsMdDest = path.join(cwd, 'AGENTS.md');
  if (copyFile(agentsMdSrc, agentsMdDest)) {
    console.log(`  ${green}✓${reset} Installed AGENTS.md`);
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
