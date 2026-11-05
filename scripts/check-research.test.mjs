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
