// 調べ物の報告（docs/research/report.md）を機械で確かめる。
// 合格の条件：「## 」の見出しが3つ以上・出典の URL が1つ以上・URL はどれも https で公式のサイトだけ。
// 使い方: node scripts/check-research.mjs <報告のファイル>（合格なら終了コード 0）
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeForQuote } from "./fetch-sources.mjs";

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

// 表の行（| で始まる行）から、出典の URL と「」の引用を組で取り出す。「」の入れ子は外側の1つとして扱う。
export function extractQuotes(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trimStart().startsWith("|")) continue;
    const urls = (line.match(URL_RE) ?? []).filter((u) => u.startsWith("https://"));
    if (urls.length === 0) continue;
    let depth = 0;
    let buf = "";
    for (const ch of line) {
      if (ch === "「") {
        if (depth > 0) buf += ch;
        depth++;
      } else if (ch === "」" && depth > 0) {
        depth--;
        if (depth === 0) {
          out.push({ urls, quote: buf });
          buf = "";
        } else buf += ch;
      } else if (depth > 0) buf += ch;
    }
  }
  return out;
}

// 引用が、取ってきた本文（cache(url) が返す文字）にそのまま入っているかを確かめる（D0003）。
export function checkQuotes(text, cache) {
  const problems = [];
  for (const { urls, quote } of extractQuotes(text)) {
    const bodies = urls.map((u) => cache(u)).filter((b) => b != null);
    if (bodies.length === 0) {
      problems.push(`出典の本文を取ってきていません（npm run fetch:sources -- ${urls.join(" ")}）: 「${quote}」`);
      continue;
    }
    const q = normalizeForQuote(quote);
    if (!bodies.some((b) => normalizeForQuote(b).includes(q))) {
      problems.push(`引用が出典の本文に見つかりません: 「${quote}」（${urls.join(" ")}）`);
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? "docs/research/report.md";
  if (!existsSync(file)) {
    console.error(`報告がありません: ${file}`);
    process.exit(1);
  }
  const listFile = new URL("../research/official-sources.json", import.meta.url);
  const { domains } = JSON.parse(readFileSync(listFile, "utf8"));
  const text = readFileSync(file, "utf8");
  const r = checkReport(text, domains);
  // 引用の突き合わせ：research/cache/index.json の本文と比べる
  const indexFile = new URL("../research/cache/index.json", import.meta.url);
  const index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, "utf8")) : {};
  const cache = (url) => {
    const e = index[url];
    return e ? readFileSync(new URL(`../research/cache/${e.file}`, import.meta.url), "utf8") : null;
  };
  const problems = [...r.problems, ...checkQuotes(text, cache)];
  for (const p of problems) console.error(`- ${p}`);
  process.exit(problems.length === 0 ? 0 : 1);
}
