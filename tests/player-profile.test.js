import {test} from "node:test";
import assert from "node:assert/strict";
import {createPlayerProfile,updatePlayerAppearance} from "../src/player-profile.js";
import {createAppearance,changeFeature,equip} from "../src/character-style.js";
import {startSeason} from "../src/season.js";
const traits=["loyal","romantic","outgoing","honest","empathetic"];
const options={name:"Test Player",gender:"woman",age:25,
  hometown:"Miami",occupation:"Designer",
  traits,backstory:"I came here to find love.",attractedTo:["man","woman"]};
test("creator accepts a complete validated player",()=>{
 const p=createPlayerProfile(options);
 assert.equal(p.age,25);
 assert.equal(p.personality.traits.length,5);
 assert.equal(p.appearance.outfit.top,"top-01");
 assert.deepEqual(p.attractedTo,["man","woman"]);
});
test("creator rejects minors, invalid traits and excessive backstories",()=>{
 assert.throws(()=>createPlayerProfile({...options,age:20}),/21–35/);
 assert.throws(()=>createPlayerProfile({...options,traits:["loyal"]}),/five unique/);
 assert.throws(()=>createPlayerProfile({...options,backstory:"x".repeat(2001)}),/backstory/);
 assert.throws(()=>createPlayerProfile({...options,attractedTo:["man","man"]}),/attraction/);
});
test("changing clothes and hair does not reset the season",()=>{
 const player=createPlayerProfile(options);
 const npc=Array.from({length:11},(_,i)=>({id:"npc"+i,name:"NPC"+i}));
 const world=startSeason(player,npc);
 const previousDay=world.day;
 const oldLook=world.people.player.appearance;
 const newLook=equip(changeFeature(oldLook,"hairTexture","curly"),"dress-04");
 updatePlayerAppearance(world,newLook);
 assert.equal(world.people.player.appearance.outfit.dress,"dress-04");
 assert.equal(world.people.player.appearance.features.hairTexture,"curly");
 assert.equal(world.day,previousDay);
 assert.equal(world.events.length,0);
});
