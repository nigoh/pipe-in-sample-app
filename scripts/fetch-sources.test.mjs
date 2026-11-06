import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedUrl, htmlToText, extractLinks, cacheName, normalizeForQuote } from "./fetch-sources.mjs";

const domains = ["www.nta.go.jp", "www.mhlw.go.jp"];

test("一覧のサイトの https だけを通す", () => {
  assert.equal(isAllowedUrl("https://www.nta.go.jp/a.htm", domains), true);
  assert.equal(isAllowedUrl("http://www.nta.go.jp/a.htm", domains), false);
  assert.equal(isAllowedUrl("https://example.com/a", domains), false);
  assert.equal(isAllowedUrl("https://www.nta.go.jp.evil.example/a", domains), false);
  assert.equal(isAllowedUrl("not a url", domains), false);
});

test("HTML から本文の文字だけを取り出す（script・style は捨てる）", () => {
  const html = "<html><head><style>p{color:red}</style><script>var x=1</script></head>" +
    "<body><h1>雇用保険料率</h1><p>労働者負担&nbsp;5/1,000&amp;事業主</p></body></html>";
  const text = htmlToText(html);
  assert.match(text, /雇用保険料率/);
  assert.match(text, /労働者負担 5\/1,000&事業主/);
  assert.doesNotMatch(text, /color|var x/);
});

test("リンクは一覧のサイトのものだけを、絶対の URL にしてかぶりなく返す", () => {
  const html = '<a href="/content/001.pdf">PDF</a><a href="/content/001.pdf#p2">同じ</a>' +
    '<a href="https://example.com/x.pdf">よそ</a><a href="page.html">相対</a><a href="mailto:a@b">メール</a>';
  const links = extractLinks(html, "https://www.mhlw.go.jp/stf/index.html", domains);
  assert.deepEqual(links, ["https://www.mhlw.go.jp/content/001.pdf", "https://www.mhlw.go.jp/stf/page.html"]);
});

test("リンクは match を書けば、URL に含む文字で絞る", () => {
  const html = '<a href="/content/001.pdf">a</a><a href="/stf/other.html">b</a>';
  const links = extractLinks(html, "https://www.mhlw.go.jp/", domains, ["/content/"]);
  assert.deepEqual(links, ["https://www.mhlw.go.jp/content/001.pdf"]);
});

test("取ってきた本文の置き場所は、ホストの下の決まった名前にする", () => {
  const a = cacheName("https://www.nta.go.jp/taxes/1410.htm");
  assert.match(a, /^www\.nta\.go\.jp\/[0-9a-f]{12}\.txt$/);
  assert.equal(a, cacheName("https://www.nta.go.jp/taxes/1410.htm"));
  assert.notEqual(a, cacheName("https://www.nta.go.jp/taxes/1199.htm"));
});

test("引用の突き合わせ用に、全角・半角と空白の違いをならす", () => {
  assert.equal(normalizeForQuote("収入金額×30％+80,000円"), normalizeForQuote("収入金額 × 30% + 80,000円"));
  assert.equal(normalizeForQuote("令和８年\n12月１日"), "令和8年12月1日");
});
