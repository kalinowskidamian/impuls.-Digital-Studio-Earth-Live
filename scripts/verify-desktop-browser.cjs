"use strict";
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {PNG}=require("pngjs");
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:["--no-sandbox","--disable-dev-shm-usage","--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1350,height:940},reducedMotion:"reduce"});
  // Observe the real Globe.GL instance without modifying production code.
  await page.addInitScript(()=>{
   let library;
   Object.defineProperty(window,"Globe",{configurable:true,get:()=>library,set(value){
    library=(...args)=>{const build=value(...args);return (...hostArgs)=>{const globe=build(...hostArgs);window.__qaGlobe=globe;return globe;};};
   }});
  });
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const now=Date.now();
  await page.route("https://earthquake.usgs.gov/**",route=>route.fulfill({json:{features:[{id:"qa-smoke",geometry:{coordinates:[15,20,10]},properties:{place:"QA globe smoke test",mag:3.2,time:now,url:"https://earthquake.usgs.gov/"}}]}}));
  await page.route("https://eonet.gsfc.nasa.gov/**",route=>route.fulfill({json:{events:[]}}));
  await page.goto("http://127.0.0.1:8765/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>performance.getEntriesByName("earth-live:borders-native").length>0&&window.__qaGlobe?.pathsData().length>100,{},{timeout:90000});
  await page.locator("#globe canvas").first().waitFor({state:"visible",timeout:30000});
  await page.locator(".globe-marker").first().waitFor({state:"attached",timeout:30000});
  const textures=await page.evaluate(()=>performance.getEntriesByType("resource").filter(e=>e.name.includes("/textures/")).map(e=>({name:e.name,bytes:e.transferSize})));
  assert.ok(textures.some(e=>e.name.endsWith("earth-blue-marble.webp")&&e.bytes>0),"Local color map requested");
  assert.ok(textures.some(e=>e.name.endsWith("earth-topology.webp")&&e.bytes>0),"Local relief map requested");
  await page.locator('[data-layer="earthquakes"]').click();
  assert.equal(await page.locator('[data-layer="earthquakes"]').getAttribute("aria-pressed"),"true");
  await page.locator("#plus").click();
  await page.locator("#reset").click();
  await page.evaluate(()=>{
   const g=window.__qaGlobe;
   g.pauseAnimation();g.controls().autoRotate=false;g.controls().enableDamping=false;
   g.pointOfView({lat:48,lng:15,altitude:2.2},0);
   window.__qaBorderPaths=g.pathsData().map(p=>({points:p.points.map(x=>x.slice())}));
  });
  await page.waitForTimeout(1500);
  const capture=async()=>{
   const uri=await page.evaluate(()=>{
    const g=window.__qaGlobe,r=g.renderer();r.setPixelRatio(1);r.render(g.scene(),g.camera());
    return r.domElement.toDataURL("image/png");
   });
   return PNG.sync.read(Buffer.from(uri.split(",")[1],"base64"));
  };
  const withBorders=await capture();
  await page.evaluate(()=>window.__qaGlobe.pathsData([]));
  await page.waitForTimeout(700);
  const withoutBorders=await capture();
  assert.equal(withBorders.width,withoutBorders.width);
  assert.equal(withBorders.height,withoutBorders.height);
  let changed=0;
  for(let i=0;i<withBorders.data.length;i+=4){
   if(Math.abs(withBorders.data[i]-withoutBorders.data[i])+Math.abs(withBorders.data[i+1]-withoutBorders.data[i+1])+Math.abs(withBorders.data[i+2]-withoutBorders.data[i+2])>20)changed++;
  }
  require("node:fs").writeFileSync("browser-audit/country-borders.png",PNG.sync.write(withBorders));
  require("node:fs").writeFileSync("browser-audit/no-country-borders.png",PNG.sync.write(withoutBorders));
  assert.ok(changed>200,`Country outlines must affect visible pixels (only ${changed} changed)`);
  console.log("Country outlines pixel difference PASS",changed);
  await page.evaluate(()=>{const g=window.__qaGlobe;g.pathsData(window.__qaBorderPaths);g.resumeAnimation();});
  await page.waitForTimeout(700);
  await page.screenshot({path:"browser-audit/desktop-smoke.png"});
  assert.deepEqual(errors,[]);
  const timings=await page.evaluate(()=>performance.getEntriesByType("mark").filter(e=>e.name.startsWith("earth-live:")).map(e=>e.name));
  console.log("Desktop WebGL smoke PASS",JSON.stringify({textures,timings}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
