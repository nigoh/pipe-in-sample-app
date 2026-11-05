# D0002 公開を Cloudflare Workers の静的なファイルの配信にする

## 決めたこと

- Cloudflare とつないだら、Pages ではなく Workers のプロジェクトとして作られ、ビルドが `npx wrangler deploy` を流す形になった（今の Cloudflare の標準）。D0001 の「Cloudflare Pages」を、この形に読み替える。無料で商用の利用が認められている点は同じ。
- `wrangler.jsonc` を置き、`assets.directory` に `./dist` を書く。Worker のコードは持たない。設定が無いと `Missing entry-point to Worker script or to assets directory` で落ちた（初めのビルド）。
- wrangler は依存に足さない。wrangler 4.152.0 以前には npm の監査の注意（miniflare が使う undici）があり、直った版は出てから2週間たっていなかった。Cloudflare のビルドは `npx wrangler deploy` でその場で wrangler を取るので、リポジトリに要るのは設定だけになる。
- `public/_headers` は Workers の静的なファイルの配信でも効くので、そのまま使う。

## 受け入れ基準

| ID | 基準 | 確かめ方 |
| --- | --- | --- |
| D0002-AC-01 | `npm run build` のあと、`npx wrangler deploy --dry-run` が `dist` を読んで通る | 手元で流す |
| D0002-AC-02 | main に入れると、Cloudflare のビルドが通り、サイトが見られる | 人が Cloudflare の画面で見る |

## 確かめたこと

- 設定が無いと手元の `--dry-run` でも同じ誤りで落ち、`wrangler.jsonc` を置くと `dist` の3つのファイルを読んで通った（wrangler 4.158.0。2026-11-05）。
- まだ：Cloudflare の上のビルド（main に入れたあと）。
