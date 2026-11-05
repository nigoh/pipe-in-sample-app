# 公開のしかた（Cloudflare Workers）

公開先は Cloudflare です。無料のプランで商用の利用（広告を載せること）が認められているため選びました（D0001）。
今の Cloudflare は、Git とつなぐと Workers のプロジェクトとして作ります。サイトは静的なファイルだけなので、Worker のコードは持たず、`npm run build` が書き出した `dist/` をそのまま配ります（設定は `wrangler.jsonc`。D0002）。
リポジトリに秘密を置かないように、GitHub との連携は Cloudflare の画面で人がつなぎます。つないだあとは、main に入るたびに自動で公開されます。

## 人がすること（1回だけ）

1. Cloudflare のダッシュボードで、Workers & Pages → 作る → Git のリポジトリから、このリポジトリをつなぐ。
2. ビルドの設定を次にする。

| 項目 | 値 |
| --- | --- |
| プロジェクトの名前 | `pipe-in-sample-app`（`wrangler.jsonc` の `name` と同じにする） |
| ビルドのコマンド | `npm run build` |
| デプロイのコマンド | `npx wrangler deploy` |
| ルートのディレクトリ | `/` |
| 本番の枝 | `main` |
| 環境変数 `SITE_URL` | 独自ドメインが決まったら、その URL（例: `https://example.jp`）。決まるまでは入れない |

3. 独自ドメインを決めたら、カスタムドメインに足し、`SITE_URL` を入れて作り直す（サイトマップは `SITE_URL` があるときだけ作られます）。

## うまくいかないとき

- `Missing entry-point to Worker script or to assets directory` で落ちる：`wrangler.jsonc` が無い枝を上げている。main に `wrangler.jsonc` があるかを見る。
- 手元で上げる手前まで試す：`npm run build` のあと `npx wrangler deploy --dry-run`（ログインは要らない）。

## 公開のあとで人がすること

- 広告（AdSense など）とアクセスの計測を申し込む。申し込みの前に、プライバシーポリシーのページを載せる。
- main に入れること（merge）は人がします。夜の実行は PR を作るところまでです。
