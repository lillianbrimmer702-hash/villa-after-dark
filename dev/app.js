import {createPlayerProfile} from "../src/player-profile.js";
import {createAppearance} from "../src/character-style.js";
import {generateCast} from "../src/cast-generator.js";
import {startSeason,completeDay} from "../src/season.js";
import {say} from "../src/conversation.js";
import {availableScenes,chooseStoryOption} from "../src/story-engine.js";
import {runRecoupling,partnerOf,mutuallyAttracted} from "../src/coupling.js";
import {relationshipBetween} from "../src/relationship-engine.js";
import {activeContestants} from "../src/cast-management.js";
import {dailyAgenda,contestantLocations} from "../src/villa-schedule.js";
import {saveSlot,loadSlot} from "../src/save-slots.js";
import {resolveFinale,reunionSummary} from "../src/finale.js";

const root=document.getElementById("app");
const state={world:null,tab:"villa",selectedNPC:null,dialogue:null,feedback:"",
  lastReport:null,playerChoice:undefined};
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[c]);
const html=(...segments)=>segments.join("");
const panel=content=>'<section class="panel">'+content+'</section>';
const button=(action,label,extra="")=>'<button type="button" data-action="'+esc(action)+'" '+extra+'>'+esc(label)+'</button>';
const activeNpcIds=()=>state.world?activeContestants(state.world).filter(id=>id!==state.world.playerId):[];
function selectedNPC(){
  const ids=activeNpcIds();
  if(!ids.includes(state.selectedNPC))state.selectedNPC=ids[0]||null;
  return state.selectedNPC;
}
function personName(id){return id?state.world.people[id]?.name||id:"Nobody";}
function persist(){
  if(!state.world)return;
  try{saveSlot(localStorage,"autosave",state.world,{title:"Developer checkpoint"});}
  catch(e){state.feedback="Autosave unavailable: "+e.message;}
}
function intro(){
  const traits=["loyal","romantic","ambitious","jealous","outgoing","shy","honest",
    "secretive","flirtatious","cautious","impulsive","empathetic","competitive","independent","forgiving"];
  return panel(html(
    '<p class="eyebrow">Internal development environment</p>',
    '<h2>Set up a test season</h2>',
    '<p class="muted">This is for testing rules and game flow. It is NOT a release of Villa After Dark; realistic art is still in production.</p>',
    '<form id="player-form">',
    '<div class="field"><label for="player-name">Your character name</label><input id="player-name" name="name" required maxlength="40" placeholder="Name"></div>',
    '<div class="row"><div class="field"><label for="gender">Gender</label><select id="gender" name="gender"><option value="woman">Woman</option><option value="man">Man</option><option value="nonbinary">Nonbinary</option></select></div>',
    '<div class="field"><label for="age">Age</label><input id="age" name="age" type="number" min="21" max="35" value="25" required></div></div>',
    '<div class="field"><label for="hometown">Hometown</label><input id="hometown" name="hometown" maxlength="80"></div>',
    '<div class="field"><label for="occupation">Occupation</label><input id="occupation" name="occupation" maxlength="80"></div>',
    '<div class="field"><label for="backstory">Backstory</label><textarea id="backstory" name="backstory" maxlength="2000"></textarea></div>',
    '<div class="field"><label>Five personality traits (choose exactly five)</label><div class="checkgrid">',
    traits.map((t,i)=>'<label><input type="checkbox" name="traits" value="'+esc(t)+'" '+(i<5?"checked":"")+'>'+esc(t)+'</label>').join(""),
    '</div></div>',
    '<div class="field"><label>Attracted to</label><div class="checkgrid">',
    ["woman","man","nonbinary"].map(g=>'<label><input type="checkbox" name="attractedTo" value="'+g+'" checked>'+g+'</label>').join(""),
    '</div></div><button class="primary" type="submit">Create developer test season</button></form>'
  ));
}
function top(){
  const world=state.world;
  const heading='<header class="topbar"><div><p class="eyebrow">Villa After Dark · Development</p>'+
    '<h1 class="brand">Villa After Dark</h1><p class="subtitle">The rules-engine integration workspace</p></div>'+
    (world?'<div class="chip">Day '+world.day+' of 90</div>':'')+'</header>';
  const notice='<div class="notice"><strong>Not the completed game.</strong> This internal interface uses text-only placeholders while the original realistic character and villa artwork are unfinished. Do not publish as the player-facing release.</div>';
  return heading+notice;
}
function nav(){
 const names=[["villa","Villa"],["talk","Conversations"],["cast","Cast"],["profile","Profile"],
   ["journal","Journal"],["finale","Finale"]];
 return '<nav class="nav" aria-label="Development sections">'+names.map(([key,label])=>
   '<button data-action="tab" data-tab="'+key+'" class="'+(state.tab===key?"active":"")+
   '" aria-current="'+(state.tab===key?"page":"false")+'">'+label+'</button>').join("")+'</nav>';
}
function playerMini(){
 const world=state.world;
 const me=world.people[world.playerId];
 const partner=partnerOf(world,world.playerId);
 return panel('<p class="eyebrow">Your Season</p><h3>'+esc(me.name)+'</h3>'+
  '<div class="statline"><span>Day</span><strong>'+world.day+' / 90</strong></div>'+
  '<div class="statline"><span>Partner</span><strong>'+esc(personName(partner))+'</strong></div>'+
  '<div class="statline"><span>Starting cast</span><strong>11 NPCs</strong></div>'+
  '<div class="statline"><span>Currently in villa</span><strong>'+activeContestants(world).length+'</strong></div>'+
  '<div class="statline"><span>Recorded events</span><strong>'+world.events.length+'</strong></div>'+
  '<div class="statline"><span>Secrets shared</span><strong>'+(world.gossipLog||[]).length+'</strong></div>');
}
function pairingControl(){
 const world=state.world;
 if(world.day!==1 && !(world.day%14===0&&world.day<90))return "";
 if(world.ceremonies?.some(c=>c.day===world.day))return "";
 const me=world.playerId;
 const choices=activeNpcIds().filter(id=>mutuallyAttracted(world,me,id));
 return panel('<h3>'+ (world.day===1?"First pairing":"Recoupling ceremony")+'</h3>'+
  '<p class="small muted">Only the player chooses the player’s partner. Leaving the selection unchanged keeps the current partner, if any.</p>'+
  '<div class="field"><label for="partner-choice">Your choice</label><select id="partner-choice">'+
  '<option value="keep">Keep current partner / remain single</option><option value="single">Choose to be single</option>'+
  choices.map(id=>'<option value="'+esc(id)+'">'+esc(personName(id))+'</option>').join("")+'</select></div>'+
  (world.day===1?button("first-coupling","Hold first pairing","class='primary'"):"<p class='small muted'>This ceremony will take place when you advance the day.</p>"));
}
function villa(){
 const world=state.world;
 const schedule=dailyAgenda(world);
 const report=state.lastReport;
 const places=contestantLocations(world);
 const placeCount={};Object.values(places).forEach(x=>placeCount[x]=(placeCount[x]||0)+1);
 return html(
  panel('<p class="eyebrow">Villa schedule</p><h2>Day '+world.day+'</h2>'+
   '<div class="illustration-pending">Final realistic villa environment art pending<br>Pool · Firepit · Suites · Outdoor kitchen · Spa</div>'+
   '<ul>'+schedule.events.map(e=>'<li><strong>'+esc(e.time)+'</strong> — '+esc(e.title)+
     ' <span class="muted">('+esc(e.location)+')</span></li>').join("")+'</ul>'+
   (report?'<div class="highlight">Previous day: '+report.interactions.length+' NPC interactions'+
    (report.ceremony?", recoupling held":"")+
    (report.arrival?", new bombshell arrived":"")+
    (report.elimination?", elimination occurred":"")+'.</div>':"")+
   '<div class="button-row">'+button("advance","Complete this day","class='primary'")+'</div>'),
  pairingControl(),
  panel('<h3>Contestants around the villa</h3><p class="muted small">Developer location simulation; these are not the final scenes.</p>'+
   Object.entries(placeCount).map(([place,n])=>'<div class="statline"><span>'+esc(place.replaceAll("_"," "))+
    '</span><strong>'+n+'</strong></div>').join(""))
 );
}
function cast(){
 const world=state.world;
 const ids=Object.keys(world.people).filter(id=>id!==world.playerId);
 return panel('<h2>Cast</h2><p class="muted">NPC relationships and profiles are shown for internal verification.</p>'+
   '<div class="cards">'+ids.map(id=>{
    const p=world.people[id],rel=relationshipBetween(world,world.playerId,id);
    return '<article class="person '+(selectedNPC()===id?"selected":"")+'">'+
      '<p class="chip">'+(p.eliminated?"Eliminated · day "+p.eliminatedDay:"In villa")+'</p>'+
      '<h3>'+esc(p.name||id)+'</h3><div class="muted small">'+esc(p.age||"")+" · "+esc(p.occupation||"Contestant")+
      '</div><div class="tags">'+esc((p.personality?.traits||[]).join(" · "))+'</div>'+
      '<div class="small">Affection '+rel.affection+' · Trust '+rel.trust+'</div>'+
      button("choose-npc","Open conversation","data-npc='"+esc(id)+"' "+(p.eliminated?"disabled":""))+
      '</article>';
   }).join("")+'</div>');
}
function talk(){
 const world=state.world;
 const id=selectedNPC();
 if(!id)return panel("<h2>No active contestants available.</h2>");
 const npc=world.people[id];
 const scenes=availableScenes(world,id).slice(0,3);
 const last=state.dialogue;
 return html(panel('<h2>Talk with '+esc(npc.name||id)+'</h2>'+
   '<div class="field"><label for="npc-select">Conversation partner</label><select id="npc-select">'+
   activeNpcIds().map(other=>'<option value="'+esc(other)+'" '+(id===other?"selected":"")+
    '>'+esc(personName(other))+'</option>').join("")+'</select></div>'+
   '<div class="illustration-pending">Realistic portrait and full-body artwork not yet integrated.<br>No cartoon stand-ins.</div>'+
   '<p class="muted">'+esc(npc.motive||"Getting to know the other islanders.")+'</p>'+
   (last?'<div class="transcript"><strong>Most recent response</strong><p>'+esc(last.reply||last.response)+'</p>'+
     (last.understood===false?"<p class='small warning'>The text interpreter did not recognize that action.</p>":"")+
     '</div>':"")+
   '<form id="talk-form"><div class="field"><label for="talk-text">Type what you want to say</label>'+
   '<textarea required maxlength="2000" id="talk-text" name="message" placeholder="Say something to this contestant..."></textarea></div>'+
   '<button class="primary" type="submit">Speak</button></form>'),
  panel('<h3>Authored story scenes</h3>'+
   (scenes.length?scenes.map(scene=>'<article class="scene"><p class="chip">'+esc(scene.location)+'</p>'+
    '<h3>'+esc(scene.title)+'</h3><p>'+esc(scene.opening)+'</p><div class="choices">'+
    scene.choices.map(choice=>button("story-choice",choice.label,
       "data-scene='"+esc(scene.id)+"' data-choice='"+esc(choice.id)+"'")).join("")+
    '</div></article>').join(""):"<p class='muted'>No new story scene available right now.</p>")
  ));
}
function profile(){
 const p=state.world.people[state.world.playerId];
 return panel('<h2>Character profile</h2><h3>'+esc(p.name)+'</h3>'+
  '<p>'+esc(p.age||"")+' · '+esc(p.hometown||"")+' · '+esc(p.occupation||"")+'</p>'+
  '<p>'+esc(p.backstory||"No backstory yet.")+'</p>'+
  '<p class="chip">Personality</p><p>'+esc(p.personality?.traits?.join(", "))+'</p>'+
  '<div class="illustration-pending">All characters share the same digital-human art specification.<br>The real image layers are not yet authored.</div>'+
  '<p class="small muted">Appearance data: '+Object.entries(p.appearance.features).map(([k,v])=>esc(k)+": "+esc(v)).join(" · ")+'</p>'+
  '<p class="small muted">Current wardrobe data: '+Object.values(p.appearance.outfit).filter(Boolean).map(esc).join(", ")+'</p>');
}
function journal(){
 const w=state.world;
 const recent=w.events.slice(-20).reverse();
 return panel('<h2>Journal</h2><p class="muted">Recorded memories and choices across your season.</p>'+
  (recent.length?'<ul>'+recent.map(e=>'<li><strong>Day '+e.day+'</strong>: '+
    esc(personName(e.actor))+' and '+esc(personName(e.target))+' · '+esc(e.type)+'</li>').join("")+'</ul>':
    "<p>There are no recorded events yet.</p>")+
  '<hr class="divider"><h3>Departures</h3><p class="small">'+
  (w.eliminations?.map(e=>esc(personName(e.personId))+" (day "+e.day+")").join(", ")||"None")+'</p>');
}
function finale(){
 const w=state.world;
 if(!w.simulatedDays.includes(90))return panel('<h2>The Finale</h2><p class="muted">Reach the end of Day 90 to calculate an ending based on your season.</p>');
 const summary=w.finale?reunionSummary(w):null;
 return panel('<h2>The Finale</h2>'+
  (summary?'<p class="highlight"><strong>Ending:</strong> '+esc(summary.ending.replaceAll("_"," "))+'</p>'+
   '<p>Winning couple: '+esc(summary.winningCouple?
    personName(summary.winningCouple.a)+" & "+personName(summary.winningCouple.b):"None")+'</p>'+
   '<h3>Reunion highlights</h3><ul>'+summary.highlights.map(h=>
    '<li>Day '+h.day+': '+esc(h.type)+' — '+esc(personName(h.actor))+
    ' / '+esc(personName(h.target))+'</li>').join("")+'</ul>':
   '<p>Final relationships and fictional public rankings are ready to be evaluated.</p>'+
   button("resolve-finale","Resolve finale","class='primary'")));
}
function render(){
 const world=state.world;
 let content;
 if(!world)content=intro();
 else{
  const tabs={villa,talk,cast,profile,journal,finale};
  content='<div class="grid"><div class="stack">'+(tabs[state.tab]||villa)()+
    '</div><aside class="stack">'+playerMini()+
    panel('<h3>Developer controls</h3>'+
      button("save","Save checkpoint")+' '+button("reset","Start new season")+
      '<p class="small muted">Autosave records your simulation locally in this browser.</p>')+
    '</aside></div>';
 }
 root.innerHTML='<div class="shell">'+top()+(world?nav():"")+
   (state.feedback?'<p class="notice" role="status">'+esc(state.feedback)+'</p>':"")+
   content+'<p class="footer">Internal development build only · No paid APIs · Realistic art pending · Not for release</p></div>';
}
function newSeason(form){
 const data=new FormData(form);
 const traits=data.getAll("traits");
 const wants=data.getAll("attractedTo");
 const player=createPlayerProfile({name:String(data.get("name")||""),gender:String(data.get("gender")||""),
   age:Number(data.get("age")),hometown:String(data.get("hometown")||""),
   occupation:String(data.get("occupation")||""),backstory:String(data.get("backstory")||""),
   traits,attractedTo:wants,appearance:createAppearance()});
 const cast=generateCast("developer-"+Date.now());
 state.world=startSeason(player,cast);
 state.tab="villa";state.selectedNPC=null;state.lastReport=null;state.dialogue=null;
 state.feedback="Development season created. Autosave is enabled.";
 persist();render();
}
root.addEventListener("submit",event=>{
  event.preventDefault();
  try{
   if(event.target.id==="player-form")newSeason(event.target);
   if(event.target.id==="talk-form"&&state.world){
    const id=selectedNPC();
    const text=String(new FormData(event.target).get("message")||"");
    state.dialogue=say(state.world,{speakerId:state.world.playerId,listenerId:id,text,
      eventId:"talk-"+state.world.day+"-"+(state.world.events.length+1)+"-"+id});
    state.feedback=state.dialogue.understood?"Conversation recorded.":"Unrecognized text: no event recorded.";
    persist();render();
   }
  }catch(e){state.feedback=e.message;render();}
});
root.addEventListener("change",event=>{
 if(event.target.id==="npc-select"){state.selectedNPC=event.target.value;state.dialogue=null;render();}
 if(event.target.id==="partner-choice"){
  const choice=event.target.value;
  state.playerChoice=choice==="keep"?undefined:choice==="single"?null:choice;
 }
});
root.addEventListener("click",event=>{
 const target=event.target.closest("[data-action]");
 if(!target||!state.world)return;
 try{
  const world=state.world;
  switch(target.dataset.action){
   case "tab":state.tab=target.dataset.tab;state.dialogue=null;break;
   case "choose-npc":state.selectedNPC=target.dataset.npc;state.tab="talk";state.dialogue=null;break;
   case "first-coupling":{
     const choice=state.playerChoice;
     runRecoupling(world,choice===undefined?{}:{playerChoice:choice});
     state.playerChoice=undefined;state.feedback="First pairing recorded.";break;
   }
   case "advance":{
     if(world.simulatedDays.includes(90))throw Error("Season already completed.");
     const choice=state.playerChoice;
     state.lastReport=completeDay(world,choice===undefined?{}:{playerChoice:choice});
     state.playerChoice=undefined;
     state.feedback="Completed day "+state.lastReport.day+".";
     break;
   }
   case "story-choice":
     state.dialogue=chooseStoryOption(world,{targetId:selectedNPC(),
       sceneId:target.dataset.scene,choiceId:target.dataset.choice});
     state.feedback="Your story choice is part of the permanent season history.";break;
   case "save":persist();state.feedback="Checkpoint saved.";break;
   case "reset":
     if(!confirm("Start a new developer season? This overwrites the autosave."))return;
     state.world=null;state.tab="villa";state.selectedNPC=null;
     state.lastReport=null;state.dialogue=null;state.feedback="";break;
   case "resolve-finale":resolveFinale(world);state.feedback="Finale state recorded.";break;
  }
  persist();render();
 }catch(e){state.feedback=e.message;render();}
});
try{
 const save=loadSlot(localStorage,"autosave");
 if(save?.world){state.world=save.world;state.feedback="Restored developer autosave.";}
}catch(e){state.feedback="Previous autosave was not loaded: "+e.message;}
render();
