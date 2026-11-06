import {test} from "node:test";
import assert from "node:assert/strict";
import {createSeasonOneCast,STARTING_ROSTER} from "../src/season-one-cast.js";
import {validateAppearance} from "../src/character-style.js";
import {startSeason} from "../src/season.js";
test("approved Season 1 has 6 male and 5 female NPCs",()=>{
 const cast=createSeasonOneCast();
 assert.equal(cast.length,11);
 assert.equal(cast.filter(x=>x.gender==="man").length,6);
 assert.equal(cast.filter(x=>x.gender==="woman").length,5);
 assert.equal(STARTING_ROSTER.length,11);
 assert.deepEqual(cast.map(x=>x.name),[
   "Luca","Ezra","Mason","Andre","Nico","Rafael",
   "Sienna","Jade","Skye","Valentina","Mila"]);
});
test("all named contestants are adult, unique and game-ready",()=>{
 const cast=createSeasonOneCast();
 assert.equal(new Set(cast.map(x=>x.id)).size,11);
 for(const c of cast){
  assert.ok(c.age>=21&&c.age<=35);
  assert.equal(c.personality.traits.length,5);
  assert.ok(c.secret.length>10);
  assert.ok(c.backstory.length>50);
  assert.ok(c.attractedTo.length>=1);
  assert.doesNotThrow(()=>validateAppearance(c.appearance));
 }
});
test("individual cast edits cannot mutate future sessions",()=>{
 const cast=createSeasonOneCast();
 cast[0].personality.traits.push("forged");
 cast[0].appearance.features.skinTone="invalid";
 const next=createSeasonOneCast();
 assert.equal(next[0].personality.traits.length,5);
 assert.equal(next[0].appearance.features.skinTone,"tan");
});
test("player identity remains theirs, with 12 total islanders",()=>{
 const world=startSeason({id:"player",name:"Custom Name",gender:"woman"},
   createSeasonOneCast());
 assert.equal(world.people.player.name,"Custom Name");
 assert.equal(Object.keys(world.people).length,12);
 assert.equal(Object.values(world.people).filter(x=>x.gender==="woman").length,6);
 assert.equal(Object.values(world.people).filter(x=>x.gender==="man").length,6);
});
