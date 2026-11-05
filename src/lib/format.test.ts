import { test } from "node:test";
import assert from "node:assert/strict";
import { formatYen } from "./format.ts";

test("円の金額を3桁ごとの区切りと「円」で表す", () => {
  assert.equal(formatYen(1234567), "1,234,567円");
  assert.equal(formatYen(0), "0円");
});

test("1円より細かい端数は切り捨てる（手取りを多く見せない）", () => {
  assert.equal(formatYen(1999.9), "1,999円");
});

test("マイナスの金額は「-」を付けて表す", () => {
  assert.equal(formatYen(-5000), "-5,000円");
});

test("数でない値は誤りにする（NaN や無限大を画面に出さない）", () => {
  assert.throws(() => formatYen(Number.NaN), RangeError);
  assert.throws(() => formatYen(Number.POSITIVE_INFINITY), RangeError);
});
