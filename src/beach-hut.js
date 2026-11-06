/**
 * Beach Hut confessionals: private player reflections with explicit airing.
 * Never silently leaks into NPC knowledge or relationships.
 */
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
export const CONFESSIONAL_PROMPTS=Object.freeze([
 {id:"first-night",minDay:1,maxDay:10,prompt:"What was your first impression of the other islanders?"},
 {id:"your-type",minDay:1,maxDay:30,prompt:"Who's your type on paper, and who surprised you?"},
 {id:"trust",minDay:4,maxDay:70,prompt:"Who do you trust the most right now?"},
 {id:"attraction",minDay:5,maxDay:65,prompt:"Who gives you butterflies, and why?"},
 {id:"unspoken",minDay:8,maxDay:75,prompt:"What have you been afraid to say out loud?"},
 {id:"jealousy",minDay:10,maxDay:80,prompt:"Have you felt jealous in the villa?"},
 {id:"competition",minDay:14,maxDay:82,prompt:"Does being on a dating show change how you act?"},
 {id:"commitment",minDay:21,maxDay:86,prompt:"Are you looking for a real relationship beyond the villa?"},
 {id:"betrayal",minDay:21,maxDay:88,prompt:"Has anyone made you question your trust?"},
 {id:"growth",minDay:35,maxDay:90,prompt:"How have you changed since you arrived?"},
 {id:"future",minDay:60,maxDay:90,prompt:"What do you hope happens after the finale?"},
 {id:"final-reflection",minDay:86,maxDay:90,prompt:"What will you remember most about this season?"}
]);
export function availableConfessionals(world){
 assert(world.playerId&&world.people[world.playerId],"No player in world");
 const seen=new Set((world.confessionals||[]).map(x=>x.promptId));
 return CONFESSIONAL_PROMPTS.filter(p=>world.day>=p.minDay&&world.day<=p.maxDay&&!seen.has(p.id));
}
export function recordConfessional(world,{promptId,text}){
 const prompt=availableConfessionals(world).find(p=>p.id===promptId);
 assert(prompt,"Confessional prompt not available");
 assert(typeof text==="string"&&text.trim().length>0&&text.length<=2000,"Confessional must be 1–2000 characters");
 world.confessionals ||= [];
 const entry={id:"confessional-"+world.day+"-"+(world.confessionals.length+1),
   day:world.day,promptId,text:text.trim(),aired:false};
 world.confessionals.push(entry);
 return {...entry};
}
export function airConfessional(world,confessionalId){
 const entry=(world.confessionals||[]).find(x=>x.id===confessionalId);
 assert(entry,"Unknown confessional");
 assert(!entry.aired,"Confessional already aired");
 entry.aired=true;
 entry.airDay=world.day;
 // Fictional audience may see it later, but NPCs have NOT seen it.
 return {...entry};
}
export function playerConfessionals(world){
 return (world.confessionals||[]).map(c=>({...c}));
}
