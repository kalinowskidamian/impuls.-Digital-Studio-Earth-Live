"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("public/index.html", "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, "Inline Earth Live application script must exist");

function createHarness() {
  const elements = new Map();
  const requestedScripts = [];
  let globeInstances = 0;

  function element(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        hidden: true,
        textContent: "",
        innerHTML: "",
        value: "",
        classList: { toggle() {} },
        addEventListener() {},
        getBoundingClientRect() { return { width: 730, height: 700 }; }
      });
    }
    return elements.get(selector);
  }

  const document = {
    documentElement: { lang: "pl" },
    querySelector: element,
    querySelectorAll() { return []; },
    createElement(tag) {
      assert.equal(tag, "script", "Only Globe.GL CDN script injection expected");
      return { src: "", async: false, onload: null, onerror: null, remove() { this.removed = true; } };
    },
    head: { appendChild(node) { requestedScripts.push(node); } },
    hidden: false
  };

  const window = {
    addEventListener() {},
    Globe: undefined
  };

  const globe = new Proxy({}, {
    get(_target, key) {
      if (key === "controls") return () => ({ autoRotate: false, enableDamping: false });
      if (key === "pointOfView") return (...args) => args.length ? globe : { altitude: 2 };
      return () => globe;
    }
  });

  const context = {
    document,
    window,
    localStorage: { getItem() { return null; }, setItem() {} },
    fetch() { return new Promise(() => {}); },
    AbortController,
    setTimeout() { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    matchMedia() { return { matches: false }; },
    ResizeObserver: class { observe() {} },
    console,
  };

  vm.runInNewContext(match[1], context, { filename: "public/index.html" });

  return {
    elements,
    requestedScripts,
    setGlobeAvailable() {
      window.Globe = () => {
        globeInstances += 1;
        return () => globe;
      };
    },
    get globeInstances() { return globeInstances; }
  };
}

// First CDN loads: only after its onload should the globe be created.
{
  const app = createHarness();
  assert.equal(app.requestedScripts.length, 1);
  assert.match(app.requestedScripts[0].src, /cdn\.jsdelivr\.net/);
  assert.equal(app.globeInstances, 0);
  app.setGlobeAvailable();
  app.requestedScripts[0].onload();
  assert.equal(app.globeInstances, 1, "Globe must initialize after CDN load");
  assert.equal(app.elements.get("#globeWarning").hidden, true);
}

// First CDN fails: the alternative is loaded, then the globe initializes.
{
  const app = createHarness();
  app.requestedScripts[0].onerror();
  assert.equal(app.requestedScripts.length, 2);
  assert.match(app.requestedScripts[1].src, /unpkg\.com/);
  app.setGlobeAvailable();
  app.requestedScripts[1].onload();
  assert.equal(app.globeInstances, 1, "Fallback CDN should initialize globe");
  assert.equal(app.elements.get("#globeWarning").hidden, true);
}

// Both CDNs fail: other app functionality stays live and a clear error appears.
{
  const app = createHarness();
  app.requestedScripts[0].onerror();
  app.requestedScripts[1].onerror();
  assert.equal(app.globeInstances, 0);
  assert.equal(app.elements.get("#globeWarning").hidden, false);
  assert.match(app.elements.get("#globeWarning").textContent, /globusa 3D/);
}

console.log("QA PASS: globe bootstrap, CDN fallback and graceful failure");
