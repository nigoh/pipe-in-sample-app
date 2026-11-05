# pipe-in-research：制度の数字を公式のサイトから調べる

手取り・年収の壁の計算に要る制度の数字（控除の額・保険料の率・支援金の率など）を、公式のサイトだけから、出典の URL と逐語の引用つきで集めます。
最後に、計算サイトへ入れるための `/pipe-in` の要件メモの案も書きます。元は pipe-in の見本 `examples/research` です。

## 段と書ける範囲

| 段 | 成果物 | access | Web | 人の確認 |
| --- | --- | --- | --- | --- |
| `frame` | `01_question.md` | read | なし | あり |
| `gather` | `02_findings.md` | read | 公式のサイトへの WebFetch だけ | なし |
| `summarize` | `03_report.md` と `docs/research/report.md` | docs（`docs/research`） | なし | あり |
| `verify` | `04_verify.md` | read | 公式のサイトへの WebFetch だけ | なし |

- 公式のサイトの一覧は `research/official-sources.json` と `pipe.toml` の `web` の2か所にあります。足すときは両方をそろえ、理由を決定の記録に書きます。
- `verify` のあとで、`node scripts/check-research.mjs` が報告を機械で確かめます（見出し・出典の URL が公式のサイトだけか）。合わなければ `summarize` へ戻します（2回まで）。CI も同じ検査を流します。
- どの段もモデルは sonnet です（利用料を抑えるため）。上限は段ごとの `max_budget_usd` の合計で $5.0 です。

## 流し方

```bash
pipe-in --pipe research --project . --text "2026年分の所得税の基礎控除と給与所得控除"
```

## 向かない場面

- 題材そのものを Web で探すこと（WebSearch は開けていません）。題材探しは別のパイプにします。
- 計算のコードを書くこと（それは報告の「要件メモの案」を `/pipe-in` に渡してから）。
