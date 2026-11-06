import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,serializeWorld,loadWorld,memoriesOf} from "../src/relationship-engine.js";
import {availableConfessionals,recordConfessional,airConfessional,playerConfessionals} from "../src/beach-hut.js";
const make=()=>{const w=createWorld([{id:"player"},{id:"alex"}]);w.playerId="player";return w};
test("private confessional survives save without leaking to NPC",()=>{
 const w=make();
 assert.ok(availableConfessionals(w).some(p=>p.id==="first-night"));
 const entry=recordConfessional(w,{promptId:"first-night",text:"I think Alex is attractive."});
 assert.equal(entry.aired,false);
 assert.equal(memoriesOf(w,"alex").length,0);
 assert.equal(availableConfessionals(w).some(p=>p.id==="first-night"),false);
 const saved=loadWorld(serializeWorld(w));
 assert.equal(playerConfessionals(saved)[0].text,"I think Alex is attractive.");
 assert.equal(memoriesOf(saved,"alex").length,0);
});
test("airing is an explicit decision and does not make contestants omniscient",()=>{
 const w=make();
 const entry=recordConfessional(w,{promptId:"first-night",text:"I'm unsure who to trust."});
 const aired=airConfessional(w,entry.id);
 assert.equal(aired.airDay,1);
 assert.equal(aired.aired,true);
 assert.equal(memoriesOf(w,"alex").length,0);
 assert.throws(()=>airConfessional(w,entry.id),/already aired/);
});
test("confessionals require nonempty reasonable-length reflections",()=>{
 const w=make();
 assert.throws(()=>recordConfessional(w,{promptId:"first-night",text:""}),/Confessional must/);
 assert.throws(()=>recordConfessional(w,{promptId:"missing",text:"Hi"}),/not available/);
});
