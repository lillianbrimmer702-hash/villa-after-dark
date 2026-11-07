/**
 * Playable authored daily scenes. Viewing does not mutate relationships.
 * Choices are private between the player and the other character.
 * Never displays hidden NPC memories or secrets.
 */
import {recordEvent,relationshipBetween} from "./relationship-engine.js";
import {partnerOf} from "./coupling.js";

const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const MOMENTS=Object.freeze([
 {id:"morning-coffee",place:"outdoor_kitchen",title:"Coffee and Chemistry",
  opening:"The villa is slowly waking up. {{name}} looks over from the kitchen counter. \"I haven't had a quiet moment since we got here. Want to keep me company?\"",
  options:[
   ["sit","Sit with {{name}} and hear about their morning","kindness","{{name}} makes room beside them. \"I could get used to starting the day like this.\""],
   ["flirt","Tell {{name}} you've been looking for them","confession","{{name}} smiles. \"I was wondering if you were going to say that.\""],
   ["leave","Smile and head out on your own",null,"You leave the kitchen to the sound of laughter. The day is yours to explore."]]},
 {id:"pool-whispers",place:"pool",title:"A Poolside Invitation",
  opening:"The sunshine catches the water as {{name}} steps toward you. \"Everyone is trying to impress someone. I think I'd rather have an actual conversation.\"",
  options:[
   ["listen","Ask {{name}} what they're hoping to find here","kindness","{{name}} relaxes. \"Someone who listens. That would be a good start.\""],
   ["date","Ask {{name}} to spend some time alone together","date","{{name}} laughs softly. \"A proper date? Okay, now I'm curious.\""],
   ["neutral","Keep things friendly for now",null,"You trade smiles and leave the door open for another conversation."]]},
 {id:"terrace-confidence",place:"garden",title:"Above the Noise",
  opening:"You find {{name}} on the terrace overlooking the sea. \"It's strange how much louder your thoughts get when the villa finally goes quiet.\"",
  options:[
   ["open","Share something real about how you're feeling","confession","{{name}} nods. \"I appreciate you trusting me with that.\""],
   ["support","Ask if {{name}} needs someone to listen","kindness","{{name}} lets out a breath. \"Yeah. I think I do.\""],
   ["space","Give {{name}} a moment to themselves",null,"{{name}} gives you a grateful smile as you step back inside."]]},
 {id:"firepit-spark",place:"firepit",title:"By the Fire",
  opening:"The lights around the firepit flicker. {{name}} sits beside you. \"I haven't figured out whether this place makes people more honest or better at pretending.\"",
  options:[
   ["honest","Promise to be straightforward with {{name}}","promise","{{name}} meets your eyes. \"Then let's hold each other to that.\""],
   ["challenge","Ask whether {{name}} is being honest right now","argument","{{name}} draws back. \"Wow. We really are going there tonight.\""],
   ["wait","Watch the flames without saying anything",null,"The quiet lingers. Neither of you has to fill it."]]},
 {id:"late-lunch",place:"outdoor_kitchen",title:"The Lunch Table",
  opening:"You walk into the kitchen just as {{name}} is setting out lunch. \"I made too much. Want to rescue me from eating all of this alone?\"",
  options:[
   ["join","Join {{name}} for lunch","kindness","{{name}} grins. \"Good. I was hoping you'd say yes.\""],
   ["invite","Suggest the two of you have dinner together later","date","{{name}} raises an eyebrow. \"So it's a date, then?\""],
   ["go","Thank {{name}} and keep exploring",null,"{{name}} waves as you leave. \"Save some room for dinner!\""]]},
 {id:"sunset-question",place:"beach",title:"Before the Sun Goes Down",
  opening:"The ocean turns pink in the evening light. {{name}} looks toward the horizon. \"Do you think anyone really finds what they're looking for here?\"",
  options:[
   ["hope","Tell {{name}} you think real love is possible","confession","{{name}} smiles slowly. \"I'd like to believe that too.\""],
   ["curious","Ask what {{name}} is looking for","kindness","{{name}} thinks for a moment. \"Someone who sees the real me.\""],
   ["solo","Enjoy the sunset by yourself",null,"You breathe in the ocean air. There is no need to rush your own story."]]}
]);
export const MOMENT_TEMPLATES=Object.freeze(MOMENTS.map(x=>Object.freeze({id:x.id,title:x.title,place:x.place})));
const fill=(value,name)=>value.replaceAll("{{name}}",name);
function resolved(world){
 world.morningMoments ||= [];
 assert(Array.isArray(world.morningMoments),"Invalid daily moments");
 return world.morningMoments.find(x=>x.day===world.day)||null;
}
function targetFor(world){
 const ids=Object.keys(world.people).filter(id=>id!==world.playerId&&!world.people[id].eliminated).sort();
 if(!ids.length)return null;
 const partner=partnerOf(world,world.playerId);
 if(partner && ids.includes(partner) && world.day%3===0)return partner;
 const offset=(world.day*5+3)%ids.length;
 const rotated=[...ids.slice(offset),...ids.slice(0,offset)];
 return rotated.sort((a,b)=>{
  const x=relationshipBetween(world,world.playerId,a);
  const y=relationshipBetween(world,world.playerId,b);
  const scoreA=Math.round(Math.max(-15,Math.min(15,x.affection+x.trust))/8);
  const scoreB=Math.round(Math.max(-15,Math.min(15,y.affection+y.trust))/8);
  return scoreB-scoreA;
 })[0];
}
export function dailyMoment(world){
 assert(world?.playerId && world.people?.[world.playerId],"No initialized player");
 if(world.day<2||world.day>world.seasonLength)return null;
 const saved=resolved(world);
 const targetId=saved?.targetId||targetFor(world);
 if(!targetId)return null;
 const template=MOMENTS[(world.day-2)%MOMENTS.length];
 const target=world.people[targetId];
 return {
  id:template.id,day:world.day,place:template.place,title:template.title,
  targetId,targetName:target.name||targetId,
  opening:fill(template.opening,target.name||targetId),
  options:template.options.map(o=>({id:o[0],label:fill(o[1],target.name||targetId)})),
  result:saved
 };
}
export function chooseDailyMoment(world,choiceId){
 const moment=dailyMoment(world);
 assert(moment,"No daily moment available");
 assert(!moment.result,"This day's moment is already finished");
 const template=MOMENTS[(world.day-2)%MOMENTS.length];
 const choice=template.options.find(o=>o[0]===choiceId);
 assert(choice,"Unrecognized moment choice");
 const eventId=choice[2]?"daily-moment-"+world.day+"-"+moment.targetId:null;
 if(eventId){
  recordEvent(world,{
   id:eventId,day:world.day,type:choice[2],
   actor:world.playerId,target:moment.targetId,witnesses:[],
   source:"player-daily-moment",momentId:moment.id,choiceId
  });
 }
 const result={
  day:world.day,momentId:moment.id,targetId:moment.targetId,choiceId,eventId,
  response:fill(choice[3],moment.targetName)
 };
 world.morningMoments ||= [];
 world.morningMoments.push(result);
 return {...result};
}
