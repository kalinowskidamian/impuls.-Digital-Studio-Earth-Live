"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("public/index.html", "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, "Inline Earth Live application script must exist");

function createHarness({mobile=false,observer=true,pixelRatio=3}={}) {
  const elements = new Map();
  const requestedScripts = [];
  let globeInstances = 0;
  let ratio=pixelRatio,ratioChanges=0;
  const observers=[];

  function element(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        hidden: true,
        textContent: "",
        innerHTML: "",
        value: "",
        classList: { toggle() {} },
        setAttribute() {},
        listeners:{},
        addEventListener(type,fn) { this.listeners[type]=fn; },
        getBoundingClientRect() { return { width: 730, height: 700 }; }
      });
    }
    return elements.get(selector);
  }

  const document = {
    addEventListener() {},
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
      if (key === "renderer") return () => ({getPixelRatio:()=>ratio,setPixelRatio:value=>{ratio=value;ratioChanges++;}});
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
    matchMedia(query) { return { matches: query==="(max-width:670px)"&&mobile }; },
    ResizeObserver: class { observe() {} },
    console,
  };
  if(observer)context.IntersectionObserver=class {
    constructor(fn,options){this.fn=fn;this.options=options;observers.push(this);}
    observe() {}
    disconnect(){this.disconnected=true;}
  };

  vm.runInNewContext(match[1], context, { filename: "public/index.html" });

  return {
    elements,
    requestedScripts,
    observers,
    get pixelRatio(){return ratio;},
    get ratioChanges(){return ratioChanges;},
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
  assert.equal(app.pixelRatio,2,"High density renderer is capped at 2x");
}

// Mobile: the feed loads independently, and the globe downloads once near the stage.
{
  const app=createHarness({mobile:true,pixelRatio:1.5});
  assert.equal(app.requestedScripts.length,0,"No 3D download when the mobile globe is offscreen");
  const watch=app.observers[0];
  assert.equal(watch.options.threshold,.25);
  watch.fn([{isIntersecting:true,intersectionRatio:.1}]);
  assert.equal(app.requestedScripts.length,0,"A sliver of the stage should not start the expensive download");
  watch.fn([{isIntersecting:true,intersectionRatio:.25}]);
  assert.equal(app.requestedScripts.length,1);
  assert.ok(watch.disconnected);
  app.elements.get(".stage").listeners.focusin();
  assert.equal(app.requestedScripts.length,1,"Keyboard focus must not duplicate the library download");
  app.setGlobeAvailable();app.requestedScripts[0].onload();
  assert.equal(app.pixelRatio,1.5,"Standard density displays retain their rendering quality");
  assert.equal(app.ratioChanges,0);
}

// Without IntersectionObserver, keep the original eager behaviour.
{
  const app=createHarness({mobile:true,observer:false});
  assert.equal(app.requestedScripts.length,1);
}

// Keyboard users can request the globe without waiting for the observer.
{
  const app=createHarness({mobile:true});
  app.elements.get(".stage").listeners.focusin();
  assert.equal(app.requestedScripts.length,1);
  assert.ok(app.observers[0].disconnected);
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
