/**
 * Villa After Dark — deterministic relationship and memory engine.
 * Browser-friendly ES module. No API, dependency or paid service required.
 * Each event has an immutable id. Private events are only known by witnesses.
 */
export const SAVE_VERSION = 1;
const clamp = (n, lo=-100, hi=100) => Math.max(lo, Math.min(hi, n));
const EFFECTS = Object.freeze({
  kiss: { affection: 12, trust: 2 },
  date: { affection: 8, trust: 4 },
  kindness: { affection: 4, trust: 5 },
  promise: { affection: 2, trust: 4 },
  argument: { affection: -9, trust: -8 },
  betrayal: { affection: -18, trust: -25 },
  apology: { affection: 3, trust: 7 },
  confession: { affection: 3, trust: 8 },
  recoupling: { affection: 4, trust: 0 }
});
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clean = value => JSON.parse(JSON.stringify(value));
const key = (a,b) => [a,b].sort().join("::");

export function createWorld(people, seasonLength=90) {
  assert(Array.isArray(people) && people.length >= 2, "At least two contestants required");
  const ids = people.map(p => p.id);
  assert(ids.every(x => typeof x === "string" && x.length > 0), "Every person needs an id");
  assert(new Set(ids).size === ids.length, "Contestant ids must be unique");
  return {
    version: SAVE_VERSION, day: 1, seasonLength,
    people: Object.fromEntries(people.map(p => [p.id, clean(p)])),
    relationships: {}, events: [], knowledge: Object.fromEntries(ids.map(id => [id, []]))
  };
}
function validateEvent(world, event) {
  assert(world && world.version === SAVE_VERSION, "Unsupported save version");
  assert(event && typeof event.id === "string" && event.id.length > 0, "Event needs id");
  assert(!world.events.some(e => e.id === event.id), "Duplicate event id");
  assert(EFFECTS[event.type], "Unknown event type");
  assert(world.people[event.actor] && world.people[event.target], "Unknown contestant");
  assert(event.actor !== event.target, "Event requires two different contestants");
  assert(Number.isInteger(event.day) && event.day >= 1 && event.day <= world.seasonLength, "Invalid event day");
  assert(event.day <= world.day, "Cannot record an event from the future");
  assert(Array.isArray(event.witnesses), "Event requires a witness list");
  assert(event.witnesses.every(id => world.people[id]), "Unknown witness");
}
export function recordEvent(world, event) {
  validateEvent(world, event);
  const e = clean({ ...event, witnesses: [...new Set([event.actor, event.target, ...event.witnesses])] });
  world.events.push(e);
  for (const id of e.witnesses) world.knowledge[id].push(e.id);
  const pair = key(e.actor,e.target);
  const r = world.relationships[pair] ||= { affection: 0, trust: 0, history: [] };
  const effect = EFFECTS[e.type];
  r.affection = clamp(r.affection + effect.affection);
  r.trust = clamp(r.trust + effect.trust);
  r.history.push(e.id);
  return e;
}
export function revealEvent(world, eventId, toPersonId) {
  assert(world.people[toPersonId], "Unknown recipient");
  assert(world.events.some(e => e.id === eventId), "Unknown event");
  const known = world.knowledge[toPersonId];
  if (!known.includes(eventId)) known.push(eventId);
}
export function memoriesOf(world, personId, otherId=null) {
  assert(world.people[personId], "Unknown person");
  if (otherId !== null) assert(world.people[otherId], "Unknown other person");
  const known = new Set(world.knowledge[personId]);
  return world.events.filter(e => known.has(e.id) &&
    (otherId === null || e.actor === otherId || e.target === otherId));
}
export function relationshipBetween(world, a, b) {
  assert(world.people[a] && world.people[b], "Unknown person");
  return clean(world.relationships[key(a,b)] || { affection: 0, trust: 0, history: [] });
}
export function advanceDay(world) {
  assert(world.day < world.seasonLength, "Season already finished");
  world.day += 1;
  return world.day;
}
export function serializeWorld(world) { return JSON.stringify(world); }
export function loadWorld(json) {
  const world = JSON.parse(json);
  assert(world.version === SAVE_VERSION, "Unsupported save version");
  assert(world.people && world.relationships && Array.isArray(world.events) && world.knowledge, "Invalid save");
  assert(Number.isInteger(world.day) && world.day >= 1 && world.day <= world.seasonLength, "Invalid day");
  return world;
}
