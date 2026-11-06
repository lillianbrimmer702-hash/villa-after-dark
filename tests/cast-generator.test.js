import {test} from "node:test";
import assert from "node:assert/strict";
import {generateCast} from "../src/cast-generator.js";
import {startSeason} from "../src/season.js";
test("same seed generates same cast",()=>assert.deepEqual(generateCast("alpha"),generateCast("alpha")));
test("cast has eleven distinct adults with five traits each",()=>{
 const cast=generateCast("lilly");
 assert.equal(cast.length,11);
 assert.equal(new Set(cast.map(p=>p.id)).size,11);
 assert.equal(new Set(cast.map(p=>p.name)).size,11);
 for(const p of cast){
  assert.ok(p.age>=21&&p.age<=35);
  assert.equal(p.personality.traits.length,5);
  assert.equal(new Set(p.personality.traits).size,5);
  assert.ok(p.backstory.length>30);
  assert.ok(p.secret.length>0);
 }
});
test("generated cast can start a full season",()=>{
 const world=startSeason({id:"player",name:"Player"},generateCast("alpha"));
 assert.equal(Object.keys(world.people).length,12);
});
test("invalid cast sizes are rejected",()=>{
 assert.throws(()=>generateCast("alpha",12),/1–11/);
});
