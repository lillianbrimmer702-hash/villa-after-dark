import {test} from "node:test";
import assert from "node:assert/strict";
import {APPEARANCE_OPTIONS,GARMENTS,REALISM_STYLE_ID,createAppearance,generateAppearance,changeFeature,equip,saveLook,validateAppearance,validateArtManifest} from "../src/character-style.js";
test("every generated character uses the same realistic art contract",()=>{
  const cast=Array.from({length:12},(_,i)=>generateAppearance("contestant-"+i));
  assert.equal(new Set(cast.map(c=>c.styleId)).size,1);
  assert.equal(cast[0].styleId,REALISM_STYLE_ID);
  assert.ok(new Set(cast.map(c=>JSON.stringify(c.features))).size>1);
  for(const appearance of cast)assert.equal(validateAppearance(appearance),true);
});
test("wardrobe contains 60 free mix-and-match garments",()=>{
  assert.equal(GARMENTS.length,60);
  assert.equal(new Set(GARMENTS.map(x=>x.id)).size,60);
  assert.ok(GARMENTS.every(x=>x.cost===0 && x.artKey===null));
});
test("features, outfits and saved looks are changeable data",()=>{
  let appearance=createAppearance();
  appearance=changeFeature(appearance,"hairTexture","coily");
  appearance=equip(appearance,"dress-02");
  assert.equal(appearance.outfit.top,null);
  assert.equal(appearance.outfit.bottom,null);
  appearance=saveLook(appearance,"Firepit night");
  appearance=equip(appearance,"top-02");
  assert.equal(appearance.outfit.dress,null);
  assert.equal(appearance.savedLooks[0].outfit.dress,"dress-02");
  assert.equal(appearance.savedLooks[0].features.hairTexture,"coily");
});
test("cannot claim art is complete when model or portraits are missing",()=>{
 const manifest={styleId:REALISM_STYLE_ID,characters:{
   player:{styleId:REALISM_STYLE_ID,portrait:"player-face.webp",fullBody:"player-body.webp"},
   alex:{styleId:REALISM_STYLE_ID,portrait:"alex-face.webp",fullBody:"alex-body.webp"}
 }};
 assert.equal(validateArtManifest(manifest,["player","alex"]),true);
 assert.throws(()=>validateArtManifest(manifest,["player","alex","sam"]),/Missing realistic portrait/);
 assert.throws(()=>validateArtManifest({...manifest,styleId:"cartoon"},["player"]),/Art style mismatch/);
});
test("invalid feature cannot be silently accepted",()=>{
 assert.throws(()=>changeFeature(createAppearance(),"hairTexture","unrendered-magic-hair"),/Unavailable/);
 assert.throws(()=>validateAppearance({}),/Wrong visual/);
});
