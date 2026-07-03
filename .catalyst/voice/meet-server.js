#!/usr/bin/env node
/**
 * Local voice-meeting daemon for /meet-spec.
 *
 * Zero npm dependencies: Node stdlib + global fetch (Node >= 18) + child_process.
 *
 * Two modes (project-config voice.mode):
 *   diy      — browser Web Speech (free) + local `claude -p` brain. No ElevenLabs, no cost.
 *   bundled  — ElevenLabs Conversational AI (better voice, per-minute cost).
 *
 * Responsibilities:
 *   GET  /              serve the project hub (landing: chat or meeting + dashboard)
 *   GET  /meeting       serve the voice meeting room page (diy or bundled)
 *   GET  /chat          serve the text-only "chat with project" page
 *   GET  /dashboard     serve the generated .catalyst/dashboard.html (404 if not built)
 *   GET  /config        non-secret config for the browser (mode, agentId, language, topic, project)
 *   GET  /signed-url     bundled: mint an ElevenLabs signed URL (key stays server-side)
 *   POST /turn          one conversational turn via headless `claude -p` (kind: meeting|chat)
 *   POST /tool          bundled: live codebase investigation via headless `claude -p`
 *   POST /end           fold transcript (+ findings) into meeting.md, then shut down
 *
 * The ElevenLabs API key (bundled only) is read from .catalyst/secrets.local.yaml and
 * never leaves this process (not the browser, not argv, not the environment).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { writeArtifacts, SUMMARY_PROMPT } = require('./artifact');

const PROJECT_ROOT = process.cwd();
const PORT = parseInt(process.env.PORT || '4399', 10);
const MEETING_DIR = process.env.MEETING_DIR || '.catalyst/meetings/untitled';
const MEETING_TOPIC = process.env.MEETING_TOPIC || 'Untitled meeting';

// Read-only tool whitelist for headless claude runs. Non-listed tools are
// auto-denied in -p mode, so there are no interactive permission hangs.
const CLAUDE_TOOLS = 'Read,Grep,Glob,Task,WebSearch,WebFetch';

// --- Config / secrets (minimal YAML reads, no parser dependency) ---

function readScalar(relPath, key) {
  try {
    const txt = fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
    const m = txt.match(new RegExp('^\\s*' + key + ':\\s*["\']?([^"\'\\n]*)["\']?', 'm'));
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

const API_KEY = readScalar('.catalyst/secrets.local.yaml', 'elevenlabs_api_key');
const AGENT_ID = readScalar('.catalyst/main/project-config.yaml', 'agent_id');
const VOICE_ID = readScalar('.catalyst/main/project-config.yaml', 'voice_id');
const LANGUAGE = readScalar('.catalyst/main/project-config.yaml', 'language') || 'en';
// bundled = ElevenLabs Conversational AI; diy = browser speech + local claude -p (free).
const MODE = readScalar('.catalyst/main/project-config.yaml', 'mode') || 'bundled';
const HTML_PATH = path.join(__dirname, MODE === 'diy' ? 'meeting-diy.html' : 'meeting.html');
const HUB_PATH = path.join(__dirname, 'hub.html');
const CHAT_PATH = path.join(__dirname, 'chat.html');
const DASHBOARD_PATH = path.join(PROJECT_ROOT, '.catalyst', 'dashboard.html');

// Project name + tagline for the hub header. Best-effort: never throws, degrades to blanks.
function readProjectInfo() {
  const name = path.basename(PROJECT_ROOT);
  let tagline = '';
  try {
    const mission = fs.readFileSync(path.join(PROJECT_ROOT, '.catalyst/main/mission.md'), 'utf8');
    // First non-heading, non-empty line under a "## Vision" section, else first prose line.
    const vision = mission.split(/^##\s+Vision\b.*$/im)[1];
    const scope = (vision || mission).split('\n');
    tagline = (scope.find((l) => l.trim() && !l.trim().startsWith('#')) || '').trim();
  } catch {
    /* no mission.md — leave tagline blank */
  }
  return { name, tagline };
}

const SPEAK_LANG = LANGUAGE === 'tr' ? 'Turkish' : "the user's language";

