/**
 * Villa After Dark — consent-aware recoupling and jealousy.
 * A ceremony is public; hidden dates/kisses remain private until revealed.
 * No automatic romantic decision may be made on the player's behalf.
 */
import { recordEvent, relationshipBetween, memoriesOf } from "./relationship-engine.js";

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const eligible = (p) => p && p.eliminated !== true;
const activeIds = world => Object.keys(world.people).filter(id => eligible(world.people[id])).sort();

export function ensureCouplingState(world) {
  if (!world.couples) world.couples = {};
  if (!Array.isArray(world.ceremonies)) world.ceremonies = [];
  return world;
}

/** Explicit attractedTo arrays take precedence. Old profiles without
 * attraction settings remain eligible; the player can choose preferences
 * in the character creator instead of having them guessed.
 */
export function mutuallyAttracted(world, a, b) {
  const first = world.people[a], second = world.people[b];
  if (!eligible(first) || !eligible(second) || a === b) return false;
  const likes = (p, other) => {
    if (Array.isArray(p.attractedTo)) return p.attractedTo.includes(other.gender);
    if (p.orientation === "straight" && (p.gender === "man" || p.gender === "woman"))
      return (p.gender === "man" && other.gender === "woman") ||
             (p.gender === "woman" && other.gender === "man");
    if (p.orientation === "gay" && (p.gender === "man" || p.gender === "woman"))
      return p.gender === other.gender;
    return true;
  };
  return likes(first, second) && likes(second, first);
}

export function partnerOf(world, personId) {
  assert(world.people[personId], "Unknown contestant");
  return world.couples?.[personId] ?? null;
}

/** This score only uses interpersonal history and memories available to
 * the contestant. It is deterministic, not a prediction of human behavior.
 */
function desire(world, a, b) {
  const r = relationshipBetween(world, a, b);
  const own = world.people[a], other = world.people[b];
  const interestsA = own.personality?.interests || [];
  const interestsB = other.personality?.interests || [];
  const shared = interestsA.filter(x => interestsB.includes(x)).length;
  const knownBetrayals = memoriesOf(world, a, b).filter(e => e.type === "betrayal").length;
  const loyal = own.personality?.traits?.includes("loyal") ? 8 : 0;
  return r.affection * .6 + r.trust * .4 + shared * 3 +
    (partnerOf(world, a) === b ? loyal + 6 : 0) - knownBetrayals * 12;
}
export function pairScore(world, a, b) {
  if (!mutuallyAttracted(world, a, b)) return -Infinity;
  return Math.round((desire(world, a, b) + desire(world, b, a)) * 100) / 100;
}

/** Preview pairings without changing world. undefined playerChoice means
 * retain the player's current partner when possible; null means choose single.
 */
export function previewRecoupling(world, { playerChoice } = {}) {
  ensureCouplingState(world);
  const ids = activeIds(world);
  const player = world.playerId;
  assert(player && ids.includes(player), "Valid active player required");
  const reserved = new Set();
  const pairs = [];
  let desired = playerChoice === undefined ? partnerOf(world, player) : playerChoice;
  if (desired !== null && desired !== undefined) {
    assert(typeof desired === "string" && ids.includes(desired) && desired !== player,
      "Invalid player partner");
    assert(mutuallyAttracted(world, player, desired), "Incompatible player choice");
    reserved.add(player); reserved.add(desired);
    pairs.push([player, desired]);
  } else reserved.add(player);

  const options = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j];
    if (reserved.has(a) || reserved.has(b) || a === player || b === player) continue;
    const score = pairScore(world, a, b);
    if (Number.isFinite(score)) options.push({a,b,score});
  }
  options.sort((x,y) => y.score - x.score ||
    x.a.localeCompare(y.a) || x.b.localeCompare(y.b));
  for (const choice of options) {
    if (reserved.has(choice.a) || reserved.has(choice.b)) continue;
    pairs.push([choice.a, choice.b]);
    reserved.add(choice.a); reserved.add(choice.b);
  }
  const singles = ids.filter(id => !pairs.some(pair => pair.includes(id)));
  return { day: world.day, pairs, singles, complete: pairs.length * 2 + singles.length === ids.length };
}

/** Day 1 or every 14 days. Ceremonies are recorded once and witnessed by
 * all active contestants. An explicit playerChoice is never inferred.
 */
export function runRecoupling(world, options = {}) {
  ensureCouplingState(world);
  assert(world.day === 1 || (world.day % 14 === 0 && world.day < 90),
    "No recoupling scheduled today");
  assert(!world.ceremonies.some(c => c.day === world.day), "Ceremony already held");
  const result = previewRecoupling(world, options);
  assert(result.complete, "Invalid pairing result");
  const ids = activeIds(world);
  const next = Object.fromEntries(ids.map(id => [id, null]));
  for (const [a,b] of result.pairs) { next[a] = b; next[b] = a; }
  // Commit public ceremony events only after all validations succeeded.
  for (const [a,b] of result.pairs) {
    recordEvent(world, {
      id: `recouple-${world.day}-${[a,b].sort().join("-")}`,
      day: world.day, type:"recoupling", actor:a, target:b,
      witnesses:ids, source:"public-ceremony"
    });
  }
  world.couples = next;
  world.ceremonies.push(result);
  return result;
}

/** Only discovered kisses/dates with someone other than one's partner
 * can trigger jealousy. No omniscient knowledge of secrets.
 */
export function knownJealousyEvidence(world, personId, days=14) {
  const partner = partnerOf(world, personId);
  if (!partner) return [];
  return memoriesOf(world, personId, partner).filter(e =>
    ["kiss","date"].includes(e.type) &&
    e.day >= world.day - days &&
    [e.actor,e.target].includes(partner) &&
    !([e.actor,e.target].includes(personId))
  );
}
