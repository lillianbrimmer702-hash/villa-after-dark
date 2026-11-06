import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld} from "../src/relationship-engine.js";
import {dailyAgenda,contestantLocations,socialOpportunities,advanceVillaDay} from "../src/villa-schedule.js";
const world=()=>createWorld([{id:"p"},{id:"a"},{id:"b"},{id:"c"}]);
test("90-day agenda includes milestones",()=>{
 const w=world();
 assert.ok(dailyAgenda(w,1).events.some(e=>e.type==="arrival"));
 assert.ok(dailyAgenda(w,14).events.some(e=>e.type==="recoupling"));
 assert.ok(dailyAgenda(w,9).events.some(e=>e.type==="challenge"));
 assert.ok(dailyAgenda(w,11).events.some(e=>e.type==="bombshell"));
 assert.ok(dailyAgenda(w,90).events.some(e=>e.type==="finale"));
 assert.throws(()=>dailyAgenda(w,91),/Invalid/);
});
test("locations and opportunities are deterministic",()=>{
 const w=world();
 assert.deepEqual(contestantLocations(w),contestantLocations(w));
 assert.deepEqual(socialOpportunities(w),socialOpportunities(w));
 assert.equal(w.events.length,0);
});
test("advance never exceeds day 90",()=>{
 const w=world();
 for(let i=1;i<90;i++)advanceVillaDay(w);
 assert.equal(w.day,90);
 const last=advanceVillaDay(w);
 assert.equal(last.next.day,90);
});
