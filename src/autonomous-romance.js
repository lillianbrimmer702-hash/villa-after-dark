/**
 * Consensual autonomous NPC romance.
 * Both characters must be adults, active, and mutually attracted.
 * The player is NEVER automatically dated, kissed or coupled.
 * NPC-only dates can be secret until someone tells the player.
 */
import {mutuallyAttracted,partnerOf} from "./coupling.js";
import {relationshipBetween,recordEvent} from "./relationship-engine.js";
const assert=(v,m)=>{if(!v)throw new Error(m)};
function score(world,a,b){
  const person=world.people[a];
  const traits=person.personality?.traits||[];
  const interestsA=person.personality?.interests||[];
  const interestsB=world.people[b].personality?.interests||[];
  const shared=interestsA.filter(x=>interestsB.includes(x)).length;
  const r=relationshipBetween(world,a,b);
  const commitment=partnerOf(world,a);
  return shared*2+
    (traits.includes("romantic")?3:0)+
    (traits.includes("flirtatious")?2:0)+
    (traits.includes("loyal")&&commitment&&commitment!==b?-7:0)+
    Math.max(-20,Math.min(20,r.affection))/7+
    Math.max(-20,Math.min(20,r.trust))/10;
}
export function romancePotential(world,a,b){
  assert(world.people[a]&&world.people[b]&&a!==b,"Unknown NPC pair");
  if(world.people[a].isPlayer||world.people[b].isPlayer)return {eligible:false,reason:"player-choice-required"};
  if(world.people[a].eliminated||world.people[b].eliminated)return {eligible:false,reason:"not-in-villa"};
  if(!mutuallyAttracted(world,a,b))return {eligible:false,reason:"not-mutually-attracted"};
  return {eligible:true,score:Math.round((score(world,a,b)+score(world,b,a))*100)/100};
}
export function npcRomanceOpportunity(world,{actor,target,location,action}){
  const potential=romancePotential(world,actor,target);
  if(!potential.eligible || !["bond","flirt"].includes(action) ||
    world.day<3||world.day%3!==0||potential.score<6)return null;
  world.romanceLog ||= [];
  if(world.romanceLog.some(e=>e.day===world.day&&(e.actor===actor||e.target===actor||
    e.actor===target||e.target===target)))return null;
  const relationship=relationshipBetween(world,actor,target);
  const type=relationship.affection>=18&&relationship.trust>=5?"kiss":"date";
  const id="npc-romance-"+world.day+"-"+[actor,target].sort().join("-");
  recordEvent(world,{
    id,day:world.day,type,actor,target,witnesses:[],
    source:"autonomous-npc-romance",location
  });
  const entry={id,day:world.day,type,actor,target,location,
    inAnotherCouple:!!(partnerOf(world,actor)&&partnerOf(world,actor)!==target)||
       !!(partnerOf(world,target)&&partnerOf(world,target)!==actor)};
  world.romanceLog.push(entry);
  return {...entry};
}
