import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,recordEvent,revealEvent,memoriesOf} from "../src/relationship-engine.js";
import {createPersonality} from "../src/contestant-ai.js";
import {interpretMessage,say,suggestedReplies,npcInitiative} from "../src/conversation.js";
const p=traits=>createPersonality({traits});
const people=[
{id:"player",name:"Player",personality:p(["romantic","honest","empathetic","loyal","forgiving"])},
{id:"alex",name:"Alex",personality:p(["jealous","impulsive","outgoing","competitive","flirtatious"])},
{id:"sam",name:"Sam",personality:p(["shy","cautious","independent","secretive","ambitious"])}
];
test("known text produces a real remembered event",()=>{
 const w=createWorld(people);
 const result=say(w,{speakerId:"player",listenerId:"alex",text:"Can I kiss you?",eventId:"talk-1"});
 assert.equal(result.intent,"kiss");
 assert.equal(memoriesOf(w,"alex").length,1);
 assert.equal(memoriesOf(w,"sam").length,0);
 assert.equal(result.relationship.affection,12);
});
test("unrecognized text is honest and has no side effects",()=>{
 const w=createWorld(people);
 const result=say(w,{speakerId:"player",listenerId:"alex",text:"What do you think about the moon?"});
 assert.equal(result.understood,false);
 assert.equal(w.events.length,0);
 assert.match(result.reply,/not sure I understood/);
});
test("a revealed betrayal changes a response",()=>{
 const w=createWorld(people);
 recordEvent(w,{id:"secret",day:1,type:"betrayal",actor:"player",target:"sam",witnesses:[]});
 const before=say(w,{speakerId:"player",listenerId:"alex",text:"Thank you",eventId:"talk-1"});
 assert.doesNotMatch(before.reply,/haven't forgotten/);
 revealEvent(w,"secret","alex");
 const after=say(w,{speakerId:"player",listenerId:"alex",text:"Thank you",eventId:"talk-2"});
 assert.match(after.reply,/haven't forgotten/);
});
test("suggestions and autonomous lines available",()=>{
 const w=createWorld(people);
 assert.ok(suggestedReplies(w,"player","alex").length>=3);
 assert.ok(npcInitiative(w,"alex","player").line.length>5);
});
test("invalid message and duplicate event are rejected",()=>{
 const w=createWorld(people);
 assert.throws(()=>interpretMessage("  "),/Message/);
 say(w,{speakerId:"player",listenerId:"alex",text:"Thank you",eventId:"one"});
 assert.throws(()=>say(w,{speakerId:"player",listenerId:"alex",text:"Thank you",eventId:"one"}),/Duplicate/);
});