// In DIY mode the "agent" is claude -p itself, driven turn by turn. Two personas:
// a spoken spec-shaping interviewer (voice meeting) and a written thinking partner (chat).
const PERSONA_MEETING =
  `You are Catalyst, a spec-shaping interviewer for this software project. Hold a focused, ` +
  `friendly spoken meeting that turns a rough idea into a clear feature specification. ` +
  `Speak in ${SPEAK_LANG}. Ask ONE question at a ` +
  `time and keep each spoken turn short (1-3 sentences). You have full read access to this ` +
  `repository, its documentation, and web search — use them to ground your questions and ` +
  `answers; never guess about the code. Drive toward: the problem, scope, concrete ` +
  `requirements, key decisions, and action items. Be patient: if the user is brief or silent, ` +
  `wait — never nag with "are you there?".\n\n` +
  `OUTPUT FORMAT (strict, every turn): first your spoken words ONLY (no markdown). Then a ` +
  `line containing exactly ===NOTES=== . Then the running meeting notes in Markdown, IN ` +
  `ENGLISH, cumulative (carry forward everything so far and refine it), with these sections:\n` +
  `## Summary\n## Decisions\n## Action Items\n## Open Questions\n` +
  `The spoken part is for text-to-speech; the notes part is never spoken.`;

const PERSONA_CHAT =
  `You are Catalyst, a thinking partner for this software project. The user wants to talk ` +
  `through their vision, ideas, and things they'd like to build — this is an open written ` +
  `conversation, not a formal interview. Help them clarify direction, surface trade-offs, ` +
  `and connect ideas to what already exists. Reply in ${SPEAK_LANG}. You have full read ` +
  `access to this repository, its documentation, and web search — use them to ground the ` +
  `conversation; never guess about the code. Respond like a sharp collaborator: you may ask ` +
  `questions, but you don't have to limit yourself to one, and you don't have to drive ` +
  `toward a spec unless the user does.\n\n` +
  `OUTPUT FORMAT (strict, every turn): first your conversational reply as plain text (no ` +
  `markdown headers or bullet lists). Then a line containing exactly ===NOTES=== . Then ` +
  `running notes in Markdown, IN ENGLISH, cumulative (carry forward everything so far and ` +
  `refine it), with these sections:\n` +
  `## Summary\n## Ideas\n## Decisions\n## Open Questions\n## Next Steps\n` +
  `The reply part is shown in the chat; the notes part is saved as the artifact.`;

const NOTES_DELIM = '===NOTES===';

// Live investigation findings, folded into the artifact at the end.
const findings = [];
// DIY conversation session (claude -p --resume keeps context across turns).
let sessionId = null;
// Latest running notes (Markdown) maintained across DIY turns.
let latestNotes = '';

// --- Headless claude bridge ---

