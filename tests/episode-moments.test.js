import {test} from "node:test";
import assert from "node:assert/strict";
import {startSeason} from "../src/season.js";
import {createSeasonOneCast} from "../src/season-one-cast.js";
import {createPlayerProfile} from "../src/player-profile.js";
import {dailyMoment,chooseDailyMoment,MOMENT_TEMPLATES} from "../src/episode-moments.js";
import {advanceDay,serializeWorld,loadWorld,memoriesOf} from "../src/relationship-engine.js";
const make=()=>startSeason(createPlayerProfile({
 name:"Nova",gender:"woman",age:25,hometown:"Seattle",occupation:"Designer",
 traits:["honest","loyal","romantic","empathetic","outgoing"],attractedTo:["man"]
}),createSeasonOneCast());
test("six rotating scene types begin on day two",()=>{
 const w=make();
 assert.equal(dailyMoment(w),null);
 advanceDay(w);
 assert.equal(dailyMoment(w).day,2);
 assert.equal(MOMENT_TEMPLATES.length,6);
 assert.equal(dailyMoment(w).options.length,3);
 const first=dailyMoment(w);
 advanceDay(w);
 assert.notEqual(dailyMoment(w).id,first.id);
});
test("viewing is safe; an active player choice changes memory",()=>{
 const w=make();advanceDay(w);
 const m=dailyMoment(w);
 assert.equal(w.events.length,0);
 assert.equal(m.result,null);
 assert.throws(()=>chooseDailyMoment(w,"invented"),/Unrecognized/);
 assert.equal(w.events.length,0);
 const chosen=chooseDailyMoment(w,"sit");
 assert.equal(chosen.targetId,m.targetId);
 assert.equal(chosen.eventId,"daily-moment-2-"+m.targetId);
 assert.equal(w.events.length,1);
 assert.equal(memoriesOf(w,m.targetId).length,1);
 assert.throws(()=>chooseDailyMoment(w,"sit"),/already finished/);
});
test("skipping is permanent but has no event consequences",()=>{
 const w=make();advanceDay(w);
 const result=chooseDailyMoment(w,"leave");
 assert.equal(result.eventId,null);
 assert.equal(w.events.length,0);
 const restored=loadWorld(serializeWorld(w));
 assert.equal(dailyMoment(restored).result.choiceId,"leave");
 assert.throws(()=>chooseDailyMoment(restored,"flirt"),/already finished/);
});
test("a saved scene retains its original partner and exact outcome",()=>{
 const w=make();advanceDay(w);
 const first=dailyMoment(w);
 const chosen=chooseDailyMoment(w,"flirt");
 assert.equal(chosen.targetId,first.targetId);
 const restored=loadWorld(serializeWorld(w));
 assert.equal(restored.morningMoments[0].targetId,first.targetId);
 assert.equal(restored.events[0].target,first.targetId);
});

test("a player invitation never forces a date with an incompatible NPC",()=>{
 const w=make();advanceDay(w);advanceDay(w);
 w.people[w.playerId].attractedTo=[];
 const target=dailyMoment(w).targetId;
 const result=chooseDailyMoment(w,"date");
 assert.equal(result.targetId,target);
 assert.equal(result.declined,true);
 assert.equal(result.eventId,null);
 assert.match(result.response,/only feel friendship/);
 assert.equal(w.events.length,0);
 const clone=loadWorld(serializeWorld(w));
 assert.equal(dailyMoment(clone).result.declined,true);
});
