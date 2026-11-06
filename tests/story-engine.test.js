import {test} from "node:test";
import assert from "node:assert/strict";
import {startSeason} from "../src/season.js";
import {createPersonality} from "../src/contestant-ai.js";
import {availableScenes,chooseStoryOption,STORY_SCENES} from "../src/story-engine.js";
import {runRecoupling} from "../src/coupling.js";
import {memoriesOf,serializeWorld,loadWorld,advanceDay} from "../src/relationship-engine.js";
const traits=["loyal","romantic","honest","outgoing","empathetic"];
const p=id=>({id,name:id,personality:createPersonality({traits})});
const make=()=>startSeason(p("player"),Array.from({length:11},(_,i)=>p("npc"+i)));
test("authored story library offers distinct scenes and meaningful choices",()=>{
 assert.ok(STORY_SCENES.length>=15);
 assert.equal(new Set(STORY_SCENES.map(x=>x.id)).size,STORY_SCENES.length);
 assert.ok(STORY_SCENES.every(x=>x.choices.length===3));
});
test("story choice records a real private memory and cannot replay",()=>{
 const w=make();
 const scene=availableScenes(w,"npc0").find(x=>x.id==="first-glance");
 assert.ok(scene);
 const result=chooseStoryOption(w,{targetId:"npc0",sceneId:"first-glance",choiceId:"warm"});
 assert.ok(result.response.length>0);
 assert.equal(memoriesOf(w,"npc0").filter(e=>e.id===result.eventId).length,1);
 assert.equal(memoriesOf(w,"npc1").filter(e=>e.id===result.eventId).length,0);
 assert.throws(()=>chooseStoryOption(w,{targetId:"npc0",sceneId:"first-glance",choiceId:"warm"}),/not available/);
 const restored=loadWorld(serializeWorld(w));
 assert.ok(!availableScenes(restored,"npc0").some(s=>s.id==="first-glance"));
});
test("coupled-only story appears after pairing",()=>{
 const w=make();
 for(let i=1;i<14;i++)advanceDay(w);
 assert.ok(!availableScenes(w,"npc0").some(s=>s.id==="firepit-question"));
 runRecoupling(w,{playerChoice:"npc0"});
 assert.ok(availableScenes(w,"npc0").some(s=>s.id==="firepit-question"));
});
test("invalid choice does not mutate event ledger",()=>{
 const w=make();
 assert.throws(()=>chooseStoryOption(w,{targetId:"npc0",sceneId:"first-glance",choiceId:"imaginary"}),/Unknown/);
 assert.equal(w.events.length,0);
});
