import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"..");

test("cinematic opening uses real local photographic scene assets and is interactive",()=>{
 const html=readFileSync(resolve(root,"play/index.html"),"utf8");
 const css=readFileSync(resolve(root,"play/arrival.css"),"utf8");
 const app=readFileSync(resolve(root,"play/app.js"),"utf8");
 assert.match(html,/arrival\.css/);
 assert.match(css,/villa-pool\.webp/);
 assert.match(css,/\.arrival-hero/);
 assert.match(css,/\.arrival-split-portraits/);
 assert.match(app,/continueEntrance\(w\)/);
 assert.match(app,/chooseFirstImpression\(w/);
 assert.match(app,/finishEntrance\(w\)/);
});
test("opening-night introduction remembers one player-chosen connection and reloads correctly",async()=>{
 const storage=new Map(),events={},app={innerHTML:"",addEventListener:(name,fn)=>events[name]=fn};
 globalThis.document={getElementById:id=>id==="app"?app:null};
 globalThis.window={scrollTo(){},confirm(){return true}};
 globalThis.localStorage={
  getItem:k=>storage.get(k)??null,
  setItem:(k,v)=>storage.set(k,v),
  removeItem:k=>storage.delete(k)
 };
 globalThis.FormData=class{
  constructor(form){this.values=form.data;}
  get(k){return this.values[k];}
  getAll(k){return this.values[k]||[];}
 };
 await import("../play/app.js");
 events.submit({preventDefault(){},target:{id:"create-form",data:{
  name:"Nova",age:"24",gender:"woman",hometown:"Denver",
  occupation:"Photographer",backstory:"Ready for adventure",
  trait:["loyal","romantic","ambitious","honest","empathetic"],
  attractedTo:["man"]
 }}});
 const click=(action,details={})=>events.click({
  target:{closest:()=>({dataset:{action,...details}})}
 });
 assert.match(app.innerHTML,/Play your first night/);
 click("nav",{tab:"arrival"});
 assert.match(app.innerHTML,/Eleven strangers/);
 click("arrival-continue");
 assert.match(app.innerHTML,/Someone catches your eye/);
 assert.match(app.innerHTML,/Luca/);
 click("arrival-select",{npc:"npc-04"});
 assert.match(app.innerHTML,/Andre/);
 click("arrival-choice",{choice:"friendly"});
 assert.match(app.innerHTML,/Andre smiles back/);
 assert.match(app.innerHTML,/Nova/);
 const saveKey="villa-after-dark:save:visual-season-one";
 let world=JSON.parse(storage.get(saveKey)).world;
 assert.equal(world.entrance.phase,"reaction");
 assert.equal(world.entrance.targetId,"npc-04");
 assert.equal(world.events.filter(e=>e.source==="player-entrance").length,1);
 assert.equal(world.events.at(-1).type,"kindness");
 click("arrival-finish");
 assert.match(app.innerHTML,/room-scene/);
 world=JSON.parse(storage.get(saveKey)).world;
 assert.equal(world.entrance.completed,true);
 click("nav",{tab:"home"});
 assert.doesNotMatch(app.innerHTML,/Play your first night/);
});
