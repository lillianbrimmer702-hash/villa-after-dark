/**
 * Knowledge propagation through gossip.
 * No listener learns an event unless a source who knows it tells them.
 * This is a separate history from private relationship events.
 */
import { memoriesOf, revealEvent } from "./relationship-engine.js";

const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const GOSSIP_TOPICS=new Set(["kiss","date","betrayal","argument","promise","confession"]);
const isPublic=e=>e.source==="public-ceremony";

/** Return {shared:false} for a repeated disclosure without creating duplicates. */
export function tellSecret(world,{teller,listener,eventId}) {
  assert(world.people[teller]&&world.people[listener]&&teller!==listener,"Invalid gossip participants");
  const event=world.events.find(e=>e.id===eventId);
  assert(event,"Unknown event");
  assert(world.knowledge[teller]?.includes(eventId),"Teller does not know this event");
  assert(GOSSIP_TOPICS.has(event.type)&&!isPublic(event),"Not a private gossip topic");
  if(world.knowledge[listener]?.includes(eventId))return {shared:false,eventId,teller,listener};
  revealEvent(world,eventId,listener);
  world.gossipLog ||= [];
  const entry={id:`gossip-${world.day}-${world.gossipLog.length+1}`,day:world.day,
    teller,listener,eventId};
  world.gossipLog.push(entry);
  return {shared:true,...entry};
}
/** Deterministically spread at most one private rumor per NPC/NPC meeting.
 * Gossip is limited to social encounters; actors don't narrate secrets they
 * haven't personally learned. The player is not forced to gossip.
 */
export function gossipAfterInteractions(world,interactions) {
  assert(Array.isArray(interactions),"Interactions required");
  const shared=[];
  for(const interaction of interactions){
    const {actor,target}=interaction;
    if(!world.people[actor]||!world.people[target])continue;
    if(world.people[actor].isPlayer||world.people[target].isPlayer)continue;
    const candidates=[actor,target];
    for(const teller of candidates){
      const listener=teller===actor?target:actor;
      const traits=world.people[teller].personality?.traits||[];
      if(!traits.includes("outgoing")&&!traits.includes("impulsive"))continue;
      if(traits.includes("secretive")&&!traits.includes("impulsive"))continue;
      const rumor=memoriesOf(world,teller).find(e=>
        GOSSIP_TOPICS.has(e.type)&&!isPublic(e) &&
        e.day<world.day&&!world.knowledge[listener].includes(e.id));
      if(!rumor)continue;
      const result=tellSecret(world,{teller,listener,eventId:rumor.id});
      if(result.shared)shared.push(result);
      break;
    }
  }
  return shared;
}
