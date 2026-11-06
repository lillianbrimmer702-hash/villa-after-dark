import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,recordEvent,revealEvent,serializeWorld,loadWorld} from "../src/relationship-engine.js";
import {journalFor,playerJournal} from "../src/journal.js";
function make(){
 const w=createWorld([{id:"player"},{id:"alex"},{id:"sam"}]);
 w.playerId="player";
 return w;
}
test("private NPC affair does not appear in the player's journal",()=>{
 const w=make();
 recordEvent(w,{id:"private-affair",day:1,type:"kiss",actor:"alex",target:"sam",witnesses:[]});
 assert.deepEqual(playerJournal(w),[]);
 assert.equal(journalFor(w,"alex").length,1);
});
test("a discovered secret becomes journal knowledge even across saves",()=>{
 const w=make();
 recordEvent(w,{id:"secret",day:1,type:"kiss",actor:"alex",target:"sam",witnesses:[]});
 revealEvent(w,"secret","player");
 const saved=loadWorld(serializeWorld(w));
 assert.equal(playerJournal(saved)[0].id,"secret");
 assert.equal(playerJournal(saved)[0].witnessedByMe,false);
 assert.equal("witnesses" in playerJournal(saved)[0],false);
});
test("public ceremonies are visible to witnesses",()=>{
 const w=make();
 recordEvent(w,{id:"public",day:1,type:"recoupling",actor:"alex",target:"sam",
  witnesses:["player"],source:"public-ceremony"});
 assert.equal(playerJournal(w).length,1);
 assert.equal(playerJournal(w)[0].witnessedByMe,true);
});
test("journal can be limited without changing the ledger",()=>{
 const w=make();
 for(let i=1;i<=5;i++)
  recordEvent(w,{id:"ev-"+i,day:1,type:"kindness",actor:"player",target:"alex",witnesses:[]});
 assert.equal(playerJournal(w,{limit:2}).length,2);
 assert.equal(w.events.length,5);
 assert.throws(()=>playerJournal(w,{limit:-1}),/limit/);
});
