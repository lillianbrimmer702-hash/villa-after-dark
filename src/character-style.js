/**
 * Character style data model. The player and every NPC share this schema.
 *
 * IMPORTANT: Data-only. Realistic images and aligned clothing layers still
 * need to be authored; no visual option may be presented as working in the
 * final UI until the corresponding art assets actually exist.
 */
export const REALISM_STYLE_ID = "villa-digital-human-v1";
export const APPEARANCE_OPTIONS = Object.freeze({
  skinTone: ["porcelain","fair-neutral","fair-warm","light-olive","golden","tan","warm-brown","deep-brown","rich-espresso","deep-neutral"],
  eyeColor: ["dark-brown","brown","amber","hazel","green","gray","blue"],
  faceShape: ["oval","round","heart","square","diamond","long"],
  noseShape: ["button","straight","aquiline","rounded","broad","upturned"],
  lipShape: ["defined","full","wide","soft","bow-shaped"],
  hairTexture: ["straight","wavy","curly","coily","braided","locs"],
  hairLength: ["buzz","short","shoulder","long","extra-long"],
  hairColor: ["jet-black","black-brown","dark-brown","chocolate","auburn","copper","honey-blonde","platinum","silver","rose"],
  bodyType: ["petite","slender","athletic","curvy","muscular","full-figured"],
  makeup: ["none","soft-glam","bronzed-glam","editorial","evening-glam"],
  tattoo: ["none","fine-line","floral","script","geometric","full-sleeve"],
  piercing: ["none","studs","hoops","nose-stud","septum","multiple-ear"]
});
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const OPTIONS = Object.keys(APPEARANCE_OPTIONS);
const CATALOG_INPUT = Object.freeze({
  dress: ["Satin Slip Dress","Crystal Mini Dress","Open-Back Gown","Silk Wrap Dress","Sunset Maxi","Cutout Halter Dress","One-Shoulder Mini","Draped Jersey Dress","Sequin Cocktail Dress","Corset Dress"],
  top: ["Linen Shirt","Silk Camisole","Ribbed Tank","Halter Top","Cropped Shirt","Sheer Button-Up","Structured Corset","Relaxed Tee","Strapless Top","Off-Shoulder Blouse"],
  bottom: ["Tailored Shorts","Mini Skirt","Silk Midi Skirt","Linen Trousers","Wide-Leg Jeans","Cargo Pants","Pleated Skirt","Tailored Slacks","Denim Shorts","Satin Maxi Skirt"],
  shoes: ["Strappy Heels","Leather Sandals","White Trainers","Platform Heels","Ankle Boots","Satin Pumps","Espadrilles","Minimal Loafers","Metallic Heels","Slide Sandals"],
  swimwear: ["White Bikini","Black Triangle Bikini","Sculpted One-Piece","High-Waisted Two-Piece","Resort Swim Shorts","Linen Cover-Up Set","Cutout Swimsuit","Textured Swim Set","Halter Swimsuit","Board Shorts Set"],
  accessory: ["Gold Hoop Earrings","Layered Necklace","Pearl Studs","Statement Cuff","Silk Scarf","Minimal Watch","Silver Rings","Cat-Eye Sunglasses","Gold Anklet","Beaded Necklace"]
});
export const GARMENTS = Object.freeze(Object.entries(CATALOG_INPUT).flatMap(([category, names]) =>
  names.map((name,index) => Object.freeze({
    id:`${category}-${String(index+1).padStart(2,"0")}`,
    category, name, cost:0,
    // Art is deliberately absent until the real texture layer exists.
    artKey:null
  }))
));
const garment = id => GARMENTS.find(g => g.id === id);
export function validateAppearance(appearance) {
  assert(appearance && appearance.styleId === REALISM_STYLE_ID, "Wrong visual pipeline");
  for (const option of OPTIONS) {
    assert(APPEARANCE_OPTIONS[option].includes(appearance.features?.[option]),"Invalid "+option);
  }
  assert(appearance.outfit && typeof appearance.outfit === "object", "Missing outfit");
  for(const [slot,id] of Object.entries(appearance.outfit)) {
    assert(Object.hasOwn(CATALOG_INPUT,slot), "Invalid wardrobe slot");
    assert(id===null || garment(id)?.category===slot,"Invalid garment for "+slot);
  }
  assert(Array.isArray(appearance.savedLooks), "Missing saved looks");
  return true;
}
export function createAppearance(features={},outfit={}) {
  const defaults=Object.fromEntries(OPTIONS.map(k=>[k,APPEARANCE_OPTIONS[k][0]]));
  const appearance={
    styleId:REALISM_STYLE_ID,
    features:{...defaults,...features},
    outfit:{dress:null,top:"top-01",bottom:"bottom-01",shoes:"shoes-01",swimwear:null,accessory:null,...outfit},
    savedLooks:[]
  };
  validateAppearance(appearance);
  return appearance;
}
function prng(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};}
export function generateAppearance(seed) {
  const random=prng(seed);
  const features=Object.fromEntries(OPTIONS.map(k=>{
    const values=APPEARANCE_OPTIONS[k];
    return [k,values[Math.floor(random()*values.length)]];
  }));
  return createAppearance(features);
}
export function changeFeature(appearance,feature,value){
  assert(OPTIONS.includes(feature),"Unknown appearance feature");
  assert(APPEARANCE_OPTIONS[feature].includes(value),"Unavailable appearance option");
  const updated={...appearance,features:{...appearance.features,[feature]:value}};
  validateAppearance(updated);
  return updated;
}
export function equip(appearance,itemId){
  const item=garment(itemId);
  assert(item,"Unknown garment");
  const outfit={...appearance.outfit,[item.category]:item.id};
  if(item.category==="dress"||item.category==="swimwear"){
    outfit.dress=item.category==="dress"?item.id:null;
    outfit.swimwear=item.category==="swimwear"?item.id:null;
    outfit.top=null; outfit.bottom=null;
  } else if(item.category==="top"||item.category==="bottom"){
    outfit.dress=null; outfit.swimwear=null;
  }
  const updated={...appearance,outfit};
  validateAppearance(updated);
  return updated;
}
export function saveLook(appearance,title){
  assert(typeof title==="string"&&title.trim()&&title.length<=60,"Invalid saved look title");
  const next={...appearance,savedLooks:[
    ...appearance.savedLooks,
    {id:`look-${appearance.savedLooks.length+1}`,title:title.trim(),
      features:{...appearance.features},outfit:{...appearance.outfit}}
  ]};
  validateAppearance(next);
  return next;
}
/** Require complete portrait and full-body assets from one visual pipeline.
 * Rendering must not silently substitute SVG/cartoon fallbacks.
 */
export function validateArtManifest(manifest,characterIds){
  assert(manifest && manifest.styleId===REALISM_STYLE_ID,"Art style mismatch");
  assert(manifest.characters && typeof manifest.characters==="object","Missing character art");
  for(const id of characterIds){
    const entry=manifest.characters[id];
    assert(entry && typeof entry.portrait==="string" && /\.(webp|avif|png)$/i.test(entry.portrait),
      "Missing realistic portrait: "+id);
    assert(typeof entry.fullBody==="string" && /\.(webp|avif|png)$/i.test(entry.fullBody),
      "Missing realistic full-body art: "+id);
    assert(entry.styleId===REALISM_STYLE_ID,"Mismatched contestant art: "+id);
  }
  return true;
}
