import {test} from "node:test";
import assert from "node:assert/strict";
import {resolve} from "node:path";
import {inspectRelease} from "../scripts/release-check.mjs";
test("release gate distinguishes passing logic tests from unfinished game",()=>{
 const project=resolve(import.meta.dirname,"..");
 const issues=inspectRelease(project);
 assert.ok(issues.some(x=>x.includes("production game entry")));
 assert.ok(issues.some(x=>x.includes("illustrated asset manifest")));
 assert.ok(issues.some(x=>x.includes("wardrobe")));
 assert.ok(issues.some(x=>x.includes("story")));
});
