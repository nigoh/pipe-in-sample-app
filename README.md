# pipe-in-sample-app

[pipe-in](https://github.com/nigoh/pipe-in) で作る、お金になるアプリの試し場です。
作るときの時間・利用料・人が手を入れた回数・差し戻しを記録し、pipe-in を育てる材料にします。

## 今の題材

2026年の制度改正（所得税の壁・子ども・子育て支援金・社会保険の加入）に合わせた、手取りと年収の壁の計算サイトです。

- サイト：Astro（静的な書き出し）と TypeScript。公開は Cloudflare Workers（[公開のしかた](docs/deploy.md)）
- 制度の数字：公式のサイトだけを出典にし、pipe-in のパイプ [`pipe-in-research`](.pipe-in/pipes/pipe-in-research/README.md) で調べる
- 決めたこと：[docs/decisions/](docs/decisions/)

## 動かす

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev        # 手元で見る
```

Node 22.23.4 以上が要ります。

## 注意

このサイトの計算は目安です。実際の金額は、勤め先・保険者・自治体によって変わります。
