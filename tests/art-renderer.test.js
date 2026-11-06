import {test} from "node:test";
import assert from "node:assert/strict";
import {createAppearance,REALISM_STYLE_ID} from "../src/character-style.js";
import {planCharacterRender} from "../src/art-renderer.js";
const appearance=createAppearance();
function makeManifest(){
 const f=appearance.features;
 const img=name=>"assets/test/"+name+".webp";
 const v={
   body:{[[f.skinTone,f.bodyType].join("|")]:img("body")},
   face:{[[f.faceShape,f.noseShape,f.lipShape,f.eyeColor].join("|")]:img("face")},
   tattoos:{[f.tattoo]:img("tattoo")},
   makeup:{[f.makeup]:img("makeup")},
   piercings:{[f.piercing]:img("piercing")},
   hair:{[[f.hairTexture,f.hairLength,f.hairColor].join("|")]:img("hair")},
   garments:{"top-01":img("top"),"bottom-01":img("bottom"),"shoes-01":img("shoes")}
 };
 return {styleId:REALISM_STYLE_ID,characters:{alex:{
    styleId:REALISM_STYLE_ID,portrait:img("portrait"),fullBody:img("fullbody"),
    variants:{portrait:v,fullBody:v}
  }}};
}
test("full-body render requires actual aligned art for selected clothing",()=>{
 const m=makeManifest();
 const planned=planCharacterRender(m,"alex",appearance);
 assert.equal(planned.layers.length,9);
 assert.ok(planned.layers.every(path=>path.startsWith("assets/")));
});
test("face portrait uses the same detailed person, excluding shoes",()=>{
 const m=makeManifest();
 const plan=planCharacterRender(m,"alex",appearance,"portrait");
 assert.equal(plan.personId,"alex");
 assert.equal(plan.layers.length,6);
 assert.ok(!plan.layers.includes("assets/test/shoes.webp"));
});
test("missing real hair art is an error, not a cartoon fallback",()=>{
 const m=makeManifest();
 delete m.characters.alex.variants.fullBody.hair;
 assert.throws(()=>planCharacterRender(m,"alex",appearance),/Missing actual artwork for hair/);
});
test("cannot silently render an unavailable outfit or another visual pipeline",()=>{
 const m=makeManifest();
 const outfit={...appearance,outfit:{...appearance.outfit,dress:"dress-01",top:null,bottom:null}};
 assert.throws(()=>planCharacterRender(m,"alex",outfit),/garment/);
 assert.throws(()=>planCharacterRender({...m,styleId:"cartoon"},"alex",appearance),/Art style mismatch/);
});
