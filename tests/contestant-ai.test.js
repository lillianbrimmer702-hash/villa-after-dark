import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorld, recordEvent, revealEvent } from "../src/relationship-engine.js";
import { createPersonality, scoreAction, rankActions, chooseAction, knownDealbreakers } from "../src/contestant-ai.js";
const make = () => createWorld([
  {id:"alex",name:"Alex",personality:createPersonality({traits:["loyal","romantic","honest","empathetic","forgiving"],dealbreakers:["betrayal"]})},
  {id:"sam",name:"Sam",personality:createPersonality({traits:["jealous","impulsive","competitive","outgoing","flirtatious"]})},
  {id:"player",name:"Player",personality:createPersonality({traits:["shy","cautious","independent","secretive","ambitious"]})}
]);
test("exactly five unique recognized traits",()=>{
 assert.throws(()=>createPersonality({traits:["loyal","loyal","shy","honest","romantic"]}),/five unique/);
 assert.throws(()=>createPersonality({traits:["loyal","shy","honest","romantic","wizard"]}),/Unknown trait/);
});
test("known betrayal changes action ranking and triggers dealbreaker",()=>{
 const w=make();
 const before=scoreAction(w,"alex","player","confront");
 recordEvent(w,{id:"secret",day:1,type:"betrayal",actor:"player",target:"sam",witnesses:[]});
 // Alex is not part of the event and has no access to it.
 assert.equal(knownDealbreakers(w,"alex","sam").length,0);
 assert.equal(scoreAction(w,"alex","sam","confront"),scoreAction(make(),"alex","sam","confront"));
 revealEvent(w,"secret","alex");
 assert.deepEqual(knownDealbreakers(w,"alex","sam"),["betrayal"]);
 assert.ok(scoreAction(w,"alex","sam","confront")>before);
});
test("ranking is deterministic and returns known actions",()=>{
 const w=make();
 assert.deepEqual(rankActions(w,"sam","player"),rankActions(w,"sam","player"));
 assert.equal(chooseAction(w,"sam","player").action,rankActions(w,"sam","player")[0].action);
 assert.equal(rankActions(w,"sam","player").length,5);
});
