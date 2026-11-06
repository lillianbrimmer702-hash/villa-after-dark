import {TRAITS,createPersonality} from "./contestant-ai.js";
import {generateAppearance} from "./character-style.js";

/** Procedural contestant casting with reproducible variety.
 * Fictional names/backstories; profiles are data, not AI-generated conversations.
 */
const FIRST_NAMES=["Amara","Jasmine","Nia","Sofia","Isla","Zara","Naomi","Maya","Elena","Priya","Camila","Talia","Jordan","Kai","Mateo","Andre","Theo","Noah","Elias","Dante","Rowan","Miles","Adrian","Jules"];
const HOMETOWNS=["Miami","Chicago","Atlanta","Seattle","New York","Austin","Los Angeles","Toronto","London","Phoenix","Houston","San Diego"];
const JOBS=["architect","nurse","dancer","chef","photographer","teacher","entrepreneur","software developer","personal trainer","designer","paramedic","marine biologist"];
const MOTIVES=["find a lasting relationship","take a chance on love","open up after heartbreak","prove they can commit","meet someone who shares their ambitions","stop choosing unavailable partners"];
const SECRETS=["is still close friends with an ex","almost backed out of coming","has never been in a serious relationship","is secretly afraid of commitment","has a major career decision waiting at home","feels pressure to impress their family"];
const INTERESTS=["music","travel","food","fitness","reading","art","hiking","fashion","movies","gaming","dancing","animals"];
const DEALBREAKERS=["betrayal","argument","dishonesty","disrespect"];
const ORIENTATIONS=["straight","bisexual","pansexual","gay"];
const GENDERS=["woman","man","nonbinary"];
function attractionFor(gender,orientation){
  if(orientation==="bisexual"||orientation==="pansexual") return [...GENDERS];
  if(gender==="woman")return [orientation==="gay"?"woman":"man"];
  if(gender==="man")return [orientation==="gay"?"man":"woman"];
  // Nonbinary attraction varies individually; avoid assuming binary labels
  // describe everyone's experiences the same way.
  return orientation==="gay"?["nonbinary"]:["woman","man"];
}
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
function prng(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};}
function sample(array,r){return array[Math.floor(r()*array.length)];}
function sampleDistinct(array,n,r){const pool=[...array];const result=[];while(result.length<n){const i=Math.floor(r()*pool.length);result.push(pool.splice(i,1)[0]);}return result;}
export function generateCast(seed="season-one",count=11){
 assert(Number.isInteger(count)&&count>=1&&count<=11,"Cast size must be 1–11");
 const r=prng(seed);
 const names=sampleDistinct(FIRST_NAMES,count,r);
 return names.map((name,i)=>{
   const gender=GENDERS[i%GENDERS.length];
   const orientation=ORIENTATIONS[(i+Math.floor(r()*ORIENTATIONS.length))%ORIENTATIONS.length];
   const attractedTo=attractionFor(gender,orientation);
   const age=21+Math.floor(r()*15);
   const hometown=sample(HOMETOWNS,r);
   const occupation=sample(JOBS,r);
   const goal=sample(MOTIVES,r);
   const secret=sample(SECRETS,r);
   return {
     id:"npc-"+String(i+1).padStart(2,"0"),
     name,age,gender,orientation,attractedTo,hometown,occupation,
     appearance:generateAppearance(String(seed)+"|npc-"+i),
     motive:goal,secret,
     backstory:`${name}, ${age}, is a ${occupation} from ${hometown}. They came to the villa to ${goal}.`,
     personality:createPersonality({
       traits:sampleDistinct(TRAITS,5,r),
       interests:sampleDistinct(INTERESTS,3,r),
       dealbreakers:[sample(DEALBREAKERS,r)],
       goals:[goal]
     })
   };
 });
}
