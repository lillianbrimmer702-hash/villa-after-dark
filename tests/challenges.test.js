import {test} from "node:test";
import assert from "node:assert/strict";
import {createWorld,advanceDay,serializeWorld,loadWorld} from "../src/relationship-engine.js";
import {challengeForDay,runChallenge} from "../src/challenges.js";
import {audienceStandings} from "../src/cast-management.js";
const make=()=>{
 const w=createWorld([
  {id:"player",isPlayer:true,personality:{traits:["honest","loyal","romantic","cautious","empathetic"]}},
  {id:"alex",personality:{traits:["honest","competitive"]}},
  {id:"sam",personality:{traits:["romantic","outgoing"]}}
 ]);
 w.playerId="player";return w;
};
const day=(w,n)=>{while(w.day<n)advanceDay(w);};
test("nine distinct challenges across the season",()=>{
 const days=[9,18,27,36,45,54,63,72,81];
 assert.equal(new Set(days.map(d=>challengeForDay(d).id)).size,9);
 assert.equal(challengeForDay(8),null);
 assert.equal(challengeForDay(90),null);
});
test("player can abstain without automatic consent",()=>{
 const w=make();day(w,9);
 const result=runChallenge(w);
 const player=result.rankings.find(x=>x.personId==="player");
 assert.equal(result.approach,null);
 assert.equal(player.participated,false);
 assert.equal(player.score,0);
 assert.throws(()=>runChallenge(w,{approach:"bold"}),/already resolved/);
 const restored=loadWorld(serializeWorld(w));
 assert.deepEqual(restored.challengeResults,[result]);
});
test("chosen approach creates a public competition result",()=>{
 const w=make();day(w,9);
 const before=audienceStandings(w);
 const result=runChallenge(w,{approach:"thoughtful"});
 assert.ok(result.rankings.some(x=>x.personId==="player"&&x.participated));
 assert.equal(w.events.length,0);
 assert.notDeepEqual(audienceStandings(w),before);
});
test("invalid approach and off-day challenge don't mutate",()=>{
 const w=make();
 assert.throws(()=>runChallenge(w),/No challenge/);
 day(w,9);
 assert.throws(()=>runChallenge(w,{approach:"cheat"}),/Invalid/);
 assert.equal(w.challengeResults,undefined);
});
