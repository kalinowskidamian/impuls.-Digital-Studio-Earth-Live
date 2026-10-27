"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("public/index.html","utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, "Earth Live inline application code missing");

class FakeElement {
 constructor(id="") {
  this.id=id;this.hidden=false;this.style={setProperty(){}};
  this.dataset={};this.textContent="";this.innerHTML="";this.value="";
  this.attrs={};this.listeners={};this.children=[];
  this.classList={values:new Set(),toggle:(k,v)=>{if(v)this.classList.values.add(k);else this.classList.values.delete(k);},add:k=>this.classList.values.add(k),remove:k=>this.classList.values.delete(k)};
 }
 addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
 fire(type,event={}){for(const fn of this.listeners[type]||[])fn({...event,target:event.target||this,stopPropagation(){}});}
 setAttribute(key,value){this.attrs[key]=value;}
 getBoundingClientRect(){return {left:120,top:100,width:560,height:560};}
 querySelector(){return new FakeElement();}
 appendChild(el){this.children.push(el);}
 replaceChildren(){this.children=[];}
 remove(){}
}

async function main(){
 const all=new Map();
 const selectors=["all","earthquakes","wildfires","severeStorms","volcanoes","other"];
 const layers=selectors.map(layer=>{const e=new FakeElement();e.dataset.layer=layer;return e;});
 const days=[1,7,30].map(n=>{const e=new FakeElement();e.dataset.days=String(n);return e;});
 const languages=["pl","en"].map(lang=>{const e=new FakeElement();e.dataset.lang=lang;return e;});
 const saved={};
 const byId=s=>{if(!all.has(s))all.set(s,new FakeElement(s));return all.get(s);};
 const scripts=[],calls={markers:[],paths:[]},controls={autoRotate:false,autoRotateSpeed:0,enableDamping:false};
 const pendingTimers=new Map();let nextTimerId=0;
 const g = new Proxy({}, {get(_obj,key){
  if(key==="controls")return ()=>controls;
  if(key==="htmlElement")return (value)=>{calls.createMarker=value;return g;};
  if(key==="htmlElementsData")return (value)=>{calls.markers=value;return g;};
  if(key==="pathsData")return (value)=>{calls.paths=value;return g;};
  if(key==="pointOfView")return (...args)=>args.length?g:{lat:0,lng:0,altitude:2};
  if(key==="width"||key==="height")return value=>{calls[key]=value;return g;};
  const available=new Set([
   "globeImageUrl","bumpImageUrl","backgroundColor","showAtmosphere",
   "atmosphereColor","atmosphereAltitude","htmlLat","htmlLng","htmlAltitude",
   "htmlTransitionDuration","pathPoints","pathPointLat","pathPointLng",
   "pathPointAlt","pathColor","pathStroke","pathTransitionDuration"
  ]);
  // Deliberately refuse unknown Globe.GL methods (e.g. the invalid pathAltitude).
  if(!available.has(key))throw new TypeError("Unknown Globe.GL API method: "+String(key));
  return ()=>g;
 }});
 const now=Date.now();
 const quake=(id,title)=>({type:"Feature",id,geometry:{coordinates:[8,48,13]},properties:{place:title,mag:3.7,time:now,url:"https://earthquake.usgs.gov/earthquakes/eventpage/"+id}});
 const usgs={features:[quake("q1","California quake"),quake("q2","Chile quake")]};
 const nasa={events:[
  {id:"w1",title:"Oregon wildfire",categories:[{id:"wildfires"}],geometry:[{type:"Point",coordinates:[-120,44],date:new Date(now).toISOString()}],sources:[]},
  {id:"s1",title:"Cyclone Ambar",categories:[{id:"severeStorms"}],geometry:[{type:"Point",coordinates:[80,12],date:new Date(now).toISOString()}],sources:[]},
  {id:"v1",title:"Volcano summit",categories:[{id:"volcanoes"}],geometry:[{type:"Point",coordinates:[140,36],date:new Date(now).toISOString()}],sources:[]}
 ]};
 const world={type:"Topology",transform:{scale:[1,1],translate:[0,0]},arcs:[[[4,2],[2,3]]],objects:{countries:{geometries:[{arcs:[[0]]},{arcs:[[~0]]}]}}};
 const doc={documentElement:{lang:"pl"},hidden:false,querySelector:byId,
  querySelectorAll:s=>s==="[data-layer]"||s===".layer"?layers:s==="[data-days]"?days:s==="[data-lang]"?languages:[],
  createElement:tag=>new FakeElement(tag),
  head:{appendChild(node){scripts.push(node);}},
 };
 const context={document:doc,window:{addEventListener(){},Globe:undefined},
  console,localStorage:{getItem(k){return saved[k]??null;},setItem(k,v){saved[k]=v;}},
  ResizeObserver:class{observe(){}},
  AbortController,
  setTimeout(fn,delay){const id=++nextTimerId;pendingTimers.set(id,{fn,delay});return id;},
  clearTimeout(id){pendingTimers.delete(id);},
  setInterval(){return 1;},
  matchMedia(){return {matches:false};},
  fetch:async (url)=>({ok:true,json:async()=>url.includes("earthquake.usgs.gov")?usgs:url.includes("eonet.gsfc")?nasa:world})
 };
 vm.runInNewContext(script[1],context,{filename:"index.html"});
 assert.equal(scripts.length,1,"Globe library loader starts independently from feeds");
 context.window.Globe=()=>()=>g;
 scripts[0].fire("load");
 // The test FakeElement fires the same listeners as DOM; external script uses .onload.
 if(typeof scripts[0].onload==="function")scripts[0].onload();
 await new Promise(resolve=>setTimeout(resolve,0));
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(calls.width,560,"Globe must be resized to its own stage, not the whole browser");
 assert.equal(calls.height,560,"Globe height must match its stage");
 assert.equal(byId("#globeWarning").hidden,true,"Successful init must clear old WebGL warning");
 assert.equal(calls.markers.length,5,"Default all-layer globe matches both API feeds");
 assert.equal(byId("#strap").textContent,"✳  SYSTEM OBSERWACJI PLANETY  / 001","Initial PL masthead is translated");
 assert.equal(languages[0].attrs["aria-pressed"],"true","PL active on initial render");
 assert.equal(languages[1].attrs["aria-pressed"],"false","EN inactive on initial render");
 languages[1].fire("click");
 assert.equal(doc.documentElement.lang,"en","EN button changes application language");
 assert.equal(byId("#strap").textContent,"✳  PLANETARY OBSERVATION SYSTEM  / 001","EN masthead translates correctly");
 assert.equal(languages[1].attrs["aria-pressed"],"true","EN is visibly and accessibly selected");
 assert.equal(languages[0].attrs["aria-pressed"],"false","PL is deselected");
 assert.equal(saved["earth-live-lang"],"en","Language choice is persisted");
 languages[0].fire("click");
 assert.equal(doc.documentElement.lang,"pl","PL button switches back");
 assert.equal(byId("#strap").textContent,"✳  SYSTEM OBSERWACJI PLANETY  / 001","Switching to PL restores Polish masthead");
 assert.equal(languages[0].attrs["aria-pressed"],"true","PL is selected again");
 assert.equal(calls.markers.length,5,"Switching languages preserves globe markers");
 assert.equal(calls.paths.length,1,"Shared TopoJSON border arc decoded only once");
 assert.equal(calls.paths[0].points.length,2);
 const maker=calls.createMarker;
 assert.equal(typeof maker,"function");
 const visual=calls.markers.map(x=>maker(x));
 assert.ok(visual.every(x=>x.className==="globe-pin"),"CSS2DRenderer owns stable anchor");
 const buttons=visual.map(x=>x.children[0]);
 assert.ok(buttons.every(x=>x.className==="globe-marker"),"All incidents use nested interactive button");
 assert.ok(buttons.every(x=>x.textContent!==""));
 assert.equal(new Set(buttons.map(x=>x.textContent)).size,4,"Every category has matching symbol");
 const hoverRule=html.match(/\.globe-marker:hover[^{}]*\{([^}]*)\}/);
 assert.ok(hoverRule,"Hover styling must exist");
 assert.ok(!/\b(scale|transform)\s*:/.test(hoverRule[1]),"Hover must not modify element geometry");
 const earthquake=calls.markers.find(x=>x.category==="earthquakes");
 const quakeButton=maker(earthquake).children[0];
 assert.equal(quakeButton.textContent,"◈");
 quakeButton.fire("pointerenter",{pointerType:"mouse",clientX:350,clientY:330});
 assert.equal(controls.autoRotate,false,"Hover must pause globe");
 assert.equal(controls.enableDamping,false,"Hover must disable residual camera inertia");
 assert.equal(byId("#globeTip").hidden,false,"Hover must show detail card");
 assert.match(byId("#globeTip").innerHTML,/California quake|Chile quake/);
 quakeButton.fire("pointerleave",{pointerType:"mouse"});
 assert.equal(controls.autoRotate,false,"Rotation must remain paused during short pointer gaps");
 assert.equal(byId("#globeTip").hidden,false,"Card must not flicker on transient pointer exit");
 quakeButton.fire("pointerenter",{pointerType:"mouse",clientX:350,clientY:330});
 assert.equal(pendingTimers.size,0,"Re-enter cancels the pending rotation restart");
 quakeButton.fire("pointerleave",{pointerType:"mouse"});
 const release=[...pendingTimers.entries()].find(([_id,t])=>t.delay===220);
 assert.ok(release,"Short hover release timer must exist");
 pendingTimers.delete(release[0]);release[1].fn();
 assert.equal(controls.autoRotate,true,"Rotation resumes when pointer truly leaves");
 assert.equal(controls.enableDamping,true,"Damping resumes after hover");
 assert.equal(byId("#globeTip").hidden,true);
 for(const name of selectors.slice(1)){
  const layer=layers.find(x=>x.dataset.layer===name);
  layer.fire("click");
  assert.ok(calls.markers.every(x=>x.category===name),"Only selected category appears on globe");
 }
 layers.find(x=>x.dataset.layer==="all").fire("click");
 byId("#search").fire("input",{target:{value:"Cyclone"}});
 assert.equal(calls.markers.length,1);
 assert.equal(calls.markers[0].title,"Cyclone Ambar","Search must also filter the globe");
 assert.match(byId("#markerStatus").textContent,/1 \/ 1/);
 console.log("QA PASS: country borders, marker parity, hover pause, matching filters and search");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
