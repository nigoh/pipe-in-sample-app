# D0003 公式のページを先に取ってきて、引用を機械で突き合わせる

## 決めたこと

- 調べ物のパイプの1回目で、WebFetch は PDF を読めず（保険料額表・雇用保険料率は PDF にしか無い）、HTML も要約を返すことが分かった。引用が本当にページの文そのままかを、機械で確かめられなかった。
- `scripts/fetch-sources.mjs`（`npm run fetch:sources`）で、公式のページを先に取ってきて、本文の文字を `research/cache/` に置く。Claude を使わない決まった手順で、取るのは `research/official-sources.json` のサイトの https だけ。PDF は `pdftotext`（poppler-utils）で文字にする。出発点は `research/seeds.json` に書き、リンクは1段だけ・40件までたどる。
- パイプの段の中では、Web から取ってくるスクリプトを流さない（pipe-in の守りは、段の Bash で外へ通信するコマンドを止めている。それをすり抜けないため）。取ってくるのは人か、この決まった手順を流す会話。
- `scripts/check-research.mjs` は、報告の表の行の「」の引用が、同じ行の URL の本文にそのまま入っているかも確かめる（NFKC でならし、空白は見ない）。取ってきていない URL も不合格にする。CI でも流すので、`research/cache/` はコミットする（公開の役所の文書の文字だけ。約 0.4MB）。
- Node の `fetch` は、そのままでは手元のプロキシを通らないので、`node --use-env-proxy` で流す。
- 依存は足さない（`pdftotext` は OS の道具。CI では取ってこないので要らない）。

## 受け入れ基準

| ID | 基準 | 確かめ方 |
| --- | --- | --- |
| D0003-AC-01 | 一覧のサイトの https だけを取る。似せたホスト名・http は取らない | `scripts/fetch-sources.test.mjs` |
| D0003-AC-02 | HTML から本文の文字を取り出し、リンクを一覧のサイトだけに絞る | `scripts/fetch-sources.test.mjs` |
| D0003-AC-03 | 表の引用が、取ってきた本文にそのまま無ければ不合格。取っていない URL も不合格 | `scripts/check-research.test.mjs` |
| D0003-AC-04 | 1回目の報告の引用が、取ってきた本文と突き合わせて全部通る | `npm run check:research` |

## 確かめたこと

- `npm run fetch:sources` で31件を取れた（PDF 12件を含む。2026-11-05）。
- 1回目の報告の引用は、URL の書き方の違い（末尾の `index.html`）でずれた5件を取り直したあと、全部が本文にそのまま入っていた。
- まだ：直したパイプで、取れなかった数字を調べ直すこと。

## pipe-in に返すこと

- WebFetch は PDF を読めず、HTML も要約を返す。調べ物の段の引用を逐語で確かめるには、決まった手順で先に取ってくる仕組みが要る。
- 検索（WebSearch）を開けない段では、URL が当て推量になり、開けないことが多い。出発点の URL を人か別の手順が用意する形がよい。
