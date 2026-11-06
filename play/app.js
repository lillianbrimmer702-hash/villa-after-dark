import {createPlayerProfile,updatePlayerAppearance} from "../src/player-profile.js";
import {createAppearance,APPEARANCE_OPTIONS,GARMENTS,changeFeature,equip,saveLook} from "../src/character-style.js";
import {createSeasonOneCast,STARTING_ROSTER} from "../src/season-one-cast.js";
import {startSeason,completeDay} from "../src/season.js";
import {say,suggestedReplies} from "../src/conversation.js";
import {availableScenes,chooseStoryOption} from "../src/story-engine.js";
import {runRecoupling,partnerOf,mutuallyAttracted} from "../src/coupling.js";
import {relationshipBetween} from "../src/relationship-engine.js";
import {activeContestants} from "../src/cast-management.js";
import {dailyAgenda,contestantLocations} from "../src/villa-schedule.js";
import {saveSlot,loadSlot,deleteSlot} from "../src/save-slots.js";
import {challengeForDay} from "../src/challenges.js";
import {playerJournal} from "../src/journal.js";
import {sendMessage,inboxFor} from "../src/phone.js";
import {availableConfessionals,recordConfessional,airConfessional,playerConfessionals} from "../src/beach-hut.js";
import {previewFinale,resolveFinale,reunionSummary} from "../src/finale.js";

const root=document.getElementById("app");
const SAVE="visual-season-one";
const state={world:null,tab:"home",npc:"npc-01",place:"pool",feedback:"",
  dialogue:null,lastReport:null,pairing:undefined,strategy:null};
const places=[
 {id:"pool",name:"Pool Deck",image:0,note:"Meet by the water"},
 {id:"firepit",name:"Firepit",image:1,note:"Nighttime conversations"},
 {id:"shared_bedroom",name:"Shared Bedroom",image:2,note:"Early mornings and late nights"},
 {id:"outdoor_kitchen",name:"Kitchen & Bar",image:3,note:"Get to know someone"},
 {id:"spa",name:"Wellness Studio",image:4,note:"An escape from the drama"},
 {id:"beach",name:"Beach",image:5,note:"A quieter place"}
];
const navItems=[["home","⌂","Villa"],["cast","♧","Islanders"],["explore","⌖","Explore"],["talk","♡","Talk"],["wardrobe","✧","Wardrobe"],
 ["events","◇","Events"],["phone","✉","Phone"],["journal","◫","Journal"],["hut","◉","Beach Hut"],["save","▣","Save / Load"]];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const el=(tag,content,attrs="")=>"<"+tag+" "+attrs+">"+content+"</"+tag+">";
const panel=c=>el("section",c,'class="panel"');
const btn=(action,label,attrs="",primary=false)=>
 '<button type="button" class="btn '+(primary?"primary":"")+'" data-action="'+esc(action)+'" '+attrs+'>'+esc(label)+'</button>';
