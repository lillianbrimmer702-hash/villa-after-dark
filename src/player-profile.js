/**
 * Character creator validation. A profile created here can be passed
 * directly to startSeason(). Appearance changes are data until matching
 * photorealistic render assets are available.
 */
import {createPersonality} from "./contestant-ai.js";
import {createAppearance,validateAppearance} from "./character-style.js";
const GENDERS=["woman","man","nonbinary"];
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const cleanText=(value,label,max=80,required=true)=>{
 assert(typeof value==="string",label+" must be text");
 const text=value.trim();
 assert(text.length<=max&&(!required||text.length>0),"Invalid "+label);
 return text;
};
export function createPlayerProfile({
 id="player",name,gender,age,hometown="",occupation="",traits,
 backstory="",attractedTo=["man","woman","nonbinary"],
 interests=[],dealbreakers=[],goals=[],appearance
}={}){
 assert(typeof id==="string"&&id.length>0&&id.length<=50,"Invalid player id");
 const playerName=cleanText(name,"player name",40);
 assert(GENDERS.includes(gender),"Invalid player gender");
 assert(Number.isInteger(age)&&age>=21&&age<=35,"Player must be 21–35");
 assert(Array.isArray(attractedTo)&&attractedTo.every(g=>GENDERS.includes(g))&&
   new Set(attractedTo).size===attractedTo.length,"Invalid attraction preferences");
 const personality=createPersonality({traits,interests,dealbreakers,goals});
 const style=appearance??createAppearance();
 validateAppearance(style);
 return {
  id,name:playerName,gender,age,
  hometown:cleanText(hometown,"hometown"),
  occupation:cleanText(occupation,"occupation"),
  backstory:cleanText(backstory,"backstory",2000,false),
  attractedTo:[...attractedTo],
  personality,
  appearance:JSON.parse(JSON.stringify(style))
 };
}
/** A user can update only the visual customization at any time without
 * resetting their relationships, event history, or previous conversations.
 */
export function updatePlayerAppearance(world,newAppearance){
 assert(world&&world.playerId&&world.people[world.playerId],"No player in world");
 validateAppearance(newAppearance);
 world.people[world.playerId].appearance=JSON.parse(JSON.stringify(newAppearance));
 return world.people[world.playerId].appearance;
}
