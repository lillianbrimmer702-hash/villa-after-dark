/**
 * Villa After Dark — finale and reunion outcome logic.
 *
 * Deterministic fictional outcomes, not a claim that narrative scenes,
 * cinematic artwork or the full ending UI have been authored.
 */
import { partnerOf, mutuallyAttracted } from "./coupling.js";
import { relationshipBetween, memoriesOf } from "./relationship-engine.js";
import { audienceStandings, activeContestants } from "./cast-management.js";
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
function pairs(world){
 const used=new Set(),out=[];
 for(const id of activeContestants(world)){
  const other=partnerOf(world,id);
  if(!other||used.has(id)||used.has(other)||!world.people[other]||world.people[other].eliminated)continue;
  if(partnerOf(world,other)!==id)continue;
  out.push([id,other].sort());
  used.add(id);used.add(other);
 }
 return out.sort((a,b)=>a[0].localeCompare(b[0]));
}
function coupleScore(world,a,b,popularity){
 const relationship=relationshipBetween(world,a,b);
 return Math.round((50+relationship.affection*.5+relationship.trust*.5+
   ((popularity[a]||0)+(popularity[b]||0))*.75)*100)/100;
}
export function previewFinale(world) {
 assert(world.day===90 && world.simulatedDays?.includes(90),"Finish all 90 days before the finale");
 const popularity=Object.fromEntries(audienceStandings(world).map(x=>[x.personId,x.score]));
 const rankings=pairs(world).map(([a,b])=>({a,b,score:coupleScore(world,a,b,popularity)}))
   .sort((x,y)=>y.score-x.score||x.a.localeCompare(y.a)||x.b.localeCompare(y.b));
 const playerPartner=partnerOf(world,world.playerId);
 const romanticEvents=playerPartner ? memoriesOf(world,world.playerId,playerPartner) : [];
 const relationship=playerPartner?relationshipBetween(world,world.playerId,playerPartner):null;
 const knownOutsideRomance=romanticEvents.filter(e=>
    (e.type==="kiss"||e.type==="date") &&
    [e.actor,e.target].includes(playerPartner) &&
    ![e.actor,e.target].includes(world.playerId)
 ).length;
 let ending="independent";
 if(playerPartner){
   if(knownOutsideRomance>0 && relationship.trust<20)ending="unresolved_betrayal";
   else if(relationship.trust>=35&&relationship.affection>=45)ending="lasting_love";
   else if(relationship.trust<0 || relationship.affection<0)ending="bittersweet";
   else ending="new_beginning";
 }
 const top=rankings[0]||null;
 const playerWon=!!top && [top.a,top.b].includes(world.playerId);
 return {
  day:90,playerPartner,ending,playerWon,
  winningCouple:top?{a:top.a,b:top.b,score:top.score}:null,
  rankings,knownOutsideRomance
 };
}
export function resolveFinale(world) {
 assert(!world.finale,"Finale already resolved");
 const outcome=previewFinale(world);
 world.finale={...outcome,locked:true};
 return world.finale;
}
/** Reunion facts are grounded in stored events rather than fabricated
 * character knowledge or generic text pretending to be AI dialogue.
 */
export function reunionSummary(world) {
 assert(world.finale?.locked,"Finale must be resolved first");
 const romantic=world.events.filter(e=>["kiss","date","betrayal","argument","apology","promise"].includes(e.type));
 const highlights=romantic.slice(-8).map(e=>({
  eventId:e.id,day:e.day,type:e.type,actor:e.actor,target:e.target
 }));
 return {
  ending:world.finale.ending,
  winningCouple:world.finale.winningCouple,
  totalRecordedMemories:world.events.length,
  arrivals:world.arrivals?.length||0,
  eliminations:world.eliminations?.length||0,
  highlights
 };
}
