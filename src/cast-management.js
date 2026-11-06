/**
 * Villa After Dark — arrivals, fictional public voting and exits.
 *
 * Contestants remain in the historical ledger after elimination.
 * Public voting is an IN-GAME simulation, never a real-world vote.
 */
import {ensureCouplingState,partnerOf} from "./coupling.js";
import {validateAppearance,generateAppearance} from "./character-style.js";
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
export const BOMBSHELL_DAYS=Object.freeze([11,22,33,44,55,66,77]);
export const ELIMINATION_DAYS=Object.freeze([21,35,49,63,77,84]);
export function activeContestants(world){
 return Object.keys(world.people).filter(id=>!world.people[id].eliminated).sort();
}
function ensureCastState(world) {
 ensureCouplingState(world);
 world.arrivals ||= [];
 world.eliminations ||= [];
 return world;
}
/** Adds an adult NPC on a scheduled arrival day. The history of eliminated
 * contestants remains intact and the newcomer has a fresh knowledge ledger.
 */
export function introduceBombshell(world,person){
 ensureCastState(world);
 assert(BOMBSHELL_DAYS.includes(world.day),"No bombshell arrival scheduled today");
 assert(!world.arrivals.some(x=>x.day===world.day),"Bombshell already introduced today");
 assert(person&&typeof person.id==="string"&&person.id.length>0&&!world.people[person.id],"Invalid or duplicate newcomer");
 assert(Number.isInteger(person.age)&&person.age>=21&&person.age<=35,"Newcomer must be 21–35");
 const appearance=person.appearance||generateAppearance("bombshell|"+person.id);
 validateAppearance(appearance);
 world.people[person.id]=JSON.parse(JSON.stringify({...person,appearance,isPlayer:false,eliminated:false}));
 world.knowledge[person.id]=[];
 world.couples[person.id]=null;
 const entry={day:world.day,personId:person.id};
 world.arrivals.push(entry);
 return entry;
}
/** A fictional score from publicly observable season events, never from
 * secret kisses or hidden information. Higher scores mean safer contestants.
 */
export function audienceStandings(world){
 const ids=activeContestants(world);
 const score=Object.fromEntries(ids.map(id=>[id,0]));
 for(const event of world.events){
  if(event.source!=="public-ceremony")continue;
  if(Object.hasOwn(score,event.actor))score[event.actor]+=5;
  if(Object.hasOwn(score,event.target))score[event.target]+=5;
 }
 for(const id of ids){
  const activeDays=world.day-(world.arrivals?.find(x=>x.personId===id)?.day||1);
  score[id]+=Math.min(10,Math.max(0,activeDays));
 }
 // Only publicly ranked competitions influence the fictional audience.
 // Private kisses and unshared secrets remain invisible.
 for(const challenge of world.challengeResults||[]){
  if(!challenge.public)continue;
  challenge.rankings.slice(0,3).forEach((entry,index)=>{
   if(Object.hasOwn(score,entry.personId))
     score[entry.personId]+=[12,8,4][index];
  });
 }
 return ids.map(id=>({personId:id,score:score[id]}))
   .sort((a,b)=>b.score-a.score||a.personId.localeCompare(b.personId));
}
/** Eliminate a non-player contestant; the player cannot be removed from
 * the season until the endgame/early-ending flow is separately implemented.
 */
export function eliminateContestant(world,personId,reason="public_vote"){
 ensureCastState(world);
 assert(ELIMINATION_DAYS.includes(world.day),"No elimination scheduled today");
 assert(personId!==world.playerId,"Player exit requires its own ending flow");
 assert(world.people[personId]&&!world.people[personId].eliminated,"Contestant not active");
 assert(!world.eliminations.some(x=>x.day===world.day),"Elimination already completed today");
 const formerPartner=partnerOf(world,personId);
 world.people[personId].eliminated=true;
 world.people[personId].eliminatedDay=world.day;
 world.couples[personId]=null;
 if(formerPartner)world.couples[formerPartner]=null;
 const entry={day:world.day,personId,reason,formerPartner};
 world.eliminations.push(entry);
 return entry;
}
export function suggestedElimination(world) {
 assert(ELIMINATION_DAYS.includes(world.day),"No elimination scheduled today");
 const standings=audienceStandings(world).filter(x=>{
   if(x.personId===world.playerId)return false;
   const arrival=world.arrivals?.find(entry=>entry.personId===x.personId);
   return !arrival || world.day-arrival.day>=7;
 });
 return standings.at(-1)?.personId??null;
}
