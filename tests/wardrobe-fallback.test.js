import {test} from "node:test";
import assert from "node:assert/strict";
import {startSeason} from "../src/season.js";
import {createSeasonOneCast} from "../src/season-one-cast.js";
import {createPlayerProfile} from "../src/player-profile.js";
import {saveSlot} from "../src/save-slots.js";

test("legacy unsupported outfits never display an incorrect illustrated bikini",async()=>{
 const data=new Map(),callbacks={},app={innerHTML:"",addEventListener:(n,cb)=>callbacks[n]=cb};
 globalThis.document={getElementById:id=>id==="app"?app:null};
 globalThis.window={scrollTo(){},confirm(){return true}};
 globalThis.localStorage={
  getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
 };
 const world=startSeason(createPlayerProfile({
  name:"Skylar",gender:"woman",age:23,hometown:"Phoenix",occupation:"Artist",
  traits:["empathetic","honest","loyal","romantic","cautious"]
 }),createSeasonOneCast());
 assert.equal(world.people.player.appearance.outfit.swimwear,null);
 saveSlot(localStorage,"visual-season-one",world);
 await import("../play/app.js");
 assert.match(app.innerHTML,/avatar-unavailable/);
 assert.doesNotMatch(app.innerHTML,/data-look="swimwear-01"/);
 const click=(action,extra={})=>callbacks.click({
  target:{closest:()=>({dataset:{action,...extra}})}
 });
 click("nav",{tab:"wardrobe"});
 assert.match(app.innerHTML,/avatar-unavailable/);
 click("photo-outfit",{outfit:"swimwear-06"});
 assert.match(app.innerHTML,/data-look="swimwear-06"/);
 assert.doesNotMatch(app.innerHTML,/avatar-unavailable/);
 const saved=JSON.parse(data.get("villa-after-dark:save:visual-season-one"));
 assert.equal(saved.world.people.player.appearance.outfit.swimwear,"swimwear-06");
});
