"use strict";
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:["--no-sandbox","--disable-dev-shm-usage","--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1350,height:940}});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const now=Date.now();
  await page.route("https://earthquake.usgs.gov/**",route=>route.fulfill({json:{features:[{id:"qa-smoke",geometry:{coordinates:[15,20,10]},properties:{place:"QA globe smoke test",mag:3.2,time:now,url:"https://earthquake.usgs.gov/"}}]}}));
  await page.route("https://eonet.gsfc.nasa.gov/**",route=>route.fulfill({json:{events:[]}}));
  await page.goto("http://127.0.0.1:8765/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>performance.getEntriesByName("earth-live:borders-batched").length>0,{},{timeout:90000});
  await page.locator("#globe canvas").first().waitFor({state:"visible",timeout:30000});
  await page.locator(".globe-marker").first().waitFor({state:"attached",timeout:30000});
  const textures=await page.evaluate(()=>performance.getEntriesByType("resource").filter(e=>e.name.includes("/textures/")).map(e=>({name:e.name,bytes:e.transferSize})));
  assert.ok(textures.some(e=>e.name.endsWith("earth-blue-marble.webp")&&e.bytes>0),"Local color map requested");
  assert.ok(textures.some(e=>e.name.endsWith("earth-topology.webp")&&e.bytes>0),"Local relief map requested");
  await page.locator('[data-layer="earthquakes"]').click();
  assert.equal(await page.locator('[data-layer="earthquakes"]').getAttribute("aria-pressed"),"true");
  await page.locator("#plus").click();
  await page.locator("#reset").click();
  await page.screenshot({path:"browser-audit/desktop-smoke.png"});
  assert.deepEqual(errors,[]);
  console.log("Desktop WebGL smoke PASS",JSON.stringify(textures));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
