/**
 * A cinematic opening that belongs to the player's actual season.
 * The player chooses whom to approach and what to say; memories persist.
 */
import {recordEvent} from "./relationship-engine.js";
import {mutuallyAttracted} from "./coupling.js";

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const CHOICES=Object.freeze({
 friendly:{label:"Introduce yourself with a warm smile",eventType:"kindness"},
 curious:{label:"Ask what brought them here",eventType:"confession"},
 flirt:{label:"Tell them they caught your eye",eventType:"confession"}
});
export const FIRST_IMPRESSION_CHOICES=Object.freeze(
 Object.entries(CHOICES).map(([id,v])=>Object.freeze({id,label:v.label}))
);
function ensureWorld(world){
 assert(world?.playerId && world.people?.[world.playerId],"No playable season");
}
export function entranceState(world){
 ensureWorld(world);
 world.entrance ||= {phase:"arrival",targetId:null,choiceId:null,
  response:null,eventId:null,completed:false};
 return world.entrance;
}
export function continueEntrance(world){
 const scene=entranceState(world);
 assert(scene.phase==="arrival","Entrance already introduced");
 assert(world.day===1,"The first-night entrance can only start on day one");
 scene.phase="first-impression";
 return scene;
}
export function chooseFirstImpression(world,{targetId,choiceId}){
 const scene=entranceState(world);
 assert(scene.phase==="first-impression","Choose your entrance moment first");
 assert(world.day===1,"First impressions must happen on day one");
 assert(world.people[targetId] && targetId!==world.playerId &&
   !world.people[targetId].eliminated,"Choose an active islander");
 const choice=CHOICES[choiceId];
 assert(choice,"Unknown first impression choice");
 const target=world.people[targetId],player=world.people[world.playerId];
 const shared=mutuallyAttracted(world,world.playerId,targetId);
 const gentle=target.personality?.traits?.includes("shy");
 const reaction={
  friendly:gentle
   ?'"'+player.name+', right? I am glad you came over. I was starting to get nervous."'
   :'"'+player.name+', nice to meet you! I was hoping someone would break the ice."',
  curious:'"'+(target.motive||"I wanted something different from my usual life.")+'"',
  flirt:shared
   ?'"'+player.name+', you do not waste time, do you? I like the confidence."'
   :'"'+player.name+', that is flattering. I would rather get to know everyone as friends first."'
 }[choiceId];
 const eventId="entrance-"+world.playerId+"-"+targetId;
 // A flirt is a disclosure of interest, never a forced date or kiss.
 recordEvent(world,{id:eventId,day:world.day,type:choice.eventType,
  actor:world.playerId,target:targetId,witnesses:[],
  source:"player-entrance",choiceId});
 Object.assign(scene,{phase:"reaction",targetId,choiceId,response:reaction,eventId});
 return {...scene};
}
export function finishEntrance(world){
 const scene=entranceState(world);
 assert(scene.phase==="reaction","Finish your first impression before entering the villa");
 scene.phase="complete";
 scene.completed=true;
 return {...scene};
}
