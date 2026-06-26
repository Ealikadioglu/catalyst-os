/**
 * Meeting artifact generation for /meet-spec.
 * Writes meeting.md (canonical, for /catalyze-spec) and meeting.html (rendered, for humans).
 */
const fs = require('fs');
const path = require('path');

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// One-pass transcript summarizer (bundled mode, or when no live notes were produced).
const SUMMARY_PROMPT = (topic, transcript) =>
  `You are summarizing a spec-shaping meeting. Convert the transcript below into clean ` +
  `Markdown that another command (/catalyze-spec) will use as the feature request.\n\n` +
  `Write the notes in ENGLISH regardless of the language spoken in the meeting.\n\n` +
  `Output EXACTLY these sections, nothing before or after:\n\n` +
  `# Meeting: ${topic}\n\n## Summary\n(one paragraph)\n\n## Decisions\n(bullet list of ` +
  `decisions reached; "None recorded." if none)\n\n## Action Items\n(bullet list of ` +
  `requirements / things to build)\n\n## Open Questions\n(bullet list of unresolved ` +
  `questions)\n\n## Transcript\n(the full transcript, lightly cleaned)\n\n` +
  `--- TRANSCRIPT ---\n${transcript}`;

// notesHtml is the browser-rendered notes (DIY); falls back to <pre> if absent.
function writeArtifacts({ projectRoot, meetingDir, topic, notesMd, notesHtml, transcriptText, findings }) {
  const dir = path.join(projectRoot, meetingDir);
  fs.mkdirSync(dir, { recursive: true });

  const research = findings && findings.length
    ? '\n\n## Research Findings\n\n' + findings.map((f) => `### ${f.query}\n\n${f.result}`).join('\n\n')
    : '';
  const notesBody = notesMd.startsWith('#') ? notesMd : `# Meeting: ${topic}\n\n${notesMd}`;
  const md = `${notesBody}\n\n## Transcript\n\n${transcriptText}\n${research}`;
  fs.writeFileSync(path.join(dir, 'meeting.md'), md);

  const notesSection = notesHtml || `<pre>${esc(notesMd)}</pre>`;
  const transcriptHtml = transcriptText.split('\n').map((l) => `<p>${esc(l)}</p>`).join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Meeting: ${esc(topic)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:820px;
    margin:40px auto;padding:0 20px;line-height:1.6;color:#1a1a24}
  h1{font-size:24px} h2{font-size:18px;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:4px}
  .notes{background:#faf9ff;border:1px solid #ece8ff;border-radius:10px;padding:18px 22px}
  .transcript p{margin:2px 0;color:#444;font-size:14px}
  code{background:#f3f1fa;padding:2px 5px;border-radius:4px}
</style></head>
<body>
<h1>Meeting: ${esc(topic)}</h1>
<section class="notes">${notesSection}</section>
<h2>Transcript</h2>
<div class="transcript">${transcriptHtml}</div>
</body></html>
`;
  fs.writeFileSync(path.join(dir, 'meeting.html'), html);

  return { mdPath: path.join(meetingDir, 'meeting.md'), htmlPath: path.join(meetingDir, 'meeting.html') };
}

module.exports = { writeArtifacts, SUMMARY_PROMPT };
