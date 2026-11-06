import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,recordEvent} from "../src/relationship-engine.js";
import {saveSlot,loadSlot,deleteSlot,listSlots} from "../src/save-slots.js";
const memoryStorage=()=>{
 const map=new Map();
 return {get length(){return map.size},key:i=>[...map.keys()][i]??null,
 setItem:(k,v)=>map.set(k,String(v)),getItem:k=>map.has(k)?map.get(k):null,
 removeItem:k=>map.delete(k)};
};
test("multiple slots preserve world and secrets",()=>{
 const storage=memoryStorage();
 const w=createWorld([{id:"p"},{id:"a"},{id:"b"}]);
 recordEvent(w,{id:"e1",day:1,type:"kiss",actor:"p",target:"a",witnesses:[]});
 saveSlot(storage,"slot1",w,{title:"First game"});
 saveSlot(storage,"slot2",w,{title:"Second game"});
 assert.equal(listSlots(storage).length,2);
 const loaded=loadSlot(storage,"slot1");
 assert.equal(loaded.world.events.length,1);
 assert.deepEqual(loaded.world.knowledge.b,[]);
 deleteSlot(storage,"slot1");
 assert.equal(loadSlot(storage,"slot1"),null);
 assert.equal(listSlots(storage).length,1);
});
test("slot names are validated",()=>{
 const storage=memoryStorage(),w=createWorld([{id:"p"},{id:"a"}]);
 assert.throws(()=>saveSlot(storage,"../../bad",w),/Invalid/);
});
