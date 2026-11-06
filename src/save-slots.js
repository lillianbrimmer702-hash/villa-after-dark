import {serializeWorld,loadWorld} from "./relationship-engine.js";
const PREFIX="villa-after-dark:save:";
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const validSlot=slot=>typeof slot==="string"&&/^[a-zA-Z0-9_-]{1,32}$/.test(slot);
export function saveSlot(storage,slot,world,metadata={}) {
 assert(validSlot(slot),"Invalid save slot");
 assert(storage&&typeof storage.setItem==="function","Storage unavailable");
 const envelope={format:1,savedAt:new Date().toISOString(),metadata:{...metadata},world:JSON.parse(serializeWorld(world))};
 // Validate the saved payload before persisting it.
 loadWorld(JSON.stringify(envelope.world));
 storage.setItem(PREFIX+slot,JSON.stringify(envelope));
 return {slot,savedAt:envelope.savedAt};
}
export function loadSlot(storage,slot) {
 assert(validSlot(slot),"Invalid save slot");
 const raw=storage.getItem(PREFIX+slot);
 if(raw===null)return null;
 const envelope=JSON.parse(raw);
 assert(envelope.format===1,"Unsupported save format");
 return {slot,savedAt:envelope.savedAt,metadata:envelope.metadata,world:loadWorld(JSON.stringify(envelope.world))};
}
export function deleteSlot(storage,slot) {
 assert(validSlot(slot),"Invalid save slot");
 storage.removeItem(PREFIX+slot);
}
export function listSlots(storage) {
 const slots=[];
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(key?.startsWith(PREFIX)){
   const slot=key.slice(PREFIX.length);
   if(validSlot(slot)){
    try {const save=loadSlot(storage,slot);if(save)slots.push({slot,savedAt:save.savedAt,metadata:save.metadata,day:save.world.day});}
    catch {slots.push({slot,corrupted:true});}
   }
  }
 }
 return slots.sort((a,b)=>a.slot.localeCompare(b.slot));
}
