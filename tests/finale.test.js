import {test} from "node:test";
import assert from "node:assert/strict";
import {createPersonality} from "../src/contestant-ai.js";
import {startSeason,completeDay} from "../src/season.js";
import {runRecoupling} from "../src/coupling.js";
import {recordEvent,serializeWorld,loadWorld} from "../src/relationship-engine.js";
import {previewFinale,resolveFinale,reunionSummary} from "../src/finale.js";
const traits=["loyal","romantic","honest","empathetic","forgiving"];
const p=id=>({id,name:id,gender:id==="player"?"woman":"man",attractedTo:["woman","man"],personality:createPersonality({traits})});
const make=()=>startSeason(p("player"),Array.from({length:11},(_,i)=>p("npc"+i)));
const finish=w=>{for(let i=1;i<=90;i++)completeDay(w)};
test("finale cannot resolve before the season is complete",()=>{
 const w=make();
 assert.throws(()=>resolveFinale(w),/Finish all 90/);
});
test("single player has independent ending and a saved reunion",()=>{
 const w=make();
 finish(w);
 const ending=resolveFinale(w);
 assert.equal(ending.ending,"independent");
 assert.equal(ending.playerPartner,null);
 assert.equal(ending.locked,true);
 assert.throws(()=>resolveFinale(w),/already resolved/);
 const reunion=reunionSummary(loadWorld(serializeWorld(w)));
 assert.equal(reunion.arrivals,7);
 assert.equal(reunion.eliminations,6);
});
test("couples can have positive ending based on their actual history",()=>{
 const w=make();
 runRecoupling(w,{playerChoice:"npc0"});
 for(let i=0;i<5;i++)
   recordEvent(w,{id:"warm-"+i,day:1,type:"date",actor:"player",target:"npc0",witnesses:[]});
 finish(w);
 const result=previewFinale(w);
 assert.equal(result.playerPartner,"npc0");
 assert.ok(["lasting_love","new_beginning","bittersweet"].includes(result.ending));
 assert.equal(w.finale,undefined);
 const locked=resolveFinale(w);
 assert.equal(locked.ending,result.ending);
});
