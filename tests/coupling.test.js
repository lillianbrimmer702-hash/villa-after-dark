import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, recordEvent, revealEvent, advanceDay, serializeWorld, loadWorld } from "../src/relationship-engine.js";
import { ensureCouplingState, mutuallyAttracted, partnerOf, previewRecoupling, runRecoupling, knownJealousyEvidence } from "../src/coupling.js";

function world(){
  const w=createWorld([
    {id:"player",name:"Player",isPlayer:true,gender:"woman",attractedTo:["man","woman"]},
    {id:"alex",gender:"man",attractedTo:["woman"]},
    {id:"sam",gender:"woman",attractedTo:["woman","man"]},
    {id:"kai",gender:"man",attractedTo:["woman","man"]},
    {id:"mia",gender:"woman",attractedTo:["man"]}
  ]);
  w.playerId="player";
  return ensureCouplingState(w);
}
test("mutual attraction and player choice",()=>{
  const w=world();
  assert.equal(mutuallyAttracted(w,"alex","kai"),false);
  assert.equal(mutuallyAttracted(w,"player","alex"),true);
  assert.throws(()=>previewRecoupling(w,{playerChoice:"mia"}),/Incompatible/);
  const plan=previewRecoupling(w,{playerChoice:"alex"});
  assert.ok(plan.pairs.some(p=>p.includes("player")&&p.includes("alex")));
  assert.equal(new Set(plan.pairs.flat()).size,plan.pairs.length*2);
  assert.ok(plan.complete);
  assert.equal(w.events.length,0);
});
test("ceremony is public, singular and saves correctly",()=>{
  const w=world();
  const result=runRecoupling(w,{playerChoice:"alex"});
  assert.equal(partnerOf(w,"player"),"alex");
  assert.equal(partnerOf(w,"alex"),"player");
  assert.ok(w.events.some(e=>e.type==="recoupling"));
  assert.throws(()=>runRecoupling(w,{playerChoice:"alex"}),/already held/);
  const loaded=loadWorld(serializeWorld(w));
  assert.deepEqual(loaded.couples,w.couples);
  assert.deepEqual(loaded.ceremonies,[result]);
});
test("private outside kiss is unknown until revealed",()=>{
  const w=world();
  runRecoupling(w,{playerChoice:"alex"});
  recordEvent(w,{id:"private-kiss",day:1,type:"kiss",actor:"alex",target:"sam",witnesses:[]});
  assert.equal(knownJealousyEvidence(w,"player").length,0);
  revealEvent(w,"private-kiss","player");
  assert.equal(knownJealousyEvidence(w,"player").length,1);
  assert.equal(knownJealousyEvidence(w,"sam").length,0); // Sam is single.
});
test("new ceremony can change pairing without assigning the player a partner",()=>{
  const w=world();
  runRecoupling(w,{playerChoice:"alex"});
  for(let i=1;i<14;i++)advanceDay(w);
  const result=runRecoupling(w,{playerChoice:null});
  assert.equal(partnerOf(w,"player"),null);
  assert.ok(result.singles.includes("player"));
});
test("player retains existing choice unless changed, and no ceremonies on other days",()=>{
  const w=world();
  runRecoupling(w,{playerChoice:"alex"});
  advanceDay(w);
  assert.throws(()=>runRecoupling(w),/No recoupling/);
  for(let i=2;i<14;i++)advanceDay(w);
  runRecoupling(w);
  assert.equal(partnerOf(w,"player"),"alex");
});
