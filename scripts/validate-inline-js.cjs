"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const file = "public/index.html";
const html = fs.readFileSync(file, "utf8");
const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
let m;
let inlineCount = 0;

while ((m = scripts.exec(html)) !== null) {
  const [, attrs, code] = m;
  if (/\bsrc\s*=/.test(attrs) || !code.trim()) continue;
  inlineCount += 1;
  new vm.Script(code, { filename: file + ":inline-" + inlineCount });
}
assert.ok(inlineCount > 0, "No application JavaScript to check");

for (const id of ["globe", "feed", "refresh", "windows", "layers"]) {
  assert.ok(html.includes('id="' + id + '"'), "Required UI element missing: " + id);
}
for (const lang of ["pl", "en"]) {
  assert.ok(html.includes('data-lang="' + lang + '"'), "Missing " + lang.toUpperCase() + " language choice");
}
assert.ok(html.includes('aria-label="Język / Language"'), "Missing accessible language switch");
assert.ok(html.includes('aria-pressed="true"') && html.includes('aria-pressed="false"'), "Language switch must expose selected state");
console.log("QA PASS: " + inlineCount + " inline script(s) parse, primary UI exists and PL/EN switch is accessible.");
