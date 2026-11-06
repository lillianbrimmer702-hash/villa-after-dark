/**
 * Season orchestration, joining scheduling, NPC choices and relationship events.
 *
 * This is deterministic, replay-safe logic. Only NPC/NPC conversations are
 * resolved automatically; the player is never made to flirt or agree to a date.
 * Scheduled ceremonies are announcements, not implemented elimination systems.
 */
import { createWorld, recordEvent, memoriesOf, advanceDay } from "./relationship-engine.js";
import { dailyAgenda, contestantLocations } from "./villa-schedule.js";
import { chooseAction } from "./contestant-ai.js";
import { ensureCouplingState, previewRecoupling, runRecoupling } from "./coupling.js";
import { generateAppearance, validateAppearance } from "./character-style.js";
import { gossipAfterInteractions } from "./gossip.js";
import { generateCast } from "./cast-generator.js";
import { autoTextPlayer } from "./phone.js";
import {
  BOMBSHELL_DAYS, ELIMINATION_DAYS, introduceBombshell,
  suggestedElimination, eliminateContestant
} from "./cast-management.js";

const ACTION_EVENTS = Object.freeze({
  bond: "kindness",
  confront: "argument",
  apologize: "apology"
});
const assert = (ok, message) => { if (!ok) throw new Error(message); };

export function startSeason(player, contestants) {
  assert(player && typeof player.id === "string", "Player needs an id");
  assert(Array.isArray(contestants) && contestants.length === 11, "Season needs exactly 11 starting NPCs");
  assert(!contestants.some(p => p.id === player.id), "Player cannot also be an NPC");
  const normalize = (person, isPlayer) => {
    const appearance = person.appearance || generateAppearance("cast|" + person.id);
    validateAppearance(appearance);
    return { ...person, appearance, isPlayer };
  };
  const world = createWorld([normalize(player, true), ...contestants.map(p => normalize(p, false))], 90);
  world.playerId = player.id;
  world.socialLog = [];
  world.simulatedDays = [];
  world.gossipLog = [];
  world.storyLog = [];
  world.messages = [];
  world.confessionals = [];
  world.arrivals = [];
  world.eliminations = [];
  ensureCouplingState(world);
  return world;
}

function validateSeason(world) {
  assert(world && typeof world.playerId === "string" && world.people[world.playerId]?.isPlayer,
    "World is not an initialized season");
  assert(Array.isArray(world.socialLog) && Array.isArray(world.simulatedDays),
    "Missing season tracking data");
}

/**
 * Safely run social interactions for the current day exactly once.
 * Each NPC meets at most one other NPC per day, in a deterministic location.
 * Flirting and distancing are recorded as uncommitted social interactions;
 * they do not invent kisses or consent.
 */
export function simulateCurrentDay(world) {
  validateSeason(world);
  assert(!world.simulatedDays.includes(world.day), "This day was already simulated");
  const locations = contestantLocations(world);
  const ids = Object.keys(world.people).filter(id => id !== world.playerId && !world.people[id].eliminated).sort();
  const used = new Set();
  const interactions = [];

  for (const actor of ids) {
    if (used.has(actor)) continue;
    const target = ids.find(id => id !== actor && !used.has(id) && locations[id] === locations[actor]);
    if (!target) continue;
    used.add(actor);
    used.add(target);
    const decision = chooseAction(world, actor, target);
    const id = `npc-${world.day}-${actor}-${target}`;
    const eventType = ACTION_EVENTS[decision.action] ?? null;
    if (eventType) {
      recordEvent(world, {
        id, day: world.day, type: eventType, actor, target,
        witnesses: [], source: "autonomous-social"
      });
    }
    const entry = {
      id, day: world.day, location: locations[actor], actor, target,
      action: decision.action, score: decision.score, eventId: eventType ? id : null,
      public: false
    };
    world.socialLog.push(entry);
    interactions.push(entry);
  }

  const gossip = gossipAfterInteractions(world, interactions);
  world.simulatedDays.push(world.day);
  return {
    day: world.day,
    agenda: dailyAgenda(world),
    locations,
    interactions,
    gossip
  };
}

/** Returns a day report and advances once. Day 90 is the last playable day. */
export function completeDay(world, { playerChoice } = {}) {
  validateSeason(world);
  const hasCeremony = world.day % 14 === 0 && world.day < world.seasonLength;
  // Reject an invalid explicit choice before simulating anything.
  if (hasCeremony && !world.ceremonies?.some(c => c.day === world.day))
    previewRecoupling(world, { playerChoice });
  const report = simulateCurrentDay(world);
  const ceremony = hasCeremony && !world.ceremonies?.some(c => c.day === world.day)
    ? runRecoupling(world, { playerChoice })
    : null;
  let arrival = null;
  if (BOMBSHELL_DAYS.includes(world.day)) {
    // Pick a fresh fictional name without duplicating an earlier contestant.
    const names = new Set(Object.values(world.people).map(person => person.name));
    let nextPerson = null;
    for (let variant=0;variant<30;variant++) {
      const candidate=generateCast("bombshell|" + world.day + "|" + variant,1)[0];
      if (!names.has(candidate.name)) { nextPerson=candidate; break; }
    }
    assert(nextPerson, "No unique bombshell name available");
    arrival=introduceBombshell(world, {
      ...nextPerson, id:"bombshell-" + world.day,
      appearance:generateAppearance("bombshell|" + world.day)
    });
  }
  let elimination = null;
  if (ELIMINATION_DAYS.includes(world.day)) {
    const candidate = suggestedElimination(world);
    if (candidate) elimination=eliminateContestant(world,candidate);
  }
  const newText = autoTextPlayer(world);
  if (world.day < world.seasonLength) advanceDay(world);
  return { ...report, ceremony, arrival, elimination, newText, nextDay: world.day,
    seasonComplete: report.day === world.seasonLength };
}

/** What a contestant knows about the current season (not omniscient). */
export function contestantView(world, contestantId) {
  validateSeason(world);
  assert(world.people[contestantId], "Unknown contestant");
  return {
    day: world.day,
    name: world.people[contestantId].name ?? contestantId,
    memories: memoriesOf(world, contestantId),
    interactions: world.socialLog.filter(e => e.actor === contestantId || e.target === contestantId)
  };
}
