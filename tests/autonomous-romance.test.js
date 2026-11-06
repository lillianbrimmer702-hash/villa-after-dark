import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,advanceDay,memoriesOf,serializeWorld,loadWorld} from "../src/relationship-engine.js";
import {romancePotential,npcRomanceOpportunity} from "../src/autonomous-romance.js";
const make=()=>{
 const traits=["romantic","flirtatious","outgoing","honest","empathetic"];
 const w=createWorld([
  {id:"player",isPlayer:true,gender:"woman",attractedTo:["man"]},
  {id:"alex",gender:"man",attractedTo:["woman"],personality:{traits,interests:["music"]}},
  {id:"sam",gender:"woman",attractedTo:["man"],personality:{traits,interests:["music"]}},
  {id:"kai",gender:"man",attractedTo:["woman"],personality:{traits,interests:["sports"]}}
 ]);
 w.playerId="player";
 return w;
};
const day=(w,d)=>{while(w.day<d)advanceDay(w)};
test("two mutually attracted NPCs can date without player participation",()=>{
 const w=make(); day(w,3);
 const possible=romancePotential(w,"alex","sam");
 assert.equal(possible.eligible,true);
 const romance=npcRomanceOpportunity(w,{actor:"alex",target:"sam",location:"pool",action:"flirt"});
 assert.equal(romance.type,"date");
 assert.equal(w.events.length,1);
 assert.equal(memoriesOf(w,"player").length,0);
 assert.equal(memoriesOf(w,"sam").length,1);
 assert.equal(npcRomanceOpportunity(w,{actor:"alex",target:"sam",location:"pool",action:"bond"}),null);
 const saved=loadWorld(serializeWorld(w));
 assert.equal(saved.romanceLog.length,1);
});
test("player and incompatible pair cannot be automatically romantic",()=>{
 const w=make();day(w,3);
 assert.equal(romancePotential(w,"player","alex").reason,"player-choice-required");
 assert.equal(romancePotential(w,"alex","kai").reason,"not-mutually-attracted");
 assert.equal(npcRomanceOpportunity(w,{actor:"alex",target:"player",location:"pool",action:"flirt"}),null);
 assert.equal(w.events.length,0);
});
test("hostile interactions and wrong days cannot become dates",()=>{
 const w=make();day(w,3);
 assert.equal(npcRomanceOpportunity(w,{actor:"alex",target:"sam",location:"pool",action:"confront"}),null);
 advanceDay(w);
 assert.equal(npcRomanceOpportunity(w,{actor:"alex",target:"sam",location:"pool",action:"flirt"}),null);
 assert.equal(w.events.length,0);
});
