import {test} from "node:test";
import assert from "node:assert/strict";
import {startSeason,completeDay,contestantView} from "../src/season.js";
import {createPersonality,scoreAction} from "../src/contestant-ai.js";
import {recordEvent,revealEvent,serializeWorld,loadWorld} from "../src/relationship-engine.js";
import {runRecoupling,partnerOf,knownJealousyEvidence} from "../src/coupling.js";
import {tellSecret} from "../src/gossip.js";

const traits=["jealous","impulsive","romantic","honest","outgoing"];
const p=(id,isPlayer=false)=>({
 id,name:id,gender:id==="player"?"woman":"man",
 attractedTo:["man","woman"],
 personality:createPersonality({traits,dealbreakers:["betrayal"]}),
 isPlayer
});
const make=()=>startSeason(p("player",true),Array.from({length:11},(_,i)=>p("npc"+i)));

test("a revealed secret creates jealousy and changes confrontation score",()=>{
 const w=make();
 runRecoupling(w,{playerChoice:"npc0"});
 const before=scoreAction(w,"player","npc0","confront");
 recordEvent(w,{id:"outside-kiss",type:"kiss",day:1,actor:"npc0",target:"npc1",witnesses:[]});
 assert.equal(knownJealousyEvidence(w,"player").length,0);
 assert.equal(scoreAction(w,"player","npc0","confront"),before);
 revealEvent(w,"outside-kiss","player");
 assert.equal(knownJealousyEvidence(w,"player").length,1);
 assert.ok(scoreAction(w,"player","npc0","confront")>before);
});
test("gossip lets an NPC witness tell the player about a secret",()=>{
 const w=make();
 recordEvent(w,{id:"outside-kiss",type:"kiss",day:1,actor:"npc0",target:"npc1",witnesses:[]});
 assert.equal(contestantView(w,"player").memories.length,0);
 tellSecret(w,{teller:"npc1",listener:"player",eventId:"outside-kiss"});
 assert.ok(contestantView(w,"player").memories.some(e=>e.id==="outside-kiss"));
 assert.equal(w.gossipLog.length,1);
});
test("day 14 actually holds an NPC recoupling while respecting the player",()=>{
 const w=make();
 runRecoupling(w,{playerChoice:"npc0"});
 let ceremonyCount=0;
 for(let day=1;day<=15;day++){
   const result=completeDay(w);
   if(result.ceremony)ceremonyCount++;
 }
 assert.equal(ceremonyCount,1);
 assert.deepEqual(w.ceremonies.map(c=>c.day),[1,14]);
 assert.equal(partnerOf(w,"player"),"npc0");
 assert.equal(w.day,16);
 const reloaded=loadWorld(serializeWorld(w));
 assert.deepEqual(reloaded.ceremonies,w.ceremonies);
 assert.equal(reloaded.day,16);
});
test("generated appearance is attached to all season contestants",()=>{
 const w=make();
 const ids=Object.keys(w.people);
 assert.equal(ids.length,12);
 assert.equal(new Set(ids.map(id=>w.people[id].appearance.styleId)).size,1);
 assert.ok(ids.every(id=>w.people[id].appearance.features.skinTone));
});
