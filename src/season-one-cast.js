/**
 * Original season-one cast approved for the visual romance direction.
 * Six men and five women join a player-designed woman for a 6/6 starting villa.
 * The player is NEVER preset or renamed by this module.
 */
import {createPersonality} from "./contestant-ai.js";
import {createAppearance} from "./character-style.js";
const CAST=Object.freeze([
 {id:"npc-01",name:"Luca",gender:"man",age:27,hometown:"Miami, Florida",occupation:"Tattoo artist",
  orientation:"bisexual",attractedTo:["woman","man"],traits:["flirtatious","impulsive","romantic","secretive","competitive"],
  interests:["art","fitness","travel"],dealbreaker:"dishonesty",motive:"find something genuine without losing his edge",
  secret:"once left a serious relationship without explaining why",
  backstory:"Luca built a successful tattoo studio from scratch. He's magnetic and quick with a compliment, but past heartbreak has made him evasive when feelings get serious.",
  look:{skinTone:"tan",hairTexture:"curly",hairColor:"dark-brown",hairLength:"shoulder",bodyType:"athletic",tattoo:"full-sleeve",piercing:"hoops"}},
 {id:"npc-02",name:"Ezra",gender:"man",age:24,hometown:"Los Angeles, California",occupation:"Fashion model",
  orientation:"straight",attractedTo:["woman"],traits:["romantic","empathetic","honest","shy","forgiving"],
  interests:["fashion","music","photography"],dealbreaker:"disrespect",motive:"be loved for who he is off camera",
  secret:"has quietly turned down a career-making contract to protect his mental peace",
  backstory:"Ezra has modeled internationally, but most people mistake his looks for confidence. He writes thoughtful letters and wants a partner who can see past the spotlight.",
  look:{skinTone:"golden",hairTexture:"curly",hairColor:"honey-blonde",hairLength:"short",bodyType:"slender",makeup:"none"}},
 {id:"npc-03",name:"Mason",gender:"man",age:29,hometown:"New York, New York",occupation:"Investment analyst",
  orientation:"straight",attractedTo:["woman"],traits:["ambitious","competitive","cautious","honest","independent"],
  interests:["travel","food","fitness"],dealbreaker:"betrayal",motive:"learn to prioritize connection over winning",
  secret:"is considering leaving a prestigious job that no longer makes him happy",
  backstory:"Mason is polished, disciplined and hard to impress. He values honesty but often turns relationships into negotiations without meaning to.",
  look:{skinTone:"deep-brown",hairTexture:"short",hairLength:"short",hairColor:"jet-black",bodyType:"muscular"}},
 {id:"npc-04",name:"Andre",gender:"man",age:26,hometown:"Atlanta, Georgia",occupation:"Professional trainer",
  orientation:"straight",attractedTo:["woman"],traits:["loyal","outgoing","jealous","empathetic","competitive"],
  interests:["fitness","music","cooking"],dealbreaker:"disrespect",motive:"find someone who embraces his intense, affectionate side",
  secret:"still wonders whether he broke up with the right person",
  backstory:"Andre coaches athletes by day and is the life of every gathering after dark. He's affectionate and reliable, until uncertainty brings out his jealousy.",
  look:{skinTone:"warm-brown",hairTexture:"braided",hairLength:"shoulder",hairColor:"jet-black",bodyType:"muscular",tattoo:"full-sleeve"}},
 {id:"npc-05",name:"Nico",gender:"man",age:25,hometown:"Las Vegas, Nevada",occupation:"Fashion stylist",
  orientation:"bisexual",attractedTo:["woman","man"],traits:["flirtatious","outgoing","impulsive","secretive","independent"],
  interests:["fashion","dancing","travel"],dealbreaker:"dishonesty",motive:"prove there's more to him than a charming first impression",
  secret:"has dated two people in the same friend group before",
  backstory:"Nico knows how to dress, dance, and get everyone laughing. Keeping things casual is easy for him; staying when it gets complicated is the challenge.",
  look:{skinTone:"light-olive",hairTexture:"wavy",hairLength:"shoulder",hairColor:"dark-brown",bodyType:"athletic"}},
 {id:"npc-06",name:"Rafael",gender:"man",age:30,hometown:"San Diego, California",occupation:"Restaurant owner",
  orientation:"straight",attractedTo:["woman"],traits:["romantic","loyal","cautious","ambitious","empathetic"],
  interests:["food","travel","reading"],dealbreaker:"betrayal",motive:"meet someone ready for a life outside the villa",
  secret:"is weighing an offer to open a restaurant overseas",
  backstory:"Rafael runs a beloved coastal restaurant and knows what he wants. He's quietly passionate, but a major life decision could complicate any romance.",
  look:{skinTone:"golden",hairTexture:"wavy",hairLength:"short",hairColor:"dark-brown",bodyType:"athletic"}},
 {id:"npc-07",name:"Sienna",gender:"woman",age:23,hometown:"Los Angeles, California",occupation:"Content creator",
  orientation:"bisexual",attractedTo:["woman","man"],traits:["competitive","flirtatious","ambitious","outgoing","secretive"],
  interests:["fashion","travel","music"],dealbreaker:"disrespect",motive:"have real chemistry outside the comments section",
  secret:"is hiding how much online criticism has affected her confidence",
  backstory:"Sienna is a natural bombshell and knows exactly how to work a room. Behind her perfect feed is someone tired of being treated like a brand.",
  look:{skinTone:"fair-warm",hairTexture:"wavy",hairLength:"long",hairColor:"honey-blonde",bodyType:"curvy",makeup:"evening-glam"}},
 {id:"npc-08",name:"Jade",gender:"woman",age:26,hometown:"Chicago, Illinois",occupation:"Brand strategist",
  orientation:"straight",attractedTo:["man"],traits:["honest","cautious","independent","ambitious","loyal"],
  interests:["art","reading","fashion"],dealbreaker:"dishonesty",motive:"find a connection worthy of letting her guard down",
  secret:"once chose a promotion over a partner and still regrets it",
  backstory:"Jade is effortlessly polished and reads people fast. She doesn't compete for attention, and she's slow to trust anyone who seems too practiced at romance.",
  look:{skinTone:"warm-brown",hairTexture:"straight",hairLength:"long",hairColor:"jet-black",bodyType:"slender",makeup:"soft-glam"}},
 {id:"npc-09",name:"Skye",gender:"woman",age:22,hometown:"Orlando, Florida",occupation:"Fitness instructor",
  orientation:"bisexual",attractedTo:["man","woman"],traits:["outgoing","romantic","impulsive","forgiving","empathetic"],
  interests:["fitness","animals","dancing"],dealbreaker:"betrayal",motive:"follow her heart without rushing into the wrong choice",
  secret:"used to have a crush on someone already connected to another islander",
  backstory:"Skye's sunny charm wins people over quickly. She's spontaneous and fun, but her optimism can make her overlook warning signs.",
  look:{skinTone:"fair-warm",hairTexture:"curly",hairLength:"shoulder",hairColor:"copper",bodyType:"athletic",makeup:"soft-glam"}},
 {id:"npc-10",name:"Valentina",gender:"woman",age:28,hometown:"New York, New York",occupation:"Fashion designer",
  orientation:"straight",attractedTo:["man"],traits:["jealous","flirtatious","ambitious","honest","impulsive"],
  interests:["fashion","art","dancing"],dealbreaker:"dishonesty",motive:"find someone who can match her energy and honesty",
  secret:"knows a bombshell arriving later in the season",
  backstory:"Valentina creates dramatic looks and speaks her mind. Under her glamorous exterior she wants unwavering loyalty, not a temporary fling.",
  look:{skinTone:"tan",hairTexture:"wavy",hairLength:"long",hairColor:"jet-black",bodyType:"curvy",makeup:"editorial"}},
 {id:"npc-11",name:"Mila",gender:"woman",age:25,hometown:"Tampa, Florida",occupation:"Nurse",
  orientation:"straight",attractedTo:["man"],traits:["loyal","romantic","empathetic","shy","forgiving"],
  interests:["animals","music","reading"],dealbreaker:"betrayal",motive:"learn to ask for as much love as she gives",
  secret:"recently ended an engagement and hasn't told anyone yet",
  backstory:"Mila cares deeply, loves quietly, and has a laugh that makes people relax. After a painful breakup, she's trying to trust her instincts again.",
  look:{skinTone:"fair-neutral",hairTexture:"curly",hairLength:"long",hairColor:"copper",bodyType:"curvy",makeup:"soft-glam"}}
]);
export const STARTING_ROSTER=Object.freeze(CAST.map(({id,name,gender,age,occupation})=>
 Object.freeze({id,name,gender,age,occupation})));
export function createSeasonOneCast(){
 return CAST.map((c)=>{
  const {traits,interests,dealbreaker,look,...data}=c;
  return {...data,appearance:createAppearance(look),
    personality:createPersonality({
      traits:[...traits],interests:[...interests],dealbreakers:[dealbreaker],goals:[c.motive]
    })
  };
 });
}
