import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
test("day-to-day story screen is integrated with the visual build",()=>{
 const js=readFileSync(resolve(root,"play/app.js"),"utf8");
 const css=readFileSync(resolve(root,"play/moments.css"),"utf8");
 const html=readFileSync(resolve(root,"play/index.html"),"utf8");
 assert.match(js,/chooseDailyMoment\(w,target\.dataset\.choice\)/);
 assert.match(js,/dailyMoment\(w\)/);
 assert.match(js,/function moment\(\)/);
 assert.match(html,/moments\.css/);
 assert.match(css,/\.moment-scene/);
 assert.match(css,/\.moment-characters/);
 assert.match(css,/\.moment-actions/);
});
test("day 2 encounter is playable once, remembered, and navigable",async()=>{
 const callbacks={},data=new Map();
 const rootNode={innerHTML:"",addEventListener:(k,v)=>callbacks[k]=v};
 globalThis.document={getElementById:id=>id==="app"?rootNode:null};
 globalThis.window={scrollTo(){},confirm(){return true}};
 globalThis.localStorage={
  getItem:k=>data.get(k)??null,
  setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)
 };
 globalThis.FormData=class{
  constructor(form){this.values=form.data}
  get(k){return this.values[k]}
  getAll(k){return this.values[k]||[]}
 };
 await import("../play/app.js");
 callbacks.submit({preventDefault(){},target:{id:"create-form",data:{
  name:"Amethyst",age:"26",gender:"woman",hometown:"Atlanta",
  occupation:"Designer",backstory:"I want to meet someone who understands me",
  trait:["loyal","romantic","honest","empathetic","outgoing"],attractedTo:["man"]
 }}});
 const click=(action,extras={})=>callbacks.click({target:{
  closest:()=>({dataset:{action,...extras}})
 }});
 click("nav",{tab:"events"});
 click("advance");
 assert.match(rootNode.innerHTML,/Day 2/);
 assert.match(rootNode.innerHTML,/Coffee and Chemistry/);
 assert.match(rootNode.innerHTML,/moment-scene/);
 const key="villa-after-dark:save:visual-season-one";
 const before=JSON.parse(data.get(key)).world;
 assert.equal(before.morningMoments?.length||0,0);
 const count=before.events.length;
 click("moment-choice",{choice:"sit"});
 assert.match(rootNode.innerHTML,/could get used to starting the day/);
 const saved=JSON.parse(data.get(key)).world;
 assert.equal(saved.morningMoments.length,1);
 assert.equal(saved.morningMoments[0].choiceId,"sit");
 assert.equal(saved.events.length,count+1);
 assert.equal(saved.events.at(-1).source,"player-daily-moment");
 click("nav",{tab:"home"});
 assert.doesNotMatch(rootNode.innerHTML,/Play today.s story/);
 click("nav",{tab:"moment"});
 assert.match(rootNode.innerHTML,/You.*decision is saved/);
 click("moment-choice",{choice:"sit"});
 const after=JSON.parse(data.get(key)).world;
 assert.equal(after.morningMoments.length,1);
 assert.equal(after.events.length,count+1);
});
