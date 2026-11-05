// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// 公開先の URL は、Cloudflare Pages の環境変数 SITE_URL で渡す（独自ドメインが決まるまでは無くてよい）。
// URL が無いときは、サイトマップを作らない（作ると、間違った URL が検索に載る）。
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "always",
  integrations: site ? [sitemap()] : [],
});
