#!/usr/bin/env node
/**
 * check:rails — the agent rails must not drift between Claude and Cursor.
 *
 * This repo's whole philosophy is sync-don't-hand-write. That applies to the agent
 * layer too: every skill and every design role exists twice, once per tool. Without a
 * gate, the two copies rot apart and the tools start giving different advice.
 *
 *   Skills  (.claude/skills/<x>/SKILL.md  ↔  .cursor/skills/<x>/SKILL.md)
 *     must be byte-identical.
 *
 *   Roles   (.claude/agents/<x>.md  ↔  .cursor/rules/role-<x>.mdc)
 *     must match in body. Frontmatter differs by design (Claude carries tools/model,
 *     Cursor carries description/alwaysApply), and the Cursor copy opens with a
 *     "> Cursor note." blockquote explaining what that tool cannot enforce. Both are
 *     stripped before comparing.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const problems = [];

/**
 * Discover roles from BOTH sides rather than hardcoding a list — otherwise a role added
 * later is silently unguarded while the run still reports "ok", which is worse than no
 * check at all. Taking the union also catches a Cursor rule with no Claude counterpart.
 */
function discoverRoles() {
  const names = new Set();
  const agentsDir = join(ROOT, ".claude/agents");
  if (existsSync(agentsDir)) {
    for (const f of readdirSync(agentsDir)) {
      if (f.endsWith(".md")) names.add(f.replace(/\.md$/, ""));
    }
  }
  const rulesDir = join(ROOT, ".cursor/rules");
  if (existsSync(rulesDir)) {
    for (const f of readdirSync(rulesDir)) {
      if (f.startsWith("role-") && f.endsWith(".mdc")) {
        names.add(f.replace(/^role-/, "").replace(/\.mdc$/, ""));
      }
    }
  }
  return [...names].sort();
}

const ROLES = discoverRoles();

/** Drop a leading `---\n...\n---` frontmatter block. */
function stripFrontmatter(text) {
  const lines = text.split("\n");
  if (lines[0]?.trim() !== "---") return text;
  const end = lines.indexOf("---", 1);
  return end === -1 ? text : lines.slice(end + 1).join("\n");
}

/** Drop the leading `> ...` Cursor note and any blank lines around it. */
function stripLeadingBlockquote(text) {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (!lines[i]?.startsWith(">")) return text;
  while (i < lines.length && (lines[i].startsWith(">") || lines[i].trim() === "")) i++;
  return lines.slice(i).join("\n");
}

const normalize = (text) => text.trim().replace(/\r\n/g, "\n");

function firstDifferingLine(a, b) {
  const as = a.split("\n");
  const bs = b.split("\n");
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    if (as[i] !== bs[i]) {
      return `line ${i + 1}\n      claude: ${JSON.stringify(as[i] ?? "<eof>")}\n      cursor: ${JSON.stringify(bs[i] ?? "<eof>")}`;
    }
  }
  return "trailing whitespace only";
}

// --- skills: byte-identical ------------------------------------------------
const skillsDir = join(ROOT, ".claude/skills");
const skills = existsSync(skillsDir)
  ? readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

for (const skill of skills) {
  const claude = join(ROOT, ".claude/skills", skill, "SKILL.md");
  const cursor = join(ROOT, ".cursor/skills", skill, "SKILL.md");
  if (!existsSync(claude)) continue;
  if (!existsSync(cursor)) {
    problems.push(`skill "${skill}" has no Cursor mirror — expected .cursor/skills/${skill}/SKILL.md`);
    continue;
  }
  const a = normalize(readFileSync(claude, "utf8"));
  const b = normalize(readFileSync(cursor, "utf8"));
  if (a !== b) {
    problems.push(`skill "${skill}" differs between .claude and .cursor at ${firstDifferingLine(a, b)}`);
  }
}

// --- roles: body must match ------------------------------------------------
for (const role of ROLES) {
  const claude = join(ROOT, ".claude/agents", `${role}.md`);
  const cursor = join(ROOT, ".cursor/rules", `role-${role}.mdc`);
  if (!existsSync(claude)) {
    problems.push(`role "${role}" missing .claude/agents/${role}.md`);
    continue;
  }
  if (!existsSync(cursor)) {
    problems.push(`role "${role}" missing .cursor/rules/role-${role}.mdc`);
    continue;
  }
  const a = normalize(stripFrontmatter(readFileSync(claude, "utf8")));
  const b = normalize(stripLeadingBlockquote(stripFrontmatter(readFileSync(cursor, "utf8"))));
  if (a !== b) {
    problems.push(`role "${role}" body differs between Claude and Cursor at ${firstDifferingLine(a, b)}`);
  }

  // A reviewer that can edit is not a reviewer. Assert it for ANY role that reviews,
  // not just today's `ui-reviewer` — the point survives renames and new review roles.
  if (/review/.test(role)) {
    const fm = readFileSync(claude, "utf8").split("---")[1] ?? "";
    const tools = /^tools:\s*(.+)$/m.exec(fm)?.[1] ?? "";
    if (/\b(Edit|Write|NotebookEdit)\b/.test(tools)) {
      problems.push(`role "${role}" reviews, so it must not be granted Edit/Write — it audits, it does not fix (tools: ${tools})`);
    }
  }
}

if (problems.length > 0) {
  console.error("check:rails — agent rails have drifted\n");
  for (const p of problems) console.error(`  ✗ ${p}\n`);
  console.error("Fix: edit the .claude copy, then mirror it to .cursor (body identical,");
  console.error("frontmatter and the Cursor note blockquote are the only allowed differences).");
  process.exit(1);
}

console.log(`check:rails — ok (${skills.length} skills, ${ROLES.length} roles mirrored)`);
