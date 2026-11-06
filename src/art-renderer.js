/**
 * Original realistic 2D character renderer (asset-driven).
 *
 * The same renderer must be used for player and all NPCs. If an actual
 * illustrated layer is missing, throw an error. Never draw cartoon shapes,
 * swap in a mismatched preset, or pretend a dropdown changed the artwork.
 *
 * Art files are NOT included yet. This module is a renderer contract,
 * not evidence that realistic assets have been completed.
 */
import { validateAppearance, validateArtManifest } from "./character-style.js";
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const views=new Set(["portrait","fullBody"]);
const safePath=src=>typeof src==="string"&&
  /^(?:\.?\.\/)?assets\/[a-zA-Z0-9_./-]+\.(?:webp|avif|png)$/i.test(src) &&
  !src.includes("..");
const choose=(mapping,key,label)=>{
  const path=mapping?.[key];
  assert(safePath(path),"Missing actual artwork for "+label+" ("+key+")");
  return path;
};
const featureKey=(f,names)=>names.map(name=>f[name]).join("|");
export function planCharacterRender(manifest,personId,appearance,view="fullBody"){
  assert(views.has(view),"Unknown character view");
  validateAppearance(appearance);
  validateArtManifest(manifest,[personId]);
  const entry=manifest.characters[personId];
  const source=entry.variants?.[view];
  assert(source,"No illustrated customization set for "+personId+" "+view);
  const f=appearance.features;
  const layers=[
    choose(source.body,featureKey(f,["skinTone","bodyType"]),"body"),
    choose(source.face,featureKey(f,["faceShape","noseShape","lipShape","eyeColor"]),"face"),
    choose(source.tattoos,f.tattoo,"tattoos")
  ];
  if(view==="fullBody"){
    const outfit=appearance.outfit;
    const garments=[outfit.swimwear||outfit.dress].filter(Boolean);
    if(!garments.length)garments.push(outfit.top,outfit.bottom);
    garments.push(outfit.shoes);
    if(outfit.accessory)garments.push(outfit.accessory);
    for(const itemId of garments.filter(Boolean))
      layers.push(choose(source.garments,itemId,"garment"));
  }
  layers.push(choose(source.makeup,f.makeup,"makeup"));
  layers.push(choose(source.piercings,f.piercing,"piercings"));
  layers.push(choose(source.hair,featureKey(f,["hairTexture","hairLength","hairColor"]),"hair"));
  return {styleId:appearance.styleId,personId,view,layers};
}
/** Render a complete plan using one offscreen buffer to avoid exposing
 * half-drawn characters. Draw order is provided by the verified manifest.
 */
export async function paintCharacter(canvas,manifest,personId,appearance,view="fullBody"){
  assert(canvas&&typeof canvas.getContext==="function","Canvas required");
  assert(typeof Image==="function","Image decoding is not available");
  const plan=planCharacterRender(manifest,personId,appearance,view);
  const context=canvas.getContext("2d");
  assert(context,"2D rendering unavailable");
  const staging=document.createElement("canvas");
  staging.width=canvas.width;staging.height=canvas.height;
  const draw=staging.getContext("2d");
  assert(draw,"Cannot create render buffer");
  for(const path of plan.layers){
    const img=new Image();
    img.src=path;
    await img.decode();
    draw.drawImage(img,0,0,staging.width,staging.height);
  }
  context.clearRect(0,0,canvas.width,canvas.height);
  context.drawImage(staging,0,0);
  return plan;
}
