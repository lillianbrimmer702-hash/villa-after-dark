import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,recordEvent,advanceDay,serializeWorld,loadWorld} from "../src/relationship-engine.js";
import {ensureCouplingState,runRecoupling,partnerOf} from "../src/coupling.js";
import {activeContestants,introduceBombshell,audienceStandings,suggestedElimination,eliminateContestant} from "../src/cast-management.js";
const make=()=>{
 const w=createWorld([
  {id:"player",isPlayer:true,gender:"woman"},
  {id:"alex",gender:"man"},
  {id:"sam",gender:"woman"},
  {id:"kai",gender:"man"}
 ]);
 w.playerId="player";
 return ensureCouplingState(w);
};
const goTo=(w,day)=>{while(w.day<day)advanceDay(w)};
test("bombshell joins only on arrival day with separate memory",()=>{
 const w=make();
 assert.throws(()=>introduceBombshell(w,{id:"new",age:25}),/No bombshell/);
 goTo(w,11);
 const arrival=introduceBombshell(w,{id:"new",age:25,name:"Newcomer",gender:"woman"});
 assert.equal(arrival.day,11);
 assert.ok(activeContestants(w).includes("new"));
 assert.deepEqual(w.knowledge.new,[]);
 assert.ok(w.people.new.appearance.features.hairTexture);
 assert.throws(()=>introduceBombshell(w,{id:"other",age:26}),/already introduced/);
});
test("private romance cannot influence public standings",()=>{
 const w=make();
 const before=audienceStandings(w);
 recordEvent(w,{id:"secret",day:1,type:"kiss",actor:"alex",target:"sam",witnesses:[]});
 assert.deepEqual(audienceStandings(w),before);
});
test("eliminated people remain in history and partner becomes single",()=>{
 const w=make();
 runRecoupling(w,{playerChoice:"alex"});
 goTo(w,21);
 assert.equal(partnerOf(w,"player"),"alex");
 const removed=eliminateContestant(w,"alex");
 assert.equal(removed.formerPartner,"player");
 assert.equal(partnerOf(w,"player"),null);
 assert.ok(!activeContestants(w).includes("alex"));
 assert.ok(w.people.alex.eliminated);
 assert.ok(w.events.some(e=>e.type==="recoupling"&&(e.actor==="alex"||e.target==="alex")));
 assert.throws(()=>eliminateContestant(w,"sam"),/already completed/);
 const saved=loadWorld(serializeWorld(w));
 assert.equal(saved.people.alex.eliminatedDay,21);
});
test("a player is not silently eliminated by an unimplemented ending",()=>{
 const w=make();
 goTo(w,21);
 assert.notEqual(suggestedElimination(w),"player");
 assert.throws(()=>eliminateContestant(w,"player"),/Player exit/);
});
