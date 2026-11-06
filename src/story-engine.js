/**
 * Authored branching story scenes.
 * Dialogue and choices are original, rule-based and memory-aware.
 * This does not claim to generate unrestricted AI conversations.
 */
import {recordEvent,memoriesOf,relationshipBetween} from "./relationship-engine.js";
import {partnerOf,knownJealousyEvidence} from "./coupling.js";

const story=(id,title,location,minDay,maxDay,condition,opening,choices)=>({
  id,title,location,minDay,maxDay,condition,opening,
  choices:choices.map(([id,label,eventType,response])=>({id,label,eventType,response}))
});
export const STORY_SCENES=Object.freeze([
 story("first-glance","First Impressions","pool",1,4,"always",
  "{{name}} smiles as the first introductions wind down. \"So, what's your first impression of me?\"",
  [["warm","You seem like someone I'd want to know.","kindness","You just made my day a little better."],
   ["bold","I'd rather show you than tell you. Can I kiss you?","kiss","Well... that's one way to make an entrance."],
   ["guarded","I'm still figuring everyone out.","confession","Fair enough. We've got time."]]),
 story("terrace-talk","The Terrace","garden",2,20,"always",
  "{{name}} leans against the railing. \"It's strange how quickly this place feels like another world.\"",
  [["connect","Tell me about where you grew up.","kindness","I don't usually open up this quickly."],
   ["date","Maybe we should get away for a date.","date","I'd like that. Just the two of us."],
   ["promise","I promise I'll be honest with you here.","promise","I'm going to hold you to that."]]),
 story("kitchen-banter","After Breakfast","outdoor_kitchen",3,45,"always",
  "You find {{name}} making coffee. \"I could use some help escaping this morning's drama.\"",
  [["help","I can keep you company.","kindness","You have good timing."],
   ["tease","I heard you were the one causing it.","argument","I didn't expect that from you."],
   ["invite","Let's get coffee together tomorrow.","date","It's a date."]]),
 story("starlight","Under the Stars","firepit",5,35,"always",
  "{{name}} watches the fire dance across the empty seats. \"Have you ever fallen for someone too quickly?\"",
  [["romance","I think that's starting to happen.","confession","I was wondering if it was just me."],
   ["cautious","I'm trying not to rush.","kindness","I appreciate you saying it out loud."],
   ["kiss","Maybe actions speak louder. Kiss them.","kiss","That says more than a hundred words."]]),
 story("something-real","Something Real","garden",7,60,"trusting",
  "{{name}} takes a breath. \"I'm not looking for something temporary. Are you?\"",
  [["commit","I promise to take us seriously.","promise","That means something to me."],
   ["uncertain","I'm still learning what I want.","confession","I can work with honesty."],
   ["date","Let's talk properly on a date.","date","I'd love a moment alone."]]),
 story("private-admission","A Private Admission","beach",9,65,"trusting",
  "{{name}} lowers their voice. \"I haven't told anyone this, but I feel safe around you.\"",
  [["support","You can trust me with what matters.","promise","I'm glad I said something."],
   ["listen","You don't have to tell me until you're ready.","kindness","Thank you for not pushing."],
   ["romance","I feel close to you too.","confession","Then maybe we're on the same page."]]),
 story("firepit-question","The Couple Question","firepit",14,85,"coupled",
  "{{name}} turns toward you. \"Do you think we chose each other for the right reasons?\"",
  [["honest","I chose you because this feels real.","confession","I needed to hear that."],
   ["promise","I'm not giving up on us.","promise","Let's remember this on the hard days."],
   ["doubt","Sometimes I wonder about us.","argument","That hurts, but at least I know."]]),
 story("trust-cracks","When Trust Cracks","shared_bedroom",9,75,"low_trust",
  "{{name}} sits on the edge of the bed. \"Something's changed between us, hasn't it?\"",
  [["apologize","I'm sorry for my part in this.","apology","An apology is a beginning, not the whole fix."],
   ["argue","You haven't exactly been honest either.","argument","Then we've both got explaining to do."],
   ["listen","Tell me how you've been feeling.","kindness","I didn't think you'd ask."]]),
 story("new-arrival","The New Arrival","pool",11,80,"new_arrival",
  "The newest islander, {{name}}, looks around. \"Everyone already has a story here. Where do I fit?\"",
  [["welcome","Come sit with me.","kindness","You just made this less terrifying."],
   ["flirt","Maybe you fit right next to me.","confession","Well, that's an interesting welcome."],
   ["date","I could show you around on a date.","date","I'm definitely not saying no."]]),
 story("gossip-fallout","The Rumor","firepit",6,89,"known_infidelity",
  "{{name}} goes quiet as you approach. The rumor hasn't gone away.",
  [["confront","We need to talk about what happened.","argument","I know. Avoiding it made everything worse."],
   ["apologize","I'm sorry for how we've handled this.","apology","I'm listening, even if it's difficult."],
   ["distance","I need time to think.","confession","I won't pressure you tonight."]]),
 story("jealous-night","A Jealous Night","dressing_room",15,85,"known_infidelity",
  "{{name}} catches your reflection in the mirror. \"I can tell you're upset. Please say something.\"",
  [["truth","I know about the kiss.","argument","You deserve an explanation."],
   ["boundary","I need honesty from here on out.","promise","I hear you."],
   ["rebuild","I want us to try again.","apology","Then let's do the work."]]),
 story("after-challenge","What They Didn't See","garden",18,80,"always",
  "{{name}} laughs, then turns serious. \"Challenges are easy. Being real with you is harder.\"",
  [["care","You don't have to perform for me.","kindness","I like who I am around you."],
   ["truth","Tell me one thing you haven't said yet.","confession","Okay. But you'll have to promise to listen."],
   ["risk","Then let's take a chance on each other.","date","I like the sound of that."]]),
 story("hideaway-moment","A Moment Away","hideaway",24,80,"coupled",
  "{{name}} closes the suite door softly. \"Finally, somewhere nobody can interrupt us.\"",
  [["cuddle","I just want to be close to you.","kindness","Come here, then."],
   ["kiss","Kiss them slowly.","kiss","I've been waiting for that."],
   ["talk","I want to know what you're feeling.","confession","Okay. I'll tell you."]]),
 story("difficult-choice","The Choice Ahead","beach",40,86,"coupled",
  "The waves cover the silence. {{name}} asks, \"Would you still choose me outside this place?\"",
  [["yes","I would choose you again.","promise","I'm going to remember you said that."],
   ["unsure","I want to find out together.","confession","Maybe that's the most honest answer."],
   ["fight","You're asking for more than I can give.","argument","Then we need to talk about what we are."]]),
 story("almost-finale","Almost Home","firepit",78,90,"coupled",
  "{{name}} looks toward the villa lights. \"No matter what happens in the finale, what has this meant to you?\"",
  [["love","This could be the start of a real future.","promise","I hope you're right."],
   ["memory","I'm grateful for every moment.","kindness","Me too. Even the difficult ones."],
   ["fear","I'm scared of what comes after.","confession","Then let's be scared together."]]),
 story("last-solo-night","Choosing Yourself","beach",78,90,"single",
  "{{name}} finds you watching the horizon. \"People think being single here means you've lost. Do you?\"",
  [["independent","I know my worth with or without a couple.","kindness","I respect that."],
   ["hope","I haven't given up on finding love.","confession","Neither have I."],
   ["date","Maybe we should take a chance.","date","I'd be open to that."]])
]);
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const interpolate=(line,npc)=>line.replaceAll("{{name}}",npc.name||npc.id)
  .replaceAll("{{hometown}}",npc.hometown||"home");
