import {test} from "node:test";
import assert from "node:assert/strict";
import {startSeason,completeDay} from "../src/season.js";
import {generateCast} from "../src/cast-generator.js";
import {createAppearance,REALISM_STYLE_ID} from "../src/character-style.js";
import {BOMBSHELL_DAYS,ELIMINATION_DAYS,activeContestants} from "../src/cast-management.js";
import {contestantLocations} from "../src/villa-schedule.js";
import {serializeWorld,loadWorld} from "../src/relationship-engine.js";

test("full 90-day simulation runs with arrivals, exits and stable history",()=>{
 const world=startSeason({
  id:"player",name:"Player",age:25,gender:"woman",
  attractedTo:["man","woman","nonbinary"],appearance:createAppearance()
 },generateCast("release-test"));
 const initialIds=Object.keys(world.people);
 assert.equal(initialIds.length,12);
 for(let day=1;day<=90;day++){
   const report=completeDay(world);
   assert.equal(report.day,day);
   assert.equal(Boolean(report.arrival),BOMBSHELL_DAYS.includes(day));
   assert.equal(Boolean(report.elimination),ELIMINATION_DAYS.includes(day));
   assert.equal(Boolean(report.ceremony),day%14===0&&day<90);
 }
 assert.equal(world.day,90);
 assert.equal(world.arrivals.length,BOMBSHELL_DAYS.length);
 assert.equal(world.eliminations.length,ELIMINATION_DAYS.length);
 assert.equal(Object.keys(world.people).length,19);
 assert.equal(activeContestants(world).length,13);
 assert.equal(world.ceremonies.length,6);
 assert.equal(new Set(Object.values(world.people).map(p=>p.name)).size,19);
 assert.ok(Object.values(world.people).every(p=>p.appearance.styleId===REALISM_STYLE_ID));
 assert.ok(world.eliminations.every(e=>world.people[e.personId].eliminated));
 assert.ok(world.eliminations.every(e=>initialIds.includes(e.personId)||e.personId.startsWith("bombshell-")));
 const locations=contestantLocations(world);
 assert.ok(world.eliminations.every(e=>locations[e.personId]===undefined));
 assert.equal(new Set(world.events.map(e=>e.id)).size,world.events.length);
 const restored=loadWorld(serializeWorld(world));
 assert.equal(restored.day,90);
 assert.deepEqual(restored.arrivals,world.arrivals);
 assert.deepEqual(restored.eliminations,world.eliminations);
});
