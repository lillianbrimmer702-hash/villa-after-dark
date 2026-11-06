import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"..");
test("visual app compiles, uses local assets and routes from home",()=>{
 execFileSync(process.execPath,["--check",resolve(root,"play/app.js")],{stdio:"pipe"});
 const html=readFileSync(resolve(root,"play/index.html"),"utf8");
 const entry=readFileSync(resolve(root,"index.html"),"utf8");
 const js=readFileSync(resolve(root,"play/app.js"),"utf8");
 const css=readFileSync(resolve(root,"play/styles.css"),"utf8");
 assert.match(entry,/url=\.\/play\//);
 assert.match(html,/type="module"/);
 assert.match(js,/createSeasonOneCast/);
 assert.match(js,/completeDay\(w/);
 assert.match(js,/chooseStoryOption\(w/);
 assert.match(css,/cast-sprite\.webp/);
 assert.match(css,/scene-sprite\.webp/);
 assert.match(css,/villa-pool\.webp/);
 assert.doesNotMatch(js,/api[_-]?key|stripe|openai\.com/i);
});
test("real optimized photo sprite assets are committed",()=>{
 for(const name of ["cast-sprite.webp","scene-sprite.webp","villa-pool.webp"]){
  const path=resolve(root,"play/assets",name);
  assert.ok(statSync(path).size>4000);
  const data=readFileSync(path);
  assert.equal(data.subarray(0,4).toString(),"RIFF");
  assert.equal(data.subarray(8,12).toString(),"WEBP");
 }
});
test("player can create a named visual season and open a contestant",async()=>{
 const callbacks={},store=new Map();
 const app={innerHTML:"",addEventListener:(type,fn)=>callbacks[type]=fn};
 globalThis.document={getElementById:id=>id==="app"?app:null};
 globalThis.window={scrollTo(){},confirm(){return true}};
 globalThis.localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)
 };
 globalThis.FormData=class{
  constructor(form){this.data=form.data;}
  get(k){return this.data[k];}
  getAll(k){return this.data[k]||[];}
 };
 await import("../play/app.js");
 assert.match(app.innerHTML,/Create your islander/);
 callbacks.submit({preventDefault(){},target:{id:"create-form",data:{
  name:"Nova",age:"25",gender:"woman",hometown:"Seattle",
  occupation:"Astronaut",backstory:"My own story",
  trait:["loyal","romantic","honest","empathetic","ambitious"],
  attractedTo:["man"]
 }}});
 assert.match(app.innerHTML,/Nova/);
 assert.match(app.innerHTML,/Luca/);
 assert.match(app.innerHTML,/Sienna/);
 assert.ok(store.has("villa-after-dark:save:visual-season-one"));
 callbacks.click({target:{closest:()=>({dataset:{action:"select-npc",npc:"npc-01"}})}});
 assert.match(app.innerHTML,/One-on-one/);
 assert.match(app.innerHTML,/Luca/);
 const click=(action,extra={})=>callbacks.click({target:{closest:()=>({dataset:{action,...extra}})}});
 click("nav",{tab:"cast"});
 assert.match(app.innerHTML,/The Women/);
 assert.match(app.innerHTML,/Sienna/);
 click("nav",{tab:"explore"});
 assert.match(app.innerHTML,/Find your spot/);
 click("nav",{tab:"events"});
 assert.match(app.innerHTML,/Villa Schedule/);
 callbacks.change({target:{id:"pair",value:"npc-01",dataset:{}}});
 click("first-pair");
 assert.match(app.innerHTML,/Luca/);
 click("advance");
 assert.match(app.innerHTML,/Day 2/);
 click("nav",{tab:"wardrobe"});
 assert.match(app.innerHTML,/Character Studio/);
 callbacks.change({target:{id:"feat-hairColor",value:"copper",dataset:{feature:"hairColor"}}});
 const envelope=JSON.parse(store.get("villa-after-dark:save:visual-season-one"));
 assert.equal(envelope.world.people.player.appearance.features.hairColor,"copper");
 click("nav",{tab:"phone"});
 assert.match(app.innerHTML,/Write a message/);
 click("nav",{tab:"journal"});
 assert.match(app.innerHTML,/Villa Journal/);
 click("nav",{tab:"hut"});
 assert.match(app.innerHTML,/Beach Hut Confessionals/);
});
