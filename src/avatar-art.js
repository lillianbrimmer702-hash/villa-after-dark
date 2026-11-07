/**
 * Real-photo outfit preview contract for the first avatar studio.
 *
 * This is deliberately a limited, honest pre-rendered clothing system:
 * these two complete images show the same adult character in the same
 * white bikini, with or without a lace resort cover-up.
 *
 * It is not arbitrary pose-aware layer mixing or facial customization.
 * Once a real asset exists for each garment and character, extend this
 * catalog rather than swapping metadata against an unchanged portrait.
 */
import {equip} from "./character-style.js";
import {updatePlayerAppearance} from "./player-profile.js";

export const PHOTO_OUTFITS=Object.freeze([
 Object.freeze({id:"swimwear-01",title:"White Bikini",detail:"Poolside classic",frame:0}),
 Object.freeze({id:"swimwear-06",title:"Lace Resort Cover-Up",detail:"Bikini with a sheer wrap",frame:1})
]);
export const PHOTO_SPRITE_PATH="./assets/player-looks.webp";

export function currentPhotoOutfit(world){
 const outfit=world?.people?.[world.playerId]?.appearance?.outfit;
 return PHOTO_OUTFITS.find(x=>x.id===outfit?.swimwear) || null;
}
/** Changes an actual outfit *and* the picture index used by the preview. */
export function choosePhotoOutfit(world,garmentId){
 const look=PHOTO_OUTFITS.find(x=>x.id===garmentId);
 if(!look)throw new Error("That outfit does not have matching realistic artwork yet");
 if(!world?.people?.[world.playerId])throw new Error("No player character");
 updatePlayerAppearance(world,equip(world.people[world.playerId].appearance,garmentId));
 return look;
}
