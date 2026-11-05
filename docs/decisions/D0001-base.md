# D0001 土台：Astro・Cloudflare Pages・調べ物のパイプ

## 決めたこと

- 題材は、2026年の制度改正に合わせた「手取り・年収の壁」の計算サイト。お金は広告とアフィリエイトで得る。目標は月1万円（月2〜3.5万 PV が目安）。
- サイトは Astro（静的な書き出し）と TypeScript で作る。年収ごとのページをたくさん作れて、置き場所の費用がほぼ0円になるため。
- 公開先は Cloudflare Pages。無料で商用の利用が認められている（Vercel の無料プランは商用の利用が禁止。GitHub Pages は商売のためのサイトの置き場所ではない）。GitHub との連携は人が画面でつなぎ、リポジトリに秘密を置かない。
- テストは Node の `node:test` で書く（依存を足さない）。vitest は Astro 7 と一緒に入れると npm が止まった（`Cannot read properties of null (reading 'edgesOut')`）ので使わない。
- 依存の版は固定し、出てから2週間以上たった版を選ぶ（astro 7.4.2・@astrojs/sitemap 3.7.4・@astrojs/check 0.9.12・typescript 6.0.3）。@astrojs/check が typescript 7 に対応していないため 6 にした。
- 制度の数字は、公式のサイトだけを出典にする（`research/official-sources.json`）。まとめ記事は数字が食い違うため。調べ物は pipe-in のパイプ `pipe-in-research` で流し、Web は一覧のサイトへの WebFetch だけに開ける。
- 調べ物の報告は `scripts/check-research.mjs` で機械が確かめる（見出し3つ以上・出典の URL あり・どれも https で一覧のサイトだけ。公式に似せたホスト名も通さない）。パイプの検査と CI の両方で流す。
- 金額の表示は、1円より細かい端数を切り捨てる（手取りを多く見せない）。
- すべてのページに、計算は目安であることと、最終更新日を出す（お金の分野は検索の評価が厳しいため）。

## 受け入れ基準

| ID | 基準 | 確かめ方 |
| --- | --- | --- |
| D0001-AC-01 | 金額を「1,234,567円」の形で出し、端数は切り捨て、数でない値は誤りにする | `src/lib/format.test.ts` |
| D0001-AC-02 | 調べ物の報告で、見出し・出典の有無・公式でないサイト・http を見分ける | `scripts/check-research.test.mjs` |
| D0001-AC-03 | テスト・型検査・ビルドが CI で通る | `.github/workflows/ci.yml` |
| D0001-AC-04 | 調べ物のパイプの定義が pipe-in の検査を通る | `pipe-in-gen check research --project .` |

## 確かめたこと

- 手元で `npm test`（10件）・`npm run typecheck`・`npm run build`・`pipe-in-gen check research` が通った（2026-11-05）。
- まだ：CI が GitHub の上で通るか。Cloudflare Pages の連携（人がする）。調べ物のパイプを実際に流すこと（利用料がかかる）。

## 残った問い

- 独自ドメインと、広告・計測の道具の選び。
- 題材を Web で探すパイプ（WebSearch を開ける範囲）。
- 作った評価（時間・利用料・人が手を入れた回数・差し戻し）を pipe-in に返す形。

## 追記（CI）

- GitHub Actions の actions は、pipe-in と同じく完全なコミットの SHA で固定する（書き換えられた版の名前を引かないため）。runner も `ubuntu-24.04` に固定する。
- このリポジトリは非公開なので、Actions はアカウントの利用枠（分数）を使う。初めの CI は、job が runner を割り当てられないまま2秒で落ちた（SHA で固定しても同じ）。利用枠か支払いの上限に当たったと見ている（まだ確かめていない。人が GitHub の設定の Billing で確かめる）。
