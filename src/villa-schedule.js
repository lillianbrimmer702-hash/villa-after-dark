import {advanceDay,recordEvent} from "./relationship-engine.js";
import {chooseAction} from "./contestant-ai.js";
import {ELIMINATION_DAYS} from "./cast-management.js";
import {challengeForDay} from "./challenges.js";

/** Deterministic villa schedule. The player controls when each day advances.
 * This schedules opportunities, not automatic romantic consent or forced events.
 */
export const LOCATIONS=["pool","firepit","outdoor_kitchen","spa","shared_bedroom","dressing_room","garden","beach","hideaway","pink_suite"];
const assert=(v,m)=>{if(!v)throw new Error(m)};
function hash(s) {let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function pick(items,seed){return items[hash(seed)%items.length]}
export function dailyAgenda(world,day=world.day){
 assert(Number.isInteger(day)&&day>=1&&day<=world.seasonLength,"Invalid day");
 const phase=day<=7?"arrivals":day<=75?"villa":day<=89?"final_stretch":"finale";
 const events=[{time:"09:00",type:"morning",location:"outdoor_kitchen",title:"Morning catch-up"},
 {time:"14:00",type:"free_time",location:"pool",title:"Villa free time"},
 {time:"21:00",type:"evening",location:"firepit",title:"Evening conversations"}];
 if(day===1)events.unshift({time:"12:00",type:"arrival",location:"pool",title:"Welcome to the villa"});
 if(day>1&&day%14===0&&day<90)events.push({time:"22:00",type:"recoupling",location:"firepit",title:"Recoupling ceremony"});
 const challenge=challengeForDay(day);
 if(challenge)events.push({time:"16:00",type:"challenge",location:challenge.location,title:challenge.title});
 if(day>7&&day%11===0&&day<85)events.push({time:"18:00",type:"bombshell",location:"pool",title:"New arrival"});
 if(ELIMINATION_DAYS.includes(day))events.push({time:"22:30",type:"elimination",location:"firepit",title:"Public vote result"});
 if(day===90)events.push({time:"22:00",type:"finale",location:"firepit",title:"Finale and reunion"});
 return {day,phase,events:events.sort((a,b)=>a.time.localeCompare(b.time))};
}
export function contestantLocations(world,day=world.day) {
 const result={};
 for(const id of Object.keys(world.people).filter(id=>!world.people[id].eliminated))
   result[id]=pick(LOCATIONS.slice(0,8),id+"|"+day);
 return result;
}
export function socialOpportunities(world) {
 const positions=contestantLocations(world);
 const ids=Object.keys(positions);
 const opportunities=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j];
  if(positions[a]===positions[b])
   opportunities.push({location:positions[a],actor:a,target:b,decision:chooseAction(world,a,b)});
 }
 return opportunities;
}
/** A scheduled decision is a suggestion until accepted by the gameplay layer.
 * Consent-sensitive acts (kissing, dating) are never automatically committed.
 */
export function advanceVillaDay(world) {
 const completed=dailyAgenda(world);
 if(world.day<world.seasonLength)advanceDay(world);
 return {completed,next:dailyAgenda(world)};
}
