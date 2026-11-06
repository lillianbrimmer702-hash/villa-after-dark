import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,serializeWorld,loadWorld,advanceDay} from "../src/relationship-engine.js";
import {sendMessage,inboxFor,conversationWith,composeNpcText,autoTextPlayer} from "../src/phone.js";
const make=()=>{
 const w=createWorld([{id:"p",isPlayer:true},{id:"alex",isPlayer:false},{id:"sam",isPlayer:false}]);
 w.playerId="p";return w;
};
test("private texts appear only in participants' inboxes",()=>{
 const w=make();
 sendMessage(w,{from:"p",to:"alex",text:"I hope we can talk"});
 assert.equal(inboxFor(w,"p").length,1);
 assert.equal(inboxFor(w,"alex").length,1);
 assert.equal(inboxFor(w,"sam").length,0);
 assert.equal(conversationWith(w,"p","sam").length,0);
 const saved=loadWorld(serializeWorld(w));
 assert.equal(inboxFor(saved,"alex").length,1);
});
test("NPC outgoing texts never pretend to be sent by the player",()=>{
 const w=make();
 for(let i=1;i<4;i++)advanceDay(w);
 const entry=autoTextPlayer(w);
 assert.equal(entry.to,"p");
 assert.notEqual(entry.from,"p");
 assert.equal(autoTextPlayer(w),null);
 assert.ok(composeNpcText(w,"sam","p").length>10);
});
test("invalid messages are rejected",()=>{
 const w=make();
 assert.throws(()=>sendMessage(w,{from:"p",to:"alex",text:""}),/Text/);
 assert.throws(()=>sendMessage(w,{from:"p",to:"p",text:"hey"}),/Invalid/);
});
