/**
 * Knowledge-safe player journal.
 * The global event ledger is an implementation detail, not a spoiler feed.
 * Anyone's journal only contains events witnessed by or revealed to them.
 */
import {memoriesOf} from "./relationship-engine.js";
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
export function journalFor(world,personId,{limit=50}={}){
 assert(world.people[personId],"Unknown journal owner");
 assert(Number.isInteger(limit)&&limit>=1&&limit<=1000,"Invalid journal limit");
 return memoriesOf(world,personId).slice(-limit).reverse()
   .map(event=>({
     id:event.id,day:event.day,type:event.type,
     actor:event.actor,target:event.target,
     source:event.source||"private",
     // Never expose sensitive event metadata that might imply who else
     // knows or how a secret was uncovered.
     witnessedByMe:(event.witnesses||[]).includes(personId)
   }));
}
export function playerJournal(world,options={}){
 assert(world.playerId&&world.people[world.playerId],"No initialized player");
 return journalFor(world,world.playerId,options);
}
