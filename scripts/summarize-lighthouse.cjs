"use strict";
const fs = require("node:fs");
const path = require("node:path");
const [file, device] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(file, "utf8"));
if(report.runtimeError || report.categories?.performance?.score == null) {
  throw new Error("Invalid Lighthouse run: " + JSON.stringify(report.runtimeError || report.runWarnings));
}
const audits = report.audits;
const categories = Object.fromEntries(Object.entries(report.categories).map(([id,value])=>[id, Math.round(value.score*100)]));
const metricIds = ["first-contentful-paint","largest-contentful-paint","speed-index","total-blocking-time","cumulative-layout-shift","interactive","total-byte-weight","mainthread-work-breakdown","bootup-time"];
const metrics = Object.fromEntries(metricIds.filter(id=>audits[id]?.numericValue!=null).map(id=>[id, {value:Math.round(audits[id].numericValue*100)/100,display:audits[id].displayValue}]));
const findings = (category) => (report.categories[category]?.auditRefs || []).map(({id})=>audits[id]).filter(a=>a && typeof a.score==="number" && a.score<1).map(a=>({id:a.id,title:a.title,display:a.displayValue,items:a.details?.items?.length,estimatedSavings:a.metricSavings}));
const accessibilityNodes = Object.fromEntries(findings("accessibility").map(({id})=>[id,(audits[id].details?.items || []).slice(0,10).map(item=>item.node?.selector || item.node?.snippet || null)]));
const requests=(audits["network-requests"]?.details?.items || []).filter(item=>item.url?.startsWith("http")).sort((a,b)=>(b.transferSize||0)-(a.transferSize||0)).slice(0,10).map(item=>({url:item.url.split("?")[0],bytes:item.transferSize}));
const globeTimings=(audits["user-timings"]?.details?.items || []).filter(item=>item.name?.startsWith("earth-live:")).map(item=>({name:item.name,startTime:item.startTime}));
console.log(JSON.stringify({page:path.basename(file),device,version:report.lighthouseVersion,categories,metrics,performanceFindings:findings("performance"),accessibilityFindings:findings("accessibility"),accessibilityNodes,largestRequests:requests,globeTimings,runWarnings:report.runWarnings}));
