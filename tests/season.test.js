import { test } from "node:test";
import assert from "node:assert/strict";
import { createPersonality } from "../src/contestant-ai.js";
import { startSeason, simulateCurrentDay, completeDay, contestantView } from "../src/season.js";
import { serializeWorld, loadWorld } from "../src/relationship-engine.js";

const traits = ["romantic", "loyal", "honest", "outgoing", "empathetic"];
const p = id => ({ id, name: id, personality: createPersonality({ traits }) });
const make = () => startSeason(p("player"), Array.from({length:11},(_,i)=>p("npc"+i)));

test("season requires the player plus exactly 11 contestants",()=>{
  assert.throws(()=>startSeason(p("player"),[]),/exactly 11/);
  const w=make();
  assert.equal(Object.keys(w.people).length,12);
  assert.equal(w.day,1);
});
test("social day is safe to run once and never automates player consent",()=>{
  const w=make();
  const report=simulateCurrentDay(w);
  assert.equal(report.day,1);
  assert.ok(report.interactions.every(e=>e.actor!=="player"&&e.target!=="player"));
  assert.ok(report.interactions.every(e=>e.action!==undefined));
  assert.ok(report.interactions.every(e=>e.eventId===null || w.events.some(x=>x.id===e.eventId)));
  assert.throws(()=>simulateCurrentDay(w),/already simulated/);
});
test("season reaches day 90 without creating day 91",()=>{
  const w=make();
  for(let day=1;day<=90;day++){
    const r=completeDay(w);
    assert.equal(r.day,day);
    assert.equal(r.seasonComplete,day===90);
  }
  assert.equal(w.day,90);
  assert.equal(w.simulatedDays.length,90);
  assert.throws(()=>completeDay(w),/already simulated/);
});
test("simulation preserves memory and reports through save/load",()=>{
  const w=make();
  completeDay(w);
  const saved=loadWorld(serializeWorld(w));
  assert.equal(saved.day,2);
  assert.equal(saved.simulatedDays.length,1);
  assert.deepEqual(contestantView(saved,"npc0"),contestantView(w,"npc0"));
});
test("unrelated contestants do not see strangers' private events",()=>{
  const w=make();
  const report=simulateCurrentDay(w);
  const event=report.interactions.find(x=>x.eventId);
  if(!event)return;
  const outsider=Object.keys(w.people).find(id=>id!==event.actor&&id!==event.target);
  assert.ok(!contestantView(w,outsider).memories.some(e=>e.id===event.eventId));
});
