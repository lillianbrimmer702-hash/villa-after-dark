/**
 * Villa After Dark — public villa challenges.
 * The player can choose a strategy or skip; NPCs compete independently.
 * Challenge scores are public. Private relationships and secrets do not
 * contribute to the fictional public vote.
 */
export const CHALLENGE_DAYS=Object.freeze([9,18,27,36,45,54,63,72,81]);
const CHALLENGES=Object.freeze([
 {id:"truth-or-dare",title:"Truth or Dare",location:"firepit",skill:"honest",
  intro:"Tonight the islanders test how bold they're willing to be."},
 {id:"chemistry-relay",title:"Chemistry Relay",location:"pool",skill:"outgoing",
  intro:"A poolside race tests teamwork and quick thinking."},
 {id:"heart-race",title:"Heart Race",location:"garden",skill:"flirtatious",
  intro:"The villa competes to see who can command the stage."},
 {id:"trust-fall",title:"Trust Fall",location:"garden",skill:"loyal",
  intro:"The islanders face a series of trust challenges."},
 {id:"villa-trivia",title:"How Well Do You Know Me?",location:"firepit",skill:"empathetic",
  intro:"Contestants are quizzed on their villa friendships."},
 {id:"couples-kitchen",title:"Couples in the Kitchen",location:"outdoor_kitchen",skill:"cautious",
  intro:"A chaotic dinner competition pits teams against the clock."},
 {id:"secrets-quiz",title:"Secrets and Stories",location:"firepit",skill:"honest",
  intro:"Carefully chosen trivia questions reveal who has been paying attention."},
 {id:"dance-duel",title:"Dance Floor Duel",location:"pool",skill:"outgoing",
  intro:"The islanders compete for the best performance of the night."},
 {id:"final-compatibility",title:"Final Compatibility Test",location:"beach",skill:"romantic",
  intro:"With the finale approaching, the islanders reflect on their connections."}
]);
const STRATEGIES=Object.freeze({
 bold:{label:"Go all in",points:6,trait:"impulsive"},
 thoughtful:{label:"Think before you act",points:5,trait:"cautious"},
 team_player:{label:"Support the other islanders",points:5,trait:"empathetic"}
});
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
function deterministic(s){let h=2166136261;for(const x of String(s)){h^=x.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function challengeForDay(day){
 const index=CHALLENGE_DAYS.indexOf(day);
 return index===-1?null:{...CHALLENGES[index],day,
   strategies:Object.entries(STRATEGIES).map(([id,value])=>({id,label:value.label}))};
}
export function runChallenge(world,{approach=null}={}){
 const challenge=challengeForDay(world.day);
 assert(challenge,"No challenge scheduled today");
 assert(!world.challengeResults?.some(c=>c.day===world.day),"Challenge already resolved");
 assert(approach===null||Object.hasOwn(STRATEGIES,approach),"Invalid player challenge choice");
 assert(world.playerId&&world.people[world.playerId],"No player");
 const ids=Object.keys(world.people).filter(id=>!world.people[id].eliminated).sort();
 const rankings=ids.map(id=>{
   const person=world.people[id],traits=person.personality?.traits||[];
   let score=10+(deterministic(challenge.id+"|"+id)%7);
   if(traits.includes(challenge.skill))score+=9;
   if(id===world.playerId){
     // Never choose on behalf of the player.
     if(approach===null)score=0;
     else {
       score+=STRATEGIES[approach].points;
       if(traits.includes(STRATEGIES[approach].trait))score+=4;
     }
   }else{
     if(traits.includes("competitive"))score+=3;
     if(traits.includes("outgoing"))score+=2;
   }
   return {personId:id,score,participated:id!==world.playerId||approach!==null};
 }).sort((a,b)=>b.score-a.score||a.personId.localeCompare(b.personId));
 const result={
   day:world.day,id:challenge.id,title:challenge.title,
   location:challenge.location,approach,rankings,
   winner:rankings[0]?.personId??null,public:true
 };
 world.challengeResults ||= [];
 world.challengeResults.push(result);
 return result;
}
