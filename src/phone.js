/**
 * In-villa messaging. Only senders and recipients have access through
 * inboxFor; NPC messages are authored responses, never paid AI output.
 */
import {relationshipBetween,memoriesOf} from "./relationship-engine.js";
import {partnerOf,knownJealousyEvidence} from "./coupling.js";
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
export function ensurePhoneState(world){
 world.messages ||= [];
 return world;
}
export function sendMessage(world,{from,to,text}){
 ensurePhoneState(world);
 assert(world.people[from]&&world.people[to]&&from!==to,"Invalid text participants");
 assert(typeof text==="string"&&text.trim().length>0&&text.length<=600,"Text must be 1–600 characters");
 const entry={id:"text-"+world.day+"-"+(world.messages.length+1),day:world.day,
  from,to,text:text.trim()};
 world.messages.push(entry);
 return {...entry};
}
export function inboxFor(world,personId){
 assert(world.people[personId],"Unknown inbox owner");
 return (world.messages||[]).filter(m=>m.from===personId||m.to===personId)
   .map(m=>({...m}));
}
export function conversationWith(world,a,b){
 assert(world.people[a]&&world.people[b],"Unknown conversation participant");
 return inboxFor(world,a).filter(m=>m.from===b||m.to===b);
}
export function composeNpcText(world,npcId,recipientId){
 assert(world.people[npcId]&&!world.people[npcId].isPlayer,"Sender must be an NPC");
 assert(world.people[recipientId]&&npcId!==recipientId,"Invalid recipient");
 const relationship=relationshipBetween(world,npcId,recipientId);
 const traits=world.people[npcId].personality?.traits||[];
 if(partnerOf(world,npcId)===recipientId&&knownJealousyEvidence(world,npcId).length)
   return "I heard something that hurt me. Can we talk about it privately?";
 if(relationship.trust<0)return "I don't want us to leave things the way they are. Can we talk?";
 if(relationship.affection>=25)return "I caught myself smiling thinking about our last conversation.";
 if(traits.includes("shy"))return "Hey. I was nervous about messaging you, but I wanted to say hi.";
 return "Hey, have you got a minute? I'd love to catch up.";
}
/** At most one NPC-initiated text to the player every four days.
 * No message is sent on the player's behalf.
 */
export function autoTextPlayer(world){
 ensurePhoneState(world);
 if(world.day<4||world.day%4!==0)return null;
 const target=world.playerId;
 if(!world.people[target])return null;
 if(world.messages.some(m=>m.day===world.day&&m.to===target&&m.from!==target))return null;
 const npcIds=Object.keys(world.people).filter(id=>id!==target&&!world.people[id].eliminated).sort();
 if(!npcIds.length)return null;
 const sender=npcIds[Math.floor(world.day/4)%npcIds.length];
 return sendMessage(world,{from:sender,to:target,text:composeNpcText(world,sender,target)});
}
