"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const html = fs.readFileSync("public/index.html", "utf8");
const code=html.slice(html.indexOf("function borderVertices("),html.indexOf("async function loadBorders("));
assert.ok(code.includes("renderCountryBorders"));
let geo, material, lines, fallback, layers, factory, marks=[];
const THREE={
 BufferGeometry:class{setAttribute(name,value){geo=value;assert.equal(name,"position");}computeBoundingSphere(){}},
 Float32BufferAttribute:class{constructor(values,size){this.values=values;this.size=size;}},
 LineBasicMaterial:class{constructor(options){material=options;}},
 LineSegments:class{constructor(geometry,mat){lines=this;}},
};
const globe={
 getCoords(lat,lng,alt){return {x:lng,y:lat,z:alt};},
 customThreeObject(create){factory=create;return this;},
 customLayerData(data){layers=data;factory(data[0]);return this;},
 pathsData(paths){fallback=paths;return this;},
};
const context={window:{THREE},state:{globe},performance:{mark(name){marks.push(name);}}};
vm.runInNewContext(code,context);
(async()=>{
 const paths=[{points:[[179,0],[-179,0]]},{points:[[20,5],[24,5]]}];
 await context.renderCountryBorders(globe,paths);
 assert.equal(layers.length,1,"All outlines must share one object");
 assert.equal(geo.size,3);
 assert.deepEqual(Array.from(geo.values),[179,0,.004,181,0,.004,20,5,.004,22,5,.004,22,5,.004,24,5,.004]);
 assert.equal(material.opacity,.24);
 assert.equal(lines.name,"Earth Live country outlines");
 assert.equal(lines.raycast(),undefined);
 assert.equal(fallback,undefined);
 assert.equal(marks[0],"earth-live:borders-batched");
 context.window.THREE={LineSegments:THREE.LineSegments};
 await context.renderCountryBorders(globe,paths);
 assert.equal(fallback,paths,"Unsupported batch falls back to all original outlines");
 assert.equal(marks[1],"earth-live:borders-fallback");
 console.log("QA PASS: single border batch, antimeridian, disconnected paths and original fallback");
})().catch(e=>{console.error(e);process.exitCode=1;});
