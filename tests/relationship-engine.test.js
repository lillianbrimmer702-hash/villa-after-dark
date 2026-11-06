import { createWorld, recordEvent, revealEvent, memoriesOf, relationshipBetween, advanceDay, serializeWorld, loadWorld } from "../src/relationship-engine.js";
import assert from "node:assert/strict";
import { test } from "node:test";
const cast = [{id:"player",name:"Player"},{id:"alex",name:"Alex"},{id:"sam",name:"Sam"}];
test("private kiss stays private until revealed", () => {
 const w=createWorld(cast);
 recordEvent(w,{id:"e1",day:1,type:"kiss",actor:"player",target:"alex",witnesses:[]});
 assert.equal(memoriesOf(w,"sam").length,0);
 assert.equal(memoriesOf(w,"alex").length,1);
 revealEvent(w,"e1","sam");
 assert.equal(memoriesOf(w,"sam").length,1);
 assert.equal(memoriesOf(w,"sam").length,1); // repeated reveal is idempotent
});
test("betrayal has durable consequences", () => {
 const w=createWorld(cast);
 recordEvent(w,{id:"e1",day:1,type:"promise",actor:"player",target:"alex",witnesses:[]});
 recordEvent(w,{id:"e2",day:1,type:"betrayal",actor:"player",target:"alex",witnesses:[]});
 assert.deepEqual(relationshipBetween(w,"player","alex"),{affection:-16,trust:-21,history:["e1","e2"]});
 assert.throws(()=>recordEvent(w,{id:"e2",day:1,type:"kiss",actor:"player",target:"alex",witnesses:[]}),/Duplicate/);
});
test("events and memories survive save and load", () => {
 const w=createWorld(cast);
 recordEvent(w,{id:"e1",day:1,type:"argument",actor:"sam",target:"alex",witnesses:["player"]});
 advanceDay(w);
 const loaded=loadWorld(serializeWorld(w));
 assert.equal(loaded.day,2);
 assert.equal(memoriesOf(loaded,"player").length,1);
 assert.equal(relationshipBetween(loaded,"sam","alex").trust,-8);
});
test("future events and unknown witnesses are rejected", () => {
 const w=createWorld(cast);
 assert.throws(()=>recordEvent(w,{id:"future",day:2,type:"kiss",actor:"player",target:"alex",witnesses:[]}),/future/);
 assert.throws(()=>recordEvent(w,{id:"bad",day:1,type:"kiss",actor:"player",target:"alex",witnesses:["unknown"]}),/witness/);
});
