import {startSeason} from "../src/season.js";
import {createSeasonOneCast} from "../src/season-one-cast.js";
export function createPhotoWorld(){
 return startSeason({id:"player",name:"Test Player",gender:"woman"},createSeasonOneCast());
}
