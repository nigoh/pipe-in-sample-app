import { test } from "node:test";
import assert from "node:assert/strict";
import { checkReport } from "./check-research.mjs";

const allowed = ["www.nta.go.jp", "www.mhlw.go.jp"];
const good = [
  "# 報告",
  "## 結論",
  "基礎控除は…（出典: https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1199.htm ）",
  "## 根拠",
  "- https://www.mhlw.go.jp/stf/index.html",
  "## 分からないこと",
  "- なし",
].join("\n");

test("見出しが3つ以上あり、出典が公式のサイトだけなら合格", () => {
  assert.deepEqual(checkReport(good, allowed), { ok: true, problems: [] });
});

test("見出しが3つに足りなければ不合格", () => {
  const r = checkReport("## 結論\nhttps://www.nta.go.jp/a\n## 根拠\n", allowed);
  assert.equal(r.ok, false);
  assert.match(r.problems.join("\n"), /見出し/);
});

test("出典の URL が1つも無ければ不合格", () => {
  const r = checkReport("## a\n## b\n## c\n", allowed);
  assert.equal(r.ok, false);
  assert.match(r.problems.join("\n"), /出典/);
});

test("公式でないサイトの URL があれば、そのホストを挙げて不合格", () => {
  const r = checkReport(good + "\n- https://example.com/matome", allowed);
  assert.equal(r.ok, false);
  assert.match(r.problems.join("\n"), /example\.com/);
});

test("公式のホストに似せた名前（後ろに足したもの）は通さない", () => {
  const r = checkReport(good + "\n- https://www.nta.go.jp.evil.example/x", allowed);
  assert.equal(r.ok, false);
});

test("http（暗号化なし）の URL は不合格", () => {
  const r = checkReport(good + "\n- http://www.nta.go.jp/x", allowed);
  assert.equal(r.ok, false);
  assert.match(r.problems.join("\n"), /https/);
});

// ---- 引用が、取ってきた本文にそのまま入っているか（D0003） ----
import { extractQuotes, checkQuotes } from "./check-research.mjs";

test("表の行から、URL と「」の引用を組で取り出す（入れ子の「」も1つの引用として扱う）", () => {
  const md = [
    "| 項目 | 値 | 出典 | 引用 |",
    "|---|---|---|---|",
    "| 支援金率 | 0.23 | https://www.kyoukaikenpo.or.jp/a/003 | 「令和8年4月分（5月納付分）から 0.23％」 |",
    "| 扶養 | － | https://www.kyoukaikenpo.or.jp/b | 「「収入要件」に該当した場合」 |",
    "本文の「引用ではない」文",
  ].join("\n");
  assert.deepEqual(extractQuotes(md), [
    { urls: ["https://www.kyoukaikenpo.or.jp/a/003"], quote: "令和8年4月分（5月納付分）から 0.23％" },
    { urls: ["https://www.kyoukaikenpo.or.jp/b"], quote: "「収入要件」に該当した場合" },
  ]);
});

test("引用が取ってきた本文にあれば合格（全角・半角と空白の違いは見ない）", () => {
  const md = "| a | https://www.nta.go.jp/x | 「収入金額×30％+80,000円」 |";
  const cache = (url) => (url === "https://www.nta.go.jp/x" ? "表 収入金額 × 30% + 80,000円 まで" : null);
  assert.deepEqual(checkQuotes(md, cache), []);
});

test("引用が本文に無ければ、その引用と URL を挙げて不合格", () => {
  const md = "| a | https://www.nta.go.jp/x | 「基礎控除は100万円」 |";
  const problems = checkQuotes(md, () => "基礎控除は95万円");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /基礎控除は100万円/);
  assert.match(problems[0], /www\.nta\.go\.jp\/x/);
});

test("出典の本文を取ってきていなければ不合格（npm run fetch:sources を促す）", () => {
  const md = "| a | https://www.nta.go.jp/x | 「何か」 |";
  const problems = checkQuotes(md, () => null);
  assert.match(problems.join("\n"), /fetch:sources/);
});
