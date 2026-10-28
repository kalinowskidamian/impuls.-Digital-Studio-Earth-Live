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
assert.ok(
  html.includes("background:conic-gradient(from 180deg,#fd58df,#fff,#4666ff,#fd58df)"),
  "Studio logo dot must match the official pink-white-blue conic gradient"
);
assert.ok(
  html.includes("box-shadow:0 0 18px rgba(253,88,223,.5)"),
  "Studio logo dot must retain its official magenta glow"
);
assert.ok(html.includes(".studio-period{color:#fff}"), "Studio logo period should be white");
assert.ok(html.includes('id="strap"'), "Masthead label must have an ID for i18n updates");
assert.ok(html.includes("grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)"), "Header must keep the masthead centered between equal columns");
assert.ok(html.includes(".strap{white-space:nowrap;justify-self:center;text-align:center}"), "Masthead needs fixed center alignment");
const favicon = fs.readFileSync("public/favicon.svg", "utf8");
assert.ok(html.includes('<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg?v=1">'), "Earth Live favicon link missing");
assert.match(favicon, /<svg[^>]*viewBox="0 0 64 64"/, "Favicon must use a square scalable viewBox");
assert.match(favicon, /<clipPath id="sphere">/, "Favicon Earth silhouette missing");
assert.match(favicon, /<radialGradient id="ocean"/, "Favicon ocean gradient missing");
assert.match(favicon, /<linearGradient id="land"/, "Favicon land gradient missing");
console.log("QA PASS: " + inlineCount + " inline script(s) parse, primary UI exists and PL/EN switch is accessible.");
