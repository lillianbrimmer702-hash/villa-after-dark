import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
test("visual scenes use independent backgrounds and actual clickable controls",()=>{
 const css=readFileSync(resolve(root,"play/experience.css"),"utf8");
 const entry=readFileSync(resolve(root,"play/index.html"),"utf8");
 const code=readFileSync(resolve(root,"play/app.js"),"utf8");
 assert.match(entry,/experience\.css/);
 assert.match(css,/\.scene-shell/);
 assert.match(css,/\.room-scene/);
 assert.match(css,/\.home-scene/);
 assert.match(css,/\.dialogue|\.novel-stage/);
 assert.match(code,/data-action="select-npc"/);
 assert.match(code,/data-action="location"/);
 assert.doesNotMatch(entry,/<script[^>]+https?:\/\//);
});
test("character creator checkboxes remain in their own aligned selection cells",()=>{
 const css=readFileSync(resolve(root,"play/styles.css"),"utf8");
 assert.match(css,/\.input \.checks label\{display:flex;align-items:center/);
 assert.match(css,/\.input \.checks input\[type="checkbox"\]/);
 assert.match(css,/width:20px!important;height:20px!important/);
});
test("narrative scene navigation and actual story choices preserve saves",async()=>{
 const callbacks={},storage=new Map();
 const app={innerHTML:"",addEventListener:(name,fn)=>callbacks[name]=fn};
 globalThis.document={getElementById:id=>id==="app"?app:null};
 globalThis.window={scrollTo(){},confirm(){return true}};
 globalThis.localStorage={
  getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),
  removeItem:key=>storage.delete(key)
 };
 globalThis.FormData=class{constructor(form){this.data=form.data}
  get(k){return this.data[k]}
  getAll(k){return this.data[k]||[]}
 };
 await import("../play/app.js");
 const submit=()=>callbacks.submit({preventDefault(){},target:{id:"create-form",data:{
   name:"Starlight",age:"27",gender:"woman",hometown:"Atlanta",occupation:"Dancer",
   backstory:"Here to learn to trust again",
   trait:["loyal","romantic","honest","empathetic","ambitious"],attractedTo:["man"]
 }}});
 const click=(action,values={})=>callbacks.click({target:{
   closest:()=>({dataset:{action,...values}})}});
 submit();
 assert.match(app.innerHTML,/scene-shell home-scene/);
 assert.match(app.innerHTML,/Starlight/);
 assert.match(app.innerHTML,/Who is catching your eye/);
 click("location",{place:"firepit"});
 assert.match(app.innerHTML,/scene-shell room-scene/);
 assert.match(app.innerHTML,/Firepit/);
 click("select-npc",{npc:"npc-01"});
 assert.match(app.innerHTML,/One-on-one/);
 assert.match(app.innerHTML,/Luca/);
 click("choice",{scene:"first-glance",choice:"warm"});
 assert.match(app.innerHTML,/You just made my day a little better/);
 const key="villa-after-dark:save:visual-season-one";
 const saved=JSON.parse(storage.get(key));
 assert.equal(saved.world.storyLog.length,1);
 assert.equal(saved.world.storyLog[0].sceneId,"first-glance");
 assert.equal(saved.world.storyLog[0].targetId,"npc-01");
 click("nav",{tab:"explore"});
 assert.match(app.innerHTML,/Find your spot/);
 click("nav",{tab:"home"});
 assert.match(app.innerHTML,/scene-shell home-scene/);
});
