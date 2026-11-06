/**
 * Villa After Dark — contestant personalities and autonomous decisions.
 * Pure deterministic scoring: same world + same context => same ranking.
 * NPCs cannot use events they have not personally learned.
 */
import { memoriesOf, relationshipBetween } from "./relationship-engine.js";
import { knownJealousyEvidence, partnerOf } from "./coupling.js";

export const TRAITS = Object.freeze([
  "loyal", "romantic", "ambitious", "jealous", "outgoing", "shy",
  "honest", "secretive", "flirtatious", "cautious", "impulsive",
  "empathetic", "competitive", "independent", "forgiving"
]);
const T = new Set(TRAITS);
const ACTIONS = Object.freeze(["flirt", "bond", "confront", "apologize", "keep_distance"]);
const modifiers = {
  flirt: { romantic: 3, flirtatious: 5, outgoing: 2, shy: -3, cautious: -3, loyal: -2 },
  bond: { loyal: 4, empathetic: 4, romantic: 2, honest: 2, secretive: -2 },
  confront: { jealous: 5, impulsive: 3, competitive: 2, forgiving: -3, shy: -2 },
  apologize: { empathetic: 4, forgiving: 3, honest: 2, ambitious: -1 },
  keep_distance: { cautious: 4, independent: 3, shy: 2, impulsive: -2 }
};
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const recent = (events, type, days, day) => events.filter(e => e.type === type && day-e.day <= days).length;

/** Enforces exactly five distinct traits, coherent dealbreakers, and basic identity. */
export function createPersonality({ traits, interests=[], dealbreakers=[], goals=[] }) {
  assert(Array.isArray(traits) && traits.length === 5 && new Set(traits).size === 5, "Exactly five unique traits required");
  assert(traits.every(t => T.has(t)), "Unknown trait");
  for (const [name, items] of Object.entries({interests, dealbreakers, goals})) {
    assert(Array.isArray(items) && items.every(x => typeof x === "string" && x.trim()), "Invalid "+name);
  }
  return {traits:[...traits],interests:[...interests],dealbreakers:[...dealbreakers],goals:[...goals]};
}
/**
 * Score a social action from the perspective of actor toward target.
 * Relationship values are global history; only known memories can trigger
 * knowledge-dependent reactions such as jealousy or confronting a betrayal.
 */
export function scoreAction(world, actorId, targetId, action) {
  assert(ACTIONS.includes(action), "Unknown action");
  assert(world.people[actorId] && world.people[targetId] && actorId !== targetId, "Invalid contestants");
  const actor = world.people[actorId];
  const traits = actor.personality?.traits || [];
  const known = memoriesOf(world, actorId, targetId);
  const relationship = relationshipBetween(world, actorId, targetId);
  const affection = clamp(relationship.affection, -100, 100);
  const trust = clamp(relationship.trust, -100, 100);
  const knownBetrayals = recent(known, "betrayal", 14, world.day);
  const knownArguments = recent(known, "argument", 7, world.day);
  const knownKisses = recent(known, "kiss", 7, world.day);
  const jealousy = partnerOf(world, actorId) === targetId ? knownJealousyEvidence(world, actorId).length : 0;
  let score = 10;
  for (const trait of traits) score += modifiers[action][trait] || 0;
  switch(action) {
    case "flirt": score += affection/12 + knownKisses*3 - knownBetrayals*6 - jealousy*6; break;
    case "bond": score += trust/15 + affection/25 - knownBetrayals*4 - jealousy*5; break;
    case "confront": score += knownBetrayals*10 + knownArguments*4 - trust/30 + jealousy*(traits.includes("jealous")?16:9); break;
    case "apologize": score += knownArguments*5 + (trust < 0 ? 2 : 0); break;
    case "keep_distance": score += -affection/15 + knownBetrayals*5 + jealousy*5; break;
  }
  return Math.round(score*100)/100;
}
export function rankActions(world, actorId, targetId) {
  return ACTIONS.map(action => ({action,score:scoreAction(world,actorId,targetId,action)}))
    .sort((a,b)=>b.score-a.score || ACTIONS.indexOf(a.action)-ACTIONS.indexOf(b.action));
}
/** Stable choice for a given world state; caller schedules decisions by time/location. */
export function chooseAction(world, actorId, targetId) {
  return rankActions(world,actorId,targetId)[0];
}
/** Evaluates personal dealbreakers only against facts the actor actually knows. */
export function knownDealbreakers(world, actorId, targetId) {
  const dealbreakers = world.people[actorId]?.personality?.dealbreakers || [];
  const known = memoriesOf(world, actorId, targetId);
  return dealbreakers.filter(d => known.some(e => e.type === d));
}
