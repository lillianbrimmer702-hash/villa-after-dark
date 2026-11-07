import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
test("firepit ceremony uses the actual game and original villa art",()=>{
 const js=readFileSync(resolve(root,"play/app.js"),"utf8");
 const html=readFileSync(resolve(root,"play/index.html"),"utf8");
 const css=readFileSync(resolve(root,"play/ceremony.css"),"utf8");
 assert.match(html,/ceremony\.css/);
 assert.match(css,/\.ceremony-scene/);
 assert.match(css,/scene-sprite\.webp/);
 assert.match(css,/\.ceremony-person/);
 assert.match(js,/function ceremony\(\)/);
 assert.match(js,/data-action="ceremony-pick"/);
 assert.match(js,/runRecoupling\(w,state\.pairing===undefined/);
});
test("first recoupling is a player-controlled commitment and saves all publicly observed couples",async()=>{
 const handlers={},storage=new Map();
 const node={innerHTML:"",addEventListener:(k,callback)=>handlers[k]=callback};
 globalThis.document={getElementById:id=>id==="app"?node:null};
 globalThis.window={scrollTo(){},confirm(){return true}};
 globalThis.localStorage={
  getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),
  removeItem:k=>storage.delete(k)
 };
 globalThis.FormData=class{
  constructor(form){this.data=form.data}
  get(k){return this.data[k]}
  getAll(k){return this.data[k]||[]}
 };
 await import("../play/app.js");
 handlers.submit({preventDefault(){},target:{id:"create-form",data:{
  name:"Belle",age:"25",gender:"woman",hometown:"Miami",occupation:"Photographer",
  backstory:"I am ready for this",
  trait:["romantic","honest","empathetic","loyal","outgoing"],
  attractedTo:["man"]
 }}});
 const click=(action,args={})=>handlers.click({target:{
  closest:()=>({dataset:{action,...args}})
 }});
 const snapshot=()=>JSON.parse(storage.get("villa-after-dark:save:visual-season-one")).world;
 click("nav",{tab:"ceremony"});
 assert.match(node.innerHTML,/Your First Coupling/);
 assert.match(node.innerHTML,/Who will you choose/);
 assert.equal(snapshot().ceremonies.length,0);
 const beforeEvents=snapshot().events.length;
 click("ceremony-pick",{npc:"npc-01"});
 assert.match(node.innerHTML,/Luca/);
 assert.equal(snapshot().events.length,beforeEvents);
 click("ceremony-commit");
 assert.match(node.innerHTML,/The couples tonight/);
 assert.equal(snapshot().ceremonies.length,1);
 assert.equal(snapshot().couples.player,"npc-01");
 assert.equal(snapshot().couples["npc-01"],"player");
 assert.ok(snapshot().events.length>beforeEvents);
 click("nav",{tab:"home"});
 assert.match(node.innerHTML,/Day 1/);
 click("nav",{tab:"ceremony"});
 assert.match(node.innerHTML,/The couples tonight/);
 assert.equal(snapshot().ceremonies.length,1);
});