function runClaude(prompt, timeoutMs) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn('claude', ['-p', '--allowedTools', CLAUDE_TOOLS], {
        cwd: PROJECT_ROOT,
      });
    } catch (e) {
      return resolve(`(could not start claude: ${e.message})`);
    }
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(out.trim() || '(investigation timed out)');
    }, timeoutMs);

    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve(`(claude not available: ${e.message})`);
    });
    child.on('close', () => {
      clearTimeout(timer);
      resolve(out.trim() || err.trim() || '(no output)');
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// One conversational turn for DIY mode. Uses --resume to keep context (and the
// codebase warm) across turns; the persona is sent only on the first turn.
function claudeTurn(userText, kind) {
  return new Promise((resolve) => {
    const args = ['-p', '--output-format', 'json', '--allowedTools', CLAUDE_TOOLS];
    if (sessionId) args.push('--resume', sessionId);
    const persona = kind === 'chat' ? PERSONA_CHAT : PERSONA_MEETING;
    const prompt = sessionId
      ? userText
      : `${persona}\n\nThe topic is: ${MEETING_TOPIC}\n\nUser: ${userText}`;
    let child;
    try {
      child = spawn('claude', args, { cwd: PROJECT_ROOT });
    } catch (e) {
      return resolve({ reply: `(claude unavailable: ${e.message})`, notes: latestNotes });
    }
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(splitTurn(out) || { reply: '(timed out)', notes: latestNotes });
    }, 150000);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ reply: `(claude unavailable: ${e.message})`, notes: latestNotes });
    });
    child.on('close', () => {
      clearTimeout(timer);
      let result = out.trim();
      try {
        const j = JSON.parse(out);
        result = (j.result || '').trim();
        if (j.session_id) sessionId = j.session_id;
      } catch {
        /* non-JSON output: fall back to raw text */
      }
      resolve(splitTurn(result) || { reply: err.trim() || '(no response)', notes: latestNotes });
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// Split a turn's result into spoken reply + running notes. Updates latestNotes.
// If the delimiter is missing, treat everything as the reply and keep prior notes.
function splitTurn(result) {
  if (!result) return null;
  const i = result.indexOf(NOTES_DELIM);
  if (i < 0) return { reply: result.trim(), notes: latestNotes };
  const reply = result.slice(0, i).trim();
  const notes = result.slice(i + NOTES_DELIM.length).trim();
  if (notes) latestNotes = notes;
  return { reply: reply || '(no response)', notes: latestNotes };
}

// --- HTTP helpers ---

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// --- Server ---

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  // Static page routes: hub (landing), meeting room, chat, and the generated dashboard.
  const PAGES = {
    '/': HUB_PATH,
    '/meeting': HTML_PATH,
    '/chat': CHAT_PATH,
    '/dashboard': DASHBOARD_PATH,
  };
  if (req.method === 'GET' && PAGES[url]) {
    fs.readFile(PAGES[url], (e, buf) => {
      if (e) {
        res.writeHead(url === '/dashboard' ? 404 : 500);
        res.end(url === '/dashboard' ? 'dashboard.html not generated yet' : 'page not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(buf);
      }
    });
    return;
  }

  if (req.method === 'GET' && url === '/config') {
    const { name, tagline } = readProjectInfo();
    return sendJson(res, 200, {
      mode: MODE,
      agentId: AGENT_ID,
      voiceId: VOICE_ID,
      topic: MEETING_TOPIC,
      language: LANGUAGE,
      project: name,
      tagline,
      hasDashboard: fs.existsSync(DASHBOARD_PATH),
    });
  }

  if (req.method === 'GET' && url === '/signed-url') {
    if (!API_KEY || !AGENT_ID) {
      return sendJson(res, 200, { signedUrl: null });
    }
    try {
      const r = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
        { headers: { 'xi-api-key': API_KEY } }
      );
      const j = await r.json();
      return sendJson(res, 200, { signedUrl: j.signed_url || null });
    } catch (e) {
      return sendJson(res, 200, { signedUrl: null, error: e.message });
    }
  }

  if (req.method === 'POST' && url === '/tool') {
    const { query } = await readBody(req);
    if (!query) return sendJson(res, 400, { result: '(empty query)' });
    const prompt =
      `You are assisting a live spec meeting. Investigate this codebase and answer ` +
      `concisely (max ~150 words), citing files where useful. Question: ${query}`;
    const result = await runClaude(prompt, 120000);
    findings.push({ query, result });
    return sendJson(res, 200, { result });
  }

  if (req.method === 'POST' && url === '/turn') {
    const { text, kind } = await readBody(req);
    if (!text) return sendJson(res, 400, { reply: '', notes: latestNotes });
    const { reply, notes } = await claudeTurn(text, kind);
    return sendJson(res, 200, { reply, notes });
  }

  if (req.method === 'POST' && url === '/end') {
    const { transcript, notesMd, notesHtml } = await readBody(req);
    const text = (transcript || '').trim() || '(empty transcript)';
    // Prefer the notes maintained live during the meeting; otherwise summarize the
    // transcript in one pass (bundled mode, or if no notes were produced).
    let notes = (notesMd || latestNotes || '').trim();
    if (!notes) notes = await runClaude(SUMMARY_PROMPT(MEETING_TOPIC, text), 180000);
    const { mdPath, htmlPath } = writeArtifacts({
      projectRoot: PROJECT_ROOT,
      meetingDir: MEETING_DIR,
      topic: MEETING_TOPIC,
      notesMd: notes,
      notesHtml,
      transcriptText: text,
      findings,
    });
    sendJson(res, 200, { path: mdPath, htmlPath });
    console.log(`\n  ✓ Meeting artifacts written:\n    ${mdPath}\n    ${htmlPath}`);
    setTimeout(() => server.close(() => process.exit(0)), 500);
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`\n  Catalyst project hub: http://localhost:${PORT}`);
  console.log(`  Chat or meeting  ·  Topic: ${MEETING_TOPIC}  ·  Mode: ${MODE}  ·  Language: ${LANGUAGE}`);
  if (MODE === 'diy') {
    console.log('  DIY mode: browser speech + local claude -p (no ElevenLabs, no cost).');
  } else {
    if (!API_KEY) console.log('  ⚠ No elevenlabs_api_key in .catalyst/secrets.local.yaml');
    if (!AGENT_ID) console.log('  ⚠ No voice.agent_id in project-config.yaml');
  }
});
