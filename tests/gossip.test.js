import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,recordEvent,advanceDay,serializeWorld,loadWorld} from "../src/relationship-engine.js";
import {tellSecret,gossipAfterInteractions} from "../src/gossip.js";
import {memoriesOf} from "../src/relationship-engine.js";
const make=()=>createWorld([
 {id:"alex",personality:{traits:["outgoing"]}},
 {id:"sam",personality:{traits:["shy"]}},
 {id:"kai",personality:{traits:["impulsive"]}},
 {id:"player",isPlayer:true}
]);
test("unknown secret cannot be repeated by an uninformed contestant",()=>{
 const w=make();
 recordEvent(w,{id:"s1",type:"kiss",day:1,actor:"alex",target:"sam",witnesses:[]});
 assert.throws(()=>tellSecret(w,{teller:"kai",listener:"player",eventId:"s1"}),/does not know/);
 assert.equal(memoriesOf(w,"player").length,0);
});
test("witness can tell someone else; disclosure persists across save",()=>{
 const w=make();
 recordEvent(w,{id:"s1",type:"kiss",day:1,actor:"alex",target:"sam",witnesses:[]});
 assert.equal(tellSecret(w,{teller:"alex",listener:"kai",eventId:"s1"}).shared,true);
 assert.equal(tellSecret(w,{teller:"alex",listener:"kai",eventId:"s1"}).shared,false);
 assert.equal(w.gossipLog.length,1);
 const loaded=loadWorld(serializeWorld(w));
 assert.equal(memoriesOf(loaded,"kai").length,1);
 assert.equal(loaded.gossipLog.length,1);
});
test("autonomous gossip requires a later NPC meeting",()=>{
 const w=make();
 recordEvent(w,{id:"s1",type:"kiss",day:1,actor:"alex",target:"sam",witnesses:[]});
 const encounter=[{actor:"alex",target:"kai"}];
 assert.equal(gossipAfterInteractions(w,encounter).length,0);
 advanceDay(w);
 assert.equal(gossipAfterInteractions(w,encounter).length,1);
 assert.equal(memoriesOf(w,"kai").length,1);
});
test("autonomous gossip never forces player to tell secrets",()=>{
 const w=make();
 recordEvent(w,{id:"s1",type:"kiss",day:1,actor:"alex",target:"player",witnesses:[]});
 advanceDay(w);
 const shared=gossipAfterInteractions(w,[{actor:"player",target:"kai"}]);
 assert.equal(shared.length,0);
 assert.equal(memoriesOf(w,"kai").length,0);
});
