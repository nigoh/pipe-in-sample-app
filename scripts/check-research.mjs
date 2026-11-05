// 調べ物の報告（docs/research/report.md）を機械で確かめる。
// 合格の条件：「## 」の見出しが3つ以上・出典の URL が1つ以上・URL はどれも https で公式のサイトだけ。
// 使い方: node scripts/check-research.mjs <報告のファイル>（合格なら終了コード 0）
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL_RE = /\bhttps?:\/\/[^\s)）>」\]]+/g;

export function checkReport(text, allowedDomains) {
  const problems = [];
  const headings = text.split(/\r?\n/).filter((l) => l.startsWith("## ")).length;
  if (headings < 3) {
    problems.push(`「## 」の見出しが ${headings} 個です（結論・根拠・分からないことの3つ以上が要ります）`);
  }
  const urls = text.match(URL_RE) ?? [];
  if (urls.length === 0) {
    problems.push("出典の URL がありません");
  }
  const allowed = new Set(allowedDomains);
  for (const raw of urls) {
    let u;
    try {
      u = new URL(raw);
    } catch {
      problems.push(`URL の形が正しくありません: ${raw}`);
      continue;
    }
    if (u.protocol !== "https:") {
      problems.push(`https でない URL です: ${raw}`);
    } else if (!allowed.has(u.hostname)) {
      problems.push(`公式の一覧（research/official-sources.json）に無いサイトです: ${u.hostname}`);
    }
  }
  return { ok: problems.length === 0, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? "docs/research/report.md";
  if (!existsSync(file)) {
    console.error(`報告がありません: ${file}`);
    process.exit(1);
  }
  const listFile = new URL("../research/official-sources.json", import.meta.url);
  const { domains } = JSON.parse(readFileSync(listFile, "utf8"));
  const r = checkReport(readFileSync(file, "utf8"), domains);
  for (const p of r.problems) console.error(`- ${p}`);
  process.exit(r.ok ? 0 : 1);
}
