import {test} from "node:test";
import assert from "node:assert/strict";
import {startSeason} from "../src/season.js";
import {createSeasonOneCast} from "../src/season-one-cast.js";
import {createPlayerProfile} from "../src/player-profile.js";
import {createAppearance} from "../src/character-style.js";
import {entranceState,continueEntrance,chooseFirstImpression,finishEntrance} from "../src/arrival.js";
import {memoriesOf,serializeWorld,loadWorld,advanceDay} from "../src/relationship-engine.js";
const make=()=>startSeason(createPlayerProfile({
 name:"Nova",age:25,gender:"woman",hometown:"Seattle",occupation:"Artist",
 traits:["honest","empathetic","outgoing","loyal","romantic"],
 attractedTo:["man"],appearance:createAppearance()
}),createSeasonOneCast());
test("first-night opening is player-directed, not auto-flirtation",()=>{
 const w=make();
 assert.equal(entranceState(w).phase,"arrival");
 assert.equal(w.events.length,0);
 continueEntrance(w);
 assert.equal(entranceState(w).phase,"first-impression");
 assert.equal(w.events.length,0);
});
test("the first impression changes relationship memory and survives a save",()=>{
 const w=make();
 continueEntrance(w);
 const moment=chooseFirstImpression(w,{targetId:"npc-01",choiceId:"flirt"});
 assert.match(moment.response,/Nova/);
 assert.equal(w.events.length,1);
 assert.equal(w.events[0].type,"confession");
 assert.equal(memoriesOf(w,"npc-01","player").length,1);
 assert.equal(memoriesOf(w,"npc-02","player").length,0);
 assert.throws(()=>chooseFirstImpression(w,{targetId:"npc-02",choiceId:"friendly"}),/Choose your entrance/);
 finishEntrance(w);
 const saved=loadWorld(serializeWorld(w));
 assert.equal(saved.entrance.completed,true);
 assert.equal(saved.entrance.targetId,"npc-01");
 assert.equal(saved.entrance.choiceId,"flirt");
 assert.equal(saved.entrance.eventId,w.events[0].id);
});
test("invalid target and choice never create events",()=>{
 const w=make();
 assert.throws(()=>chooseFirstImpression(w,{targetId:"npc-01",choiceId:"friendly"}),/entrance moment/);
 continueEntrance(w);
 assert.throws(()=>chooseFirstImpression(w,{targetId:"player",choiceId:"friendly"}),/active islander/);
 assert.throws(()=>chooseFirstImpression(w,{targetId:"npc-01",choiceId:"marry"}),/Unknown/);
 assert.equal(w.events.length,0);
 assert.equal(w.entrance.phase,"first-impression");
});
test("not allowed to replay entrance on a later day",()=>{
 const w=make();advanceDay(w);
 assert.throws(()=>continueEntrance(w),/day one/);
});
