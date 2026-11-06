// 公式のサイトのページを取ってきて、本文の文字を research/cache/ に置く（D0003）。
// Claude を使わない決まった手順。取ってよいのは research/official-sources.json のサイトの https だけ。
// PDF は pdftotext（poppler-utils）で文字にする。
// 使い方: npm run fetch:sources            … research/seeds.json の URL と、そこからたどれるリンクを取る
//         npm run fetch:sources -- <URL>…  … 渡した URL だけを取る（調べ物の段が「取ってきてほしい URL」に書いたもの）
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function isAllowedUrl(raw, domains) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  return u.protocol === "https:" && domains.includes(u.hostname);
}

const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

export function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6]|table|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .split("\n")
    .map((l) => l.replace(/[ \t　]+/g, " ").trim())
    .filter((l) => l.length > 0)
    .join("\n");
}

export function extractLinks(html, baseUrl, domains, match = []) {
  const out = [];
  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    let u;
    try {
      u = new URL(m[1], baseUrl);
    } catch {
      continue;
    }
    u.hash = "";
    const s = u.toString();
    if (!isAllowedUrl(s, domains)) continue;
    if (match.length > 0 && !match.some((k) => s.includes(k))) continue;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

export function cacheName(url) {
  const u = new URL(url);
  const h = createHash("sha256").update(url).digest("hex").slice(0, 12);
  return `${u.hostname}/${h}.txt`;
}

export function normalizeForQuote(text) {
  return text.normalize("NFKC").replace(/\s+/g, "");
}

function pdfToText(buf) {
  return new Promise(async (resolve, reject) => {
    const dir = await mkdtemp(join(tmpdir(), "fetch-sources-"));
    const file = join(dir, "in.pdf");
    await writeFile(file, buf);
    execFile("pdftotext", ["-layout", "-enc", "UTF-8", file, "-"], { maxBuffer: 64 * 1024 * 1024 }, async (err, stdout) => {
      await rm(dir, { recursive: true, force: true });
      if (err) reject(new Error(`pdftotext で読めませんでした（poppler-utils が要ります）: ${err.message}`));
      else resolve(stdout);
    });
  });
}

async function fetchOne(url) {
  const res = await fetch(url, { headers: { "user-agent": "pipe-in-sample-app fetch-sources" }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (type.includes("pdf") || url.toLowerCase().endsWith(".pdf")) {
    return { type: "pdf", text: await pdfToText(buf), html: null };
  }
  const html = buf.toString("utf8");
  return { type: "html", text: htmlToText(html), html };
}

async function main(argv) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const { domains } = JSON.parse(await readFile(join(root, "research/official-sources.json"), "utf8"));
  const cacheDir = join(root, "research/cache");
  const indexFile = join(cacheDir, "index.json");
  const index = existsSync(indexFile) ? JSON.parse(await readFile(indexFile, "utf8")) : {};

  // 取る URL の一覧：引数があればそれだけ、無ければ seeds.json とそのリンク
  const jobs = [];
  if (argv.length > 0) {
    for (const url of argv) jobs.push({ url, follow: false, match: [] });
  } else {
    const { seeds } = JSON.parse(await readFile(join(root, "research/seeds.json"), "utf8"));
    for (const s of seeds) jobs.push({ url: s.url, follow: Boolean(s.follow), match: s.match ?? [] });
  }

  const done = new Set();
  let failed = 0;
  const save = async (url) => {
    if (done.has(url)) return null;
    done.add(url);
    if (!isAllowedUrl(url, domains)) {
      console.error(`× 一覧に無いサイトなので取りません: ${url}`);
      failed++;
      return null;
    }
    try {
      const got = await fetchOne(url);
      const name = cacheName(url);
      await mkdir(dirname(join(cacheDir, name)), { recursive: true });
      await writeFile(join(cacheDir, name), `出典: ${url}\n\n${got.text}\n`, "utf8");
      index[url] = { file: name, type: got.type, fetchedAt: new Date().toISOString().slice(0, 10) };
      console.log(`✓ ${url} → research/cache/${name}`);
      return got;
    } catch (e) {
      console.error(`× ${url}: ${e.message}`);
      failed++;
      return null;
    }
  };

  for (const job of jobs) {
    const got = await save(job.url);
    if (job.follow && got?.html) {
      const links = extractLinks(got.html, job.url, domains, job.match).slice(0, 40); // たどるのは1段だけ・40件まで
      for (const link of links) await save(link);
    }
  }

  const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(indexFile, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  console.log(`取った: ${done.size - failed} 件・取れなかった: ${failed} 件`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
