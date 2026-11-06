import { memoriesOf, recordEvent, relationshipBetween } from "./relationship-engine.js";
import { chooseAction } from "./contestant-ai.js";

/**
 * Free-text conversation engine. This is NOT generative AI:
 * it recognizes a limited vocabulary, remembers recorded events,
 * and returns authored dialogue that reflects known history.
 */
const RULES = [
  {intent:"apology",pattern:/\b(sorry|apologiz(?:e|ing)|forgive me)\b/i,type:"apology"},
  {intent:"promise",pattern:/\b(i promise|i swear|you can trust me)\b/i,type:"promise"},
  {intent:"confession",pattern:/\b(i need to tell you|i have a secret|i confess)\b/i,type:"confession"},
  {intent:"argument",pattern:/\b(you lied|i'm angry|you betrayed|how dare you)\b/i,type:"argument"},
  {intent:"kiss",pattern:/\b(kiss you|can i kiss|let's kiss)\b/i,type:"kiss"},
  {intent:"date",pattern:/\b(go on a date|take you on a date|date tonight)\b/i,type:"date"},
  {intent:"kindness",pattern:/\b(thank you|i care about you|you're amazing|i appreciate you)\b/i,type:"kindness"}
];
const DIALOGUE = {
  apology: ["I hear you. I need to see that things will actually change.","I appreciate you saying that. Let's take it slowly."],
  promise: ["I'm going to remember you said that.","Promises mean something to me. Don't make one lightly."],
  confession: ["Okay. I'm listening.","Thank you for trusting me with that."],
  argument: ["I'm upset too, but I want to understand what happened.","Don't expect me to forget this overnight."],
  kiss: ["That definitely changes things between us.","I wasn't expecting that... but I'm glad it happened."],
  date: ["A little time away from everyone sounds nice.","A date? You've got my attention."],
  kindness: ["That means more than you know.","I needed to hear that today."],
  unknown: ["Tell me more. I don't want to assume what you mean.","I'm listening, but I'm not sure I understood."]
};
const assert = (v,m) => {if(!v)throw new Error(m)};
export function interpretMessage(text) {
  assert(typeof text==="string" && text.trim().length>0 && text.length<=2000,"Message must be 1–2000 characters");
  const match=RULES.find(r=>r.pattern.test(text));
  return match ? {intent:match.intent,eventType:match.type,understood:true} : {intent:"unknown",eventType:null,understood:false};
}
export function suggestedReplies(world, speakerId, listenerId) {
  const rel=relationshipBetween(world,speakerId,listenerId);
  const known=memoriesOf(world,listenerId,speakerId);
  const suggestions=["I appreciate you.","Would you like to go on a date?","Can I kiss you?"];
  if(known.some(e=>e.type==="argument"||e.type==="betrayal"))suggestions.unshift("I'm sorry.");
  if(rel.trust>10)suggestions.push("I promise I'll be honest with you.");
  return suggestions;
}
/** 
 * Caller supplies unique eventId and witnesses when an event should become real.
 * Unknown text does not silently create a relationship event.
 */
export function say(world,{speakerId,listenerId,text,eventId,witnesses=[]}) {
  assert(world.people[speakerId]&&world.people[listenerId]&&speakerId!==listenerId,"Invalid conversation participants");
  const parsed=interpretMessage(text);
  if(parsed.understood){
    assert(typeof eventId==="string"&&eventId.length>0,"Recognized dialogue requires eventId");
    recordEvent(world,{id:eventId,day:world.day,type:parsed.eventType,actor:speakerId,target:listenerId,witnesses,dialogue:text});
  }
  const known=memoriesOf(world,listenerId,speakerId);
  const relationship=relationshipBetween(world,speakerId,listenerId);
  const variant=relationship.trust<0?0:1;
  let reply=DIALOGUE[parsed.intent][variant];
  if(known.some(e=>e.type==="betrayal")&&parsed.intent!=="unknown")
    reply="I haven't forgotten what happened. "+reply;
  return {understood:parsed.understood,intent:parsed.intent,reply,relationship,suggestions:suggestedReplies(world,listenerId,speakerId)};
}
export function npcInitiative(world,npcId,targetId) {
  const decision=chooseAction(world,npcId,targetId);
  const lines={
    flirt:"I've been hoping we'd get a moment alone.",
    bond:"I want to get to know the real you.",
    confront:"We need to talk about what happened.",
    apologize:"I don't like how things went between us. I'm sorry.",
    keep_distance:"I need a little space to think."
  };
  return {...decision,line:lines[decision.action]};
}