function conditionMet(world,targetId,condition){
 const player=world.playerId,rel=relationshipBetween(world,player,targetId);
 switch(condition){
  case "always":return true;
  case "trusting":return rel.trust>=12;
  case "low_trust":return rel.trust<0;
  case "coupled":return partnerOf(world,player)===targetId;
  case "single":return !partnerOf(world,player);
  case "known_infidelity":return knownJealousyEvidence(world,player).some(e=>
     [e.actor,e.target].includes(targetId));
  case "new_arrival":return (world.arrivals||[]).some(a=>a.personId===targetId&&world.day-a.day<=4);
  default:throw new Error("Unrecognized scene condition");
 }
}
export function availableScenes(world,targetId){
 const npc=world.people[targetId];
 assert(npc&&targetId!==world.playerId&&!npc.eliminated,"Choose an active NPC");
 world.storyLog ||= [];
 return STORY_SCENES.filter(s=>world.day>=s.minDay&&world.day<=s.maxDay &&
   conditionMet(world,targetId,s.condition) &&
   !world.storyLog.some(e=>e.sceneId===s.id&&e.targetId===targetId))
   .map(s=>({id:s.id,title:s.title,location:s.location,
     opening:interpolate(s.opening,npc),
     choices:s.choices.map(c=>({id:c.id,label:c.label}))}));
}
export function chooseStoryOption(world,{targetId,sceneId,choiceId}){
 assert(world.playerId&&world.people[world.playerId],"Player not initialized");
 const option=availableScenes(world,targetId).find(s=>s.id===sceneId);
 assert(option,"Story scene not available");
 const template=STORY_SCENES.find(s=>s.id===sceneId);
 const choice=template.choices.find(c=>c.id===choiceId);
 assert(choice,"Unknown story choice");
 const eventId=`story-${sceneId}-${targetId}-${world.day}`;
 recordEvent(world,{id:eventId,day:world.day,type:choice.eventType,
   actor:world.playerId,target:targetId,witnesses:[],
   source:"player-story-choice",sceneId,choiceId});
 const entry={sceneId,targetId,choiceId,eventId,day:world.day};
 world.storyLog.push(entry);
 return {...entry,response:interpolate(choice.response,world.people[targetId])};
}