const world=()=>state.world;
const person=id=>world()?.people?.[id];
const name=id=>person(id)?.name||id||"Nobody";
const active=()=>activeContestants(world()).filter(id=>id!==world().playerId);
const currentNpc=()=>{
 if(!active().includes(state.npc))state.npc=active()[0]||null;
 return state.npc;
};
const portrait=(id,cssClass="")=>{
 const index=id==="player"?11:STARTING_ROSTER.findIndex(p=>p.id===id);
 if(index<0)return '<div class="portrait '+cssClass+'" role="img" aria-label="Artwork for this arrival is not ready" style="background-image:linear-gradient(130deg,#633852,#24122a)"></div>';
 const x=(index%6)*20,y=index<6?0:100;
 return '<div class="portrait '+cssClass+'" style="background-position:'+x+'% '+y+'%" role="img" aria-label="Concept portrait artwork for '+esc(name(id))+'"></div>';
};
const scene=(i)=>'<div class="scene-image" style="background-position:'+i*20+'% 0" aria-hidden="true"></div>';
function persist(){
 if(!world())return;
 try{saveSlot(localStorage,SAVE,world(),{title:"Visual Season One"});}
 catch(error){state.feedback="Saving was unavailable: "+error.message;}
}
function navigate(tab){
 state.tab=tab;
 state.dialogue=null;
 render();window.scrollTo({top:0,behavior:"instant"});
}
function chrome(content){
 const w=world(),p=w?.people[w.playerId];
 const nav='<aside class="sidebar"><div class="logo">Villa <span>♡</span><br>After Dark</div>'+
   '<div class="tagline">Season One</div><nav class="menu" aria-label="Game navigation">'+
   navItems.map(([id,sym,label])=>'<button data-action="nav" data-tab="'+id+
     '" class="'+(state.tab===id?"active":"")+'" '+(!w&&id!=="home"?'disabled':'')+
     '><span class="symbol" aria-hidden="true">'+sym+'</span>'+label+'</button>').join("")+
   '</nav><div class="sidebar-footer">Early visual preview · All gameplay free</div></aside>';
 const chips=w?'<div class="top-chips"><span class="pill">Day <b>'+w.day+'</b> / 90</span>'+
   '<span class="pill">♡ <b>'+esc(name(partnerOf(w,w.playerId))==="Nobody"?"Single":name(partnerOf(w,w.playerId)))+'</b></span>'+
   '<span class="pill">'+activeContestants(w).length+' in the villa</span></div>':
   '<div class="pill">12 islanders · 90 days</div>';
 const header='<header class="top"><div><div class="eyebrow">Romance · Rivalry · Secrets</div>'+
   '<strong style="font-size:1.03rem">Villa After Dark</strong></div>'+chips+'</header>';
 return '<div class="backdrop" aria-hidden="true"></div><div class="frame">'+nav+
  '<div class="main">'+header+(state.feedback?'<div class="notice" role="status">'+esc(state.feedback)+'</div>':"")+
  content+'<footer>Visual development build · Character portraits are concept artwork, not a finished live dress-up model · No purchases or AI fees</footer></div></div>';
}
function createCharacter(){
 const traits=["loyal","romantic","ambitious","jealous","outgoing","shy","honest","secretive",
  "flirtatious","cautious","impulsive","empathetic","competitive","independent","forgiving"];
 const form=panel('<div class="eyebrow">Your story starts here</div><h2>Create your islander</h2>'+
   '<p class="muted">You control who you are. Eleven original islanders are ready to meet you.</p>'+
   '<form id="create-form"><div class="two">'+
   '<div class="input"><label for="name">Your name</label><input id="name" name="name" maxlength="40" required placeholder="Your character name"></div>'+
   '<div class="input"><label for="age">Age (21–35)</label><input id="age" name="age" type="number" min="21" max="35" required value="25"></div>'+
   '<div class="input"><label for="gender">Gender</label><select id="gender" name="gender"><option value="woman">Woman</option><option value="man">Man</option><option value="nonbinary">Nonbinary</option></select></div>'+
   '<div class="input"><label for="hometown">Hometown</label><input id="hometown" name="hometown" maxlength="80" placeholder="Where are you from?" required></div>'+
   '<div class="input"><label for="occupation">Occupation</label><input id="occupation" name="occupation" maxlength="80" placeholder="What do you do?" required></div>'+
   '</div><div class="input"><label for="backstory">Your story (optional)</label>'+
   '<textarea id="backstory" maxlength="2000" name="backstory" placeholder="What brought you to the villa?"></textarea></div>'+
   '<div class="input"><label>Choose exactly five traits</label><div class="checks">'+traits.map((t,i)=>
     '<label><input type="checkbox" name="trait" value="'+t+'" '+(i<5?"checked":"")+'> '+esc(t)+'</label>').join("")+'</div></div>'+
   '<div class="input"><label>Who could catch your eye?</label><div class="checks">'+
    ["man","woman","nonbinary"].map(x=>'<label><input type="checkbox" name="attractedTo" value="'+x+'" '+(x==="man"?"checked":"")+'> '+x+'</label>').join("")+
   '</div></div><p class="small muted">The starting cast has six men and five women. With a woman player, that makes six of each.</p>'+
   '<button class="btn primary" type="submit">Enter the villa ♡</button></form>');
 const preview=panel('<div class="eyebrow">Your look, your rules</div><h2>Step into the spotlight</h2>'+portrait("player","intro-portrait")+
   '<p class="small muted">Style reference only. This portrait is not your customized character. We are still building changeable, photorealistic character artwork.</p>'+
   '<div class="stats"><div class="stat"><b>12</b><span>Islanders</span></div><div class="stat"><b>90</b><span>Villa days</span></div><div class="stat"><b>100%</b><span>Free</span></div></div>');
 return chrome('<div class="stage"><div><div class="eyebrow">Welcome to Paradise</div>'+
  '<h1>Love looks better after dark.</h1><p>A tropical paradise. Eleven strangers. Ninety days of chemistry, choices and consequences.</p></div></div>'+
  '<div class="sectionhead"><h2>Make your entrance</h2></div><div class="intro-grid">'+form+preview+'</div>');
}
function castCard(id,clickable=true){
 const p=person(id),r=relationshipBetween(world(),world().playerId,id);
 return '<button class="islander" data-action="'+(clickable?"select-npc":"noop")+'" data-npc="'+esc(id)+'" '+(clickable?"":"disabled")+'>'+
  portrait(id)+'<div class="bio"><span class="heart">♡</span><strong>'+esc(p.name)+'</strong><div class="sub">'+
  esc(p.age)+' · '+esc(p.occupation||"Islander")+'</div>'+
  '<div class="sub">Affection '+r.affection+(p.eliminated?" · Left villa":"")+'</div></div></button>';
}
function locationTile(p){
 return '<button class="tile" data-action="location" data-place="'+esc(p.id)+'">'+
  scene(p.image)+'<div class="titlebar">'+esc(p.name)+'</div></button>';
}
function miniStats(){
 const w=world(),p=w.people[w.playerId];
 return panel('<div class="eyebrow">Your season</div><h3>'+esc(p.name)+'</h3>'+
   '<div class="stats"><div class="stat"><b>'+w.day+'</b><span>Day</span></div>'+
   '<div class="stat"><b>'+activeContestants(w).length+'</b><span>In villa</span></div>'+
   '<div class="stat"><b>'+w.storyLog.length+'</b><span>Story choices</span></div></div>'+
   '<div class="fancy-line"></div><div class="textline"><span class="muted">Coupled with</span><b>'+
   esc(name(partnerOf(w,w.playerId)))+'</b></div>'+
   '<div class="textline"><span class="muted">Private messages</span><b>'+inboxFor(w,w.playerId).length+'</b></div>'+
   '<div class="textline"><span class="muted">Your story memories</span><b>'+playerJournal(w).length+'</b></div>');
}
function home(){
 const w=world(),islanders=active();
 const ceremony=(w.day===1 || (w.day%14===0&&w.day<90))?
   'A pairing decision is coming up. Who will catch your eye?':'The villa never stays quiet for long.';
 return chrome('<div class="stage"><div class="corner"><span class="pill">♡ Season One</span></div>'+
   '<div><div class="eyebrow">Day '+w.day+' · '+(w.day<10?"First impressions":"The story continues")+'</div>'+
   '<h1>Your summer. Your rules.</h1><p>'+esc(ceremony)+'</p><div class="actions">'+
   btn("nav","Explore Villa",'data-tab="explore"',true)+
   btn("nav","Meet Islanders",'data-tab="cast"')+btn("nav","Today's Events",'data-tab="events"')+
   '</div></div></div>'+
   '<div class="layout-2" style="margin-top:18px"><div class="stack">'+
   '<div><div class="sectionhead"><h2>The Islanders</h2>'+btn("nav","View all",'data-tab="cast"')+'</div>'+
   '<div class="cast-grid">'+islanders.slice(0,12).map(id=>castCard(id)).join("")+'</div></div>'+
   '<div><div class="sectionhead"><h2>Explore the Villa</h2></div>'+
   '<div class="grid">'+places.slice(0,4).map(locationTile).join("")+'</div></div></div>'+
   '<div class="stack">'+miniStats()+
   panel('<div class="eyebrow">Tonight in the villa</div><h3>'+esc(dailyAgenda(w).events.at(-1)?.title||"Time to mingle")+'</h3>'+
   '<p class="muted">Choose your connections, explore rooms and move the season forward when you are ready.</p>'+
   btn("nav","View schedule",'data-tab="events"',true))+
   panel('<div class="eyebrow">Love or drama?</div><h3>Someone might surprise you.</h3>'+
   '<p class="muted">Islanders have lives of their own. You only discover secrets when someone actually tells you.</p>'+
   btn("nav","Start a conversation",'data-tab="talk"'))+
   '</div></div>');
}
function cast(){
 const ids=Object.keys(world().people).filter(id=>id!==world().playerId);
 const men=ids.filter(id=>person(id).gender==="man");
 const women=ids.filter(id=>person(id).gender==="woman");
 const other=ids.filter(id=>!["woman","man"].includes(person(id).gender));
 const group=(label,items)=>'<div class="sectionhead"><h2>'+label+'</h2><span class="small muted">'+items.length+' contestants</span></div>'+
  '<div class="cast-grid">'+items.map(id=>castCard(id,!person(id).eliminated)).join("")+'</div>';
 return chrome('<div class="stage"><div><div class="eyebrow">The starting lineup</div>'+
  '<h1>Meet the islanders.</h1><p>Each has their own history, private secrets, attraction and personality.</p></div></div>'+
  group("The Men",men)+group("The Women",women)+(other.length?group("New Faces",other):""));
}
function explore(){
 const w=world();
 const selected=places.find(p=>p.id===state.place)||places[0];
 const where=contestantLocations(w);
 const people=active().filter(id=>where[id]===selected.id);
 return chrome('<div class="stage"><div><div class="eyebrow">Take a walk</div><h1>Explore Paradise.</h1>'+
  '<p>Choose a location, then see who is around. The islanders move between spaces every day.</p></div></div>'+
  '<div class="sectionhead"><h2>Find your spot</h2></div><div class="grid">'+places.map(locationTile).join("")+'</div>'+
  '<div class="sectionhead"><h2>At the '+esc(selected.name)+'</h2></div>'+
  panel('<div class="eyebrow">'+esc(selected.note)+'</div><p class="muted">'+
    (people.length?"Someone is here. Choose who to approach.":"Nobody is here right now. Try another part of the villa.")+
    '</p><div class="grid">'+people.map(id=>castCard(id)).join("")+'</div>'));
}
function talk(){
 const w=world(),id=currentNpc();
 if(!id)return chrome(panel('<h2>No active islanders right now.</h2>'));
 const npc=person(id),r=relationshipBetween(w,w.playerId,id);
 const scenes=availableScenes(w,id).slice(0,2);
 const message=state.dialogue?.reply||state.dialogue?.response;
 return chrome('<div class="sectionhead"><h2>Get closer</h2><span class="small muted">Your choices will be remembered</span></div>'+
   '<div class="layout-2"><div class="stack">'+
   panel('<div class="npc-stage">'+portrait(id)+
     '<div><div class="eyebrow">One-on-one</div><h2>'+esc(npc.name)+'</h2>'+
     '<p class="small muted">'+esc(npc.age)+' · '+esc(npc.occupation)+' · '+esc(npc.hometown)+'</p>'+
     '<p>'+esc(npc.motive||"Getting to know you.")+'</p>'+
     '<div class="stats"><div class="stat"><b>'+r.affection+'</b><span>Affection</span></div>'+
     '<div class="stat"><b>'+r.trust+'</b><span>Trust</span></div>'+
     '<div class="stat"><b>'+esc(npc.personality.traits[0])+'</b><span>Vibe</span></div></div></div>'+
     (message?'<div class="speech" style="margin-top:16px">'+esc(message)+'</div>':"")+
     '<div class="fancy-line"></div><form id="talk-form"><div class="input">'+
     '<label for="talk-text">Say anything</label><textarea id="talk-text" name="message" required maxlength="2000" placeholder="Tell '+esc(npc.name)+' what is on your mind..."></textarea>'+
     '</div><button class="btn primary" type="submit">Say it</button></form>'+
     '<p class="small muted">Free typing uses a simple rule-based interpreter. The story choices below recognize more detailed decisions.</p>')+
   panel('<div class="eyebrow">Story moments</div>'+
     (scenes.length?scenes.map(s=>'<div class="feature"><h3>'+esc(s.title)+'</h3>'+
       '<div class="speech">'+esc(s.opening)+'</div><div class="choices">'+
       s.choices.map(o=>btn("choice",o.label,'data-scene="'+esc(s.id)+'" data-choice="'+esc(o.id)+'"')).join("")+
       '</div></div>').join(""):'<p class="muted">No new story scene with this islander today. Try again after a day advances.</p>'))+
   '</div><div class="stack">'+
   panel('<div class="eyebrow">Who do you want to talk to?</div><div class="input"><label for="npc-switch">Choose an islander</label>'+
     '<select id="npc-switch">'+active().map(x=>'<option value="'+esc(x)+'" '+(x===id?"selected":"")+'>'+esc(name(x))+'</option>').join("")+
     '</select></div>')+
   miniStats()+'</div></div>');
}
function events(){
 const w=world(),plan=dailyAgenda(w),challenge=challengeForDay(w.day);
 const ceremony=(w.day===1||w.day%14===0&&w.day<90)&&!w.ceremonies?.some(x=>x.day===w.day);
 const eligible=active().filter(id=>mutuallyAttracted(w,w.playerId,id));
 const matchup=ceremony?panel('<div class="eyebrow">Your romantic decision</div><h3>'+(
  w.day===1?"First pairing":"Recoupling Ceremony")+'</h3>'+
  '<div class="input"><label for="pair">Who will you choose?</label><select id="pair">'+
  '<option value="keep" '+(state.pairing===undefined?"selected":"")+'>Keep existing partner / stay single</option>'+
  '<option value="single" '+(state.pairing===null?"selected":"")+'>Stay single</option>'+
  eligible.map(id=>'<option value="'+esc(id)+'" '+(state.pairing===id?"selected":"")+'>'+esc(name(id))+'</option>').join("")+'</select></div>'+
  (w.day===1?btn("first-pair","Make first pairing","",true):'<p class="muted">This ceremony will happen when you finish the day.</p>')):"";
 const challengeControl=challenge?panel('<div class="eyebrow">Villa Challenge</div><h3>'+esc(challenge.title)+'</h3>'+
  '<p>'+esc(challenge.intro)+'</p><div class="input"><label for="challenge">Choose your approach</label>'+
  '<select id="challenge"><option value="skip" '+(state.strategy===null?"selected":"")+'>Sit this one out</option>'+
  challenge.strategies.map(x=>'<option value="'+esc(x.id)+'" '+(state.strategy===x.id?"selected":"")+'>'+esc(x.label)+'</option>').join("")+
  '</select></div>'):"";
 return chrome('<div class="sectionhead"><h2>Day '+w.day+' · Villa Schedule</h2></div>'+
  '<div class="layout-2"><div class="stack">'+
  panel('<div class="eyebrow">What is happening today?</div>'+
    plan.events.map(e=>'<div class="textline"><div><strong>'+esc(e.title)+'</strong>'+
      '<div class="small muted">'+esc(e.location.replaceAll("_"," "))+'</div></div>'+
      '<span class="pill">'+esc(e.time)+'</span></div>').join(""))+
  matchup+challengeControl+
  panel('<h3>Continue your story</h3>'+
    '<p class="muted">Advance only when you are ready. Other islanders will make their own decisions; yours will never be chosen for you.</p>'+
    (w.simulatedDays.includes(90)?'<p>The season is complete.</p>':btn("advance","Finish Day "+w.day,"",true)))+
  '</div><div class="stack">'+miniStats()+
   (state.lastReport?panel('<h3>Last night</h3><p class="muted">Day '+state.lastReport.day+
     ' · '+state.lastReport.interactions.length+' islander encounters'+
     (state.lastReport.arrival?" · A new arrival":"")+
     (state.lastReport.elimination?" · An elimination":"")+
     (state.lastReport.ceremony?" · Recoupling":"")+
     (state.lastReport.challenge?" · Challenge results":"")+'</p>'):"")+
   (w.simulatedDays.includes(90)?panel('<h3>Season Finale</h3>'+
    (w.finale?'<p class="speech">Your ending: '+esc(w.finale.ending.replaceAll("_"," "))+'</p>':
    btn("finale","Reveal the ending","",true))):"")+
  '</div></div>');
}
function wardrobe(){
 const w=world(),p=w.people[w.playerId],look=p.appearance;
 const keys=["skinTone","hairTexture","hairColor","hairLength","bodyType","makeup","tattoo","piercing"];
 return chrome('<div class="sectionhead"><h2>Character Studio & Wardrobe</h2></div>'+
  '<div class="layout-2"><div class="stack">'+
    panel('<div class="eyebrow">Your appearance</div><h3>Make it yours.</h3>'+
      '<p class="small muted">Your selections are saved to your character. Live photorealistic feature and clothing rendering is still being built; the concept portrait does not change yet.</p>'+
      '<div class="two">'+keys.map(k=>'<div class="input"><label for="feat-'+k+'">'+esc(k.replace(/([A-Z])/g," $1"))+'</label>'+
         '<select id="feat-'+k+'" data-feature="'+k+'">'+APPEARANCE_OPTIONS[k].map(v=>'<option value="'+esc(v)+'" '+(v===look.features[k]?"selected":"")+'>'+esc(v.replaceAll("-"," "))+'</option>').join("")+'</select></div>').join("")+'</div>')+
    panel('<div class="eyebrow">Dress for tonight</div><h3>Wardrobe</h3>'+
      '<div class="two">'+["dress","top","bottom","shoes","swimwear","accessory"].map(cat=>
        '<div class="input"><label for="outfit-'+cat+'">'+esc(cat)+'</label><select id="outfit-'+cat+'" data-outfit="'+cat+'">'+
        '<option value="">Choose a piece</option>'+
        GARMENTS.filter(g=>g.category===cat).map(g=>'<option value="'+esc(g.id)+'" '+(look.outfit[cat]===g.id?"selected":"")+'>'+esc(g.name)+'</option>').join("")+
        '</select></div>').join("")+'</div>'+
      '<p class="small muted">All 60 pieces are free. Their illustrated versions are not finished.</p>')+
    panel('<div class="eyebrow">My saved looks</div><div class="input"><label for="look-title">Look name</label>'+
     '<input id="look-title" maxlength="60" placeholder="e.g. Poolside Glow"></div>'+btn("save-look","Save this look","",true)+
     '<div class="look-list" style="margin-top:12px">'+look.savedLooks.map(x=>
        btn("restore-look",x.title,'data-look="'+esc(x.id)+'"')).join("")+'</div>')+
  '</div><div class="stack">'+panel('<h3>'+esc(p.name)+' ♡</h3>'+portrait("player","intro-portrait")+
    '<p class="small muted">Glam art reference only — not your saved appearance.</p>')+
    miniStats()+'</div></div>');
}
function phone(){
 const w=world(),messages=inboxFor(w,w.playerId).slice(-32).reverse();
 return chrome('<div class="sectionhead"><h2>Villa Phone</h2></div>'+
  '<div class="layout-2"><div class="stack">'+panel('<div class="eyebrow">Private messages</div>'+
  (messages.length?messages.map(m=>'<div class="message '+(m.from===w.playerId?"out":"in")+'">'+
   '<div class="small muted">Day '+m.day+' · '+esc(name(m.from))+'</div><p>'+esc(m.text)+'</p></div>').join("")+
   '<p class="muted">No messages yet. Islanders will reach out during the season.</p>')+
  '</div><div class="stack">'+panel('<h3>Write a message</h3><form id="phone-form">'+
  '<div class="input"><label for="recipient">To</label><select id="recipient" name="recipient">'+
   active().map(id=>'<option value="'+esc(id)+'">'+esc(name(id))+'</option>').join("")+'</select></div>'+
   '<div class="input"><label for="message">Your message</label>'+
   '<textarea id="message" name="message" maxlength="600" required></textarea></div>'+
   '<button class="btn primary" type="submit">Send message</button></form></div>')+'</div></div>');
}
function journal(){
 const w=world(),memories=playerJournal(w),conf=playerConfessionals(w);
 return chrome('<div class="sectionhead"><h2>Your Villa Journal</h2></div>'+
  '<div class="layout-2"><div class="stack">'+panel('<div class="eyebrow">Memories you know</div>'+
   '<p class="small muted">Private encounters between other islanders stay hidden until you learn about them.</p>'+
   (memories.length?memories.map(m=>'<div class="textline"><span>Day '+m.day+' · '+esc(name(m.actor))+' & '+esc(name(m.target))+'</span>'+
     '<strong>'+esc(m.type)+'</strong></div>').join(""):'<p class="muted">Make connections to begin your story.</p>'))+
   '</div><div class="stack">'+panel('<div class="eyebrow">Personal reflections</div><h3>'+
    conf.length+' Beach Hut confessional'+(conf.length===1?"":"s")+'</h3>'+
    '<p class="muted">Write your thoughts in the Beach Hut.</p>'+btn("nav","Go to Beach Hut",'data-tab="hut"'))+
   miniStats()+'</div></div>');
}
function beachHut(){
 const w=world(),prompts=availableConfessionals(w),past=playerConfessionals(w).slice().reverse();
 return chrome('<div class="stage"><div><div class="eyebrow">The private camera room</div>'+
  '<h1>Beach Hut Confessionals</h1><p>Say what you really feel. Your thoughts stay private unless you choose to air them.</p></div></div>'+
  '<div class="layout-2" style="margin-top:18px"><div class="stack">'+panel('<h3>Tell your side of the story</h3>'+
  (prompts.length?'<form id="confessional-form"><div class="input"><label for="prompt">Question</label>'+
   '<select id="prompt" name="promptId">'+prompts.map(p=>
   '<option value="'+esc(p.id)+'">'+esc(p.prompt)+'</option>').join("")+'</select></div>'+
   '<div class="input"><label for="confession">Your answer</label><textarea id="confession" name="text" required maxlength="2000"></textarea></div>'+
   '<button class="btn primary" type="submit">Record privately</button></form>':
   '<p class="muted">New questions unlock later in the season.</p>'))+
  '</div><div class="stack">'+panel('<h3>Previous recordings</h3>'+
   (past.length?past.map(c=>'<div class="feature"><strong>Day '+c.day+'</strong><p>'+esc(c.text)+'</p>'+
    (c.aired?'<span class="small muted">Aired to the fictional audience</span>':
     btn("air","Air this confessional",'data-id="'+esc(c.id)+'"'))+'</div>').join(""):
   '<p class="muted">No recordings yet.</p>'))+'</div></div>');
}
function saves(){
 const w=world();
 return chrome('<div class="sectionhead"><h2>Save & Continue</h2></div>'+
  '<div class="layout-2"><div class="stack">'+panel('<div class="eyebrow">Your story is yours</div><h3>Automatic local saves</h3>'+
    '<p class="muted">Progress is saved in this browser when you make decisions. No account or payments required.</p>'+
    btn("save","Save progress now","",true)+' '+btn("reset","Start a fresh season"))+
   '</div><div class="stack">'+miniStats()+'</div></div>');
}
function render(){
 let body;
 try{
  if(!world())body=createCharacter();
  else{
   const pages={home,cast,explore,talk,wardrobe,events,phone,journal,hut,save:saves};
   body=(pages[state.tab]||home)();
  }
 }catch(e){
  body=chrome(panel('<h2>Something needs attention.</h2><p>'+esc(e.message)+'</p>'+
      btn("nav","Back to Villa",'data-tab="home"')));
 }
 root.innerHTML=body;
}
function create(form){
 const d=new FormData(form);
 const traits=d.getAll("trait");
 if(traits.length!==5)throw Error("Choose exactly five personality traits.");
 const attractedTo=d.getAll("attractedTo");
 if(!attractedTo.length)throw Error("Select at least one attraction preference.");
 const profile=createPlayerProfile({
  name:String(d.get("name")||""),age:Number(d.get("age")),gender:String(d.get("gender")||"woman"),
  hometown:String(d.get("hometown")||""),occupation:String(d.get("occupation")||""),
  backstory:String(d.get("backstory")||""),traits,attractedTo,
  appearance:createAppearance()
 });
 state.world=startSeason(profile,createSeasonOneCast());
 state.tab="home";state.npc="npc-01";state.dialogue=null;
 state.feedback="Welcome to the villa, "+profile.name+". Your story has begun.";
 persist();render();
}
root.addEventListener("submit",e=>{
 e.preventDefault();
 try{
  if(e.target.id==="create-form"){create(e.target);return;}
  if(!world())return;
  if(e.target.id==="talk-form"){
   const text=String(new FormData(e.target).get("message")||"");
   const id=currentNpc();
   state.dialogue=say(world(),{speakerId:world().playerId,listenerId:id,text,
    eventId:"talk-"+world().day+"-"+(world().events.length+1)+"-"+id});
   state.feedback=state.dialogue.understood?"Conversation remembered.":"You said it, but the simple text interpreter did not recognize a gameplay action.";
  }
  if(e.target.id==="phone-form"){
   const d=new FormData(e.target),to=String(d.get("recipient")||"");
   if(!active().includes(to))throw Error("Choose an active islander.");
   sendMessage(world(),{from:world().playerId,to,text:String(d.get("message")||"")});
   state.feedback="Private message sent.";
  }
  if(e.target.id==="confessional-form"){
   const d=new FormData(e.target);
   recordConfessional(world(),{promptId:String(d.get("promptId")||""),
    text:String(d.get("text")||"")});
   state.feedback="Confessional saved privately.";
  }
  persist();render();
 }catch(err){state.feedback=err.message;render();}
});
root.addEventListener("change",e=>{
 const t=e.target;
 try{
  if(t.id==="npc-switch"){state.npc=t.value;state.dialogue=null;render();return;}
  if(t.id==="pair"){state.pairing=t.value==="keep"?undefined:t.value==="single"?null:t.value;return;}
  if(t.id==="challenge"){state.strategy=t.value==="skip"?null:t.value;return;}
  if(t.dataset.feature){
   updatePlayerAppearance(world(),changeFeature(person(world().playerId).appearance,t.dataset.feature,t.value));
   persist();render();
  }
  if(t.dataset.outfit && t.value){
   updatePlayerAppearance(world(),equip(person(world().playerId).appearance,t.value));
   persist();render();
  }
 }catch(err){state.feedback=err.message;render();}
});
root.addEventListener("click",e=>{
 const target=e.target.closest("[data-action]");
 if(!target)return;
 const action=target.dataset.action;
 try{
  if(action==="nav"){state.feedback="";navigate(target.dataset.tab);return;}
  if(!world())return;
  const w=world();
  if(action==="select-npc"){
   if(!active().includes(target.dataset.npc))throw Error("Islander is no longer in the villa.");
   state.npc=target.dataset.npc;state.dialogue=null;state.feedback="";navigate("talk");return;
  }
  if(action==="location"){state.place=target.dataset.place;state.feedback="";navigate("explore");return;}
  if(action==="choice"){
   state.dialogue=chooseStoryOption(w,{targetId:currentNpc(),
    sceneId:target.dataset.scene,choiceId:target.dataset.choice});
   state.feedback="That choice is now part of your story.";
  }
  if(action==="first-pair"){
   runRecoupling(w,state.pairing===undefined?{}:{playerChoice:state.pairing});
   state.pairing=undefined;state.feedback="Your first pairing is recorded.";
  }
  if(action==="advance"){
   if(w.simulatedDays.includes(90))throw Error("The season is already finished.");
   state.lastReport=completeDay(w,{playerChoice:state.pairing,challengeApproach:state.strategy});
   state.pairing=undefined;state.strategy=null;
   state.feedback="Day "+state.lastReport.day+" finished. Welcome to the next chapter.";
  }
  if(action==="save"){state.feedback="Progress saved.";persist();}
  if(action==="reset"){
   if(!window.confirm("Start a completely fresh season? This replaces the current visual save."))return;
   try{deleteSlot(localStorage,SAVE);}catch{}
   state.world=null;state.tab="home";state.feedback="";state.lastReport=null;state.dialogue=null;
   render();return;
  }
  if(action==="save-look"){
   const title=document.getElementById("look-title")?.value||"";
   updatePlayerAppearance(w,saveLook(person(w.playerId).appearance,title));
   state.feedback="Look saved.";
  }
  if(action==="restore-look"){
   const look=person(w.playerId).appearance.savedLooks.find(l=>l.id===target.dataset.look);
   if(!look)throw Error("Saved outfit not found");
   updatePlayerAppearance(w,{
    ...person(w.playerId).appearance,features:{...look.features},outfit:{...look.outfit}
   });
   state.feedback="Saved look restored.";
  }
  if(action==="air"){airConfessional(w,target.dataset.id);state.feedback="Recording aired to the fictional audience.";}
  if(action==="finale"){resolveFinale(w);state.feedback="The finale outcome has been recorded.";}
  persist();render();
 }catch(err){state.feedback=err.message;render();}
});
try{
 const saved=loadSlot(localStorage,SAVE);
 if(saved?.world){state.world=saved.world;state.feedback="Welcome back. Your visual-season save was restored.";}
}catch(e){state.feedback="Previous save could not be loaded: "+e.message;}
render();
