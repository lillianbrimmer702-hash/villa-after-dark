import {test} from "node:test";
import assert from "node:assert/strict";
import {createPhotoWorld} from "./fixture-photo-world.js";
import {PHOTO_OUTFITS,choosePhotoOutfit,currentPhotoOutfit} from "../src/avatar-art.js";
import {serializeWorld,loadWorld} from "../src/relationship-engine.js";

test("two real-outfit photo frames have unique supported garment IDs",()=>{
 assert.deepEqual(PHOTO_OUTFITS.map(x=>x.id),["swimwear-01","swimwear-06"]);
 assert.deepEqual(PHOTO_OUTFITS.map(x=>x.frame),[0,1]);
});
test("dressing changes the correct player garment without changing identity or romance",()=>{
 const w=createPhotoWorld();
 const originalName=w.people.player.name;
 choosePhotoOutfit(w,"swimwear-01");
 assert.equal(currentPhotoOutfit(w).frame,0);
 choosePhotoOutfit(w,"swimwear-06");
 assert.equal(currentPhotoOutfit(w).frame,1);
 assert.equal(w.people.player.appearance.outfit.swimwear,"swimwear-06");
 assert.equal(w.people.player.name,originalName);
 const clone=loadWorld(serializeWorld(w));
 assert.equal(currentPhotoOutfit(clone).frame,1);
});
test("unillustrated wardrobe items cannot be called a visible change",()=>{
 const w=createPhotoWorld();
 assert.throws(()=>choosePhotoOutfit(w,"dress-01"),/matching realistic artwork/);
 assert.equal(w.people.player.appearance.outfit.swimwear,null);
});
