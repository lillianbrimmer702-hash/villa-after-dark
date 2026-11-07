import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
test("character creation has three real CSS-controlled steps and no preset traits",()=>{
 const html=readFileSync(resolve(root,"play/index.html"),"utf8");
 const css=readFileSync(resolve(root,"play/creator.css"),"utf8");
 const js=readFileSync(resolve(root,"play/app.js"),"utf8");
 assert.match(html,/creator\.css/);
 for(const n of [1,2,3]){
  assert.ok(css.includes('.creator-form[data-step="'+n+'"]'),"Missing style for creator step "+n);
  assert.match(js,new RegExp('creator-step" data-step="'+n+'"'));
 }
 assert.match(js,/id="creator-note"/);
 assert.match(js,/creator-next/);
 assert.match(js,/creator-prev/);
 assert.match(js,/aria-live="polite"/);
 assert.doesNotMatch(js,/<input[^>]*name="trait"[^>]*checked/);
});
test("next/back keeps selections and disallows missing traits",async()=>{
 const events={},rootNode={innerHTML:"",addEventListener:(type,fn)=>events[type]=fn};
 let traitCount=0,attractionCount=1;
 const note={textContent:""};
 const dots=[1,2,3].map(n=>({dataset:{stepLabel:String(n)},
  classList:{toggle(){}}}));
 const form={dataset:{step:"1"},querySelector:q=>q==="#creator-note"?note:null,
  querySelectorAll:q=>{
   if(q.includes(".creator-step[data-step='1']"))return [
    {checkValidity:()=>true,reportValidity(){}}
   ];
   if(q.includes('name="trait"'))return Array.from({length:traitCount},()=>({}));
   if(q.includes('name="attractedTo"'))return Array.from({length:attractionCount},()=>({}));
   return [];
  }
 };
 globalThis.document={
  getElementById:id=>id==="app"?rootNode:id==="create-form"?form:null,
  querySelectorAll:q=>q===".creator-dot"?dots:[]
 };
 globalThis.window={scrollTo(){},confirm(){return true}};
 const store=new Map();
 globalThis.localStorage={
  getItem:key=>store.get(key)??null,setItem:(key,v)=>store.set(key,v),
  removeItem:key=>store.delete(key)
 };
 await import("../play/app.js");
 assert.match(rootNode.innerHTML,/Choose my personality/);
 const click=action=>events.click({target:{closest:()=>({dataset:{action}})}});
 click("creator-next");
 assert.equal(form.dataset.step,"2");
 click("creator-next");
 assert.equal(form.dataset.step,"2");
 assert.match(note.textContent,/exactly five traits/);
 traitCount=5;
 click("creator-next");
 assert.equal(form.dataset.step,"3");
 click("creator-prev");
 assert.equal(form.dataset.step,"2");
 assert.equal(traitCount,5);
 attractionCount=0;
 click("creator-next");
 assert.equal(form.dataset.step,"2");
 assert.match(note.textContent,/attraction preference/);
});
