/**
 * Release readiness gate. This intentionally does not pass while Villa After
 * Dark is incomplete. Use npm run release:check, separate from npm test.
 */
import {existsSync,readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {REALISM_STYLE_ID,GARMENTS} from "../src/character-style.js";
import {STORY_SCENES} from "../src/story-engine.js";

export function inspectRelease(root){
 const missing=[];
 const at=path=>resolve(root,path);
 const mustExist=(path,label=path)=>{
  if(!existsSync(at(path)))missing.push("Missing "+label+": "+path);
 };
 mustExist("index.html","production game entry page");
 if(existsSync(at("index.html"))){
  const entry=readFileSync(at("index.html"),"utf8");
  // A public internal preview is NOT equivalent to the finished game.
  if(/Development Preview|Development preview|dev\/|not finished/i.test(entry))
    missing.push("The production game entry page is still only a development preview");
 }
 mustExist("assets/manifest.json","illustrated asset manifest");
 mustExist("assets/LICENSES.md","original or licensed art register");
 mustExist("QA_SIGNOFF.json","QA release approval");
 // Scripted story count is a minimum, not an overall quality guarantee.
 if(STORY_SCENES.length<45)missing.push("More authored story variety required: "+STORY_SCENES.length+"/45 minimum scenes");
 if(GARMENTS.some(g=>g.artKey===null))
  missing.push("All 60 wardrobe items still need illustrated asset assignments");

 if(existsSync(at("assets/manifest.json"))){
  try{
   const manifest=JSON.parse(readFileSync(at("assets/manifest.json"),"utf8"));
   if(manifest.styleId!==REALISM_STYLE_ID)missing.push("Art manifest uses the wrong visual style");
   const chars=Object.values(manifest.characters||{});
   if(chars.length<19)missing.push("Realistic character art required for 19 season participants (including arrivals)");
   for(const [id,entry] of Object.entries(manifest.characters||{})){
    if(entry.styleId!==REALISM_STYLE_ID||!entry.portrait||!entry.fullBody)
      missing.push("Incomplete equal-quality realistic art for "+id);
    for(const path of [entry.portrait,entry.fullBody].filter(Boolean))
      if(!existsSync(at(path)))missing.push("Missing asset file "+path);
   }
  }catch(error){missing.push("Invalid art manifest: "+error.message);}
 }
 if(existsSync(at("QA_SIGNOFF.json"))){
  try{
   const qa=JSON.parse(readFileSync(at("QA_SIGNOFF.json"),"utf8"));
   for(const check of ["fullSeasonReviewed","artParityReviewed",
     "wardrobeVisualsVerified","lowPowerEdgeTested","ownerApproved"]){
     if(qa[check]!==true)missing.push("Release QA not signed off: "+check);
   }
  }catch(error){missing.push("Invalid release QA file: "+error.message);}
 }
 return missing;
}
const current=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===current){
 const root=resolve(dirname(current),"..");
 const issues=inspectRelease(root);
 if(issues.length){
   console.error("Villa After Dark is NOT ready for release:");
   for(const issue of issues)console.error(" - "+issue);
   process.exitCode=1;
 }else{
   console.log("Automated release prerequisites are present. Manual final review still required.");
 }
}
