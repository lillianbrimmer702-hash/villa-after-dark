import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"..");
test("developer interface JavaScript parses in Node",()=>{
 execFileSync(process.execPath,["--check",resolve(root,"dev/app.js")],{stdio:"pipe"});
});
test("developer interface is explicitly marked unreleased",()=>{
 const html=readFileSync(resolve(root,"dev/index.html"),"utf8");
 const script=readFileSync(resolve(root,"dev/app.js"),"utf8");
 assert.match(html,/type="module"/);
 assert.match(script,/Not the completed game/);
 assert.match(script,/realistic character and villa artwork are unfinished/);
 assert.match(script,/completeDay\(world/);
 assert.match(script,/chooseStoryOption\(world/);
 assert.match(script,/saveSlot\(localStorage/);
});
test("developer app loads only local modules, not paid services",()=>{
 const html=readFileSync(resolve(root,"dev/index.html"),"utf8");
 assert.doesNotMatch(html,/<script[^>]+https?:\/\//);
 assert.match(html,/\.\/app\.js/);
});
