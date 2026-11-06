# Villa After Dark

**Status: active development — not ready to play.** A free, story-driven, 90-day villa dating simulator for a modest Windows laptop and Microsoft Edge. The owner wants a *finished* game, not another unfinished demo.

## Game vision

A glamorous reality-romance simulator with 11 starting NPCs plus the player, unpredictable interpersonal relationships, memorable conversations, dating decisions, challenges, bombshells, recouplings, eliminations, an eventual finale/reunion, and multiple endings. Realistic high-quality digital human art and luxe villa settings will be used for **every contestant**, not only the player.

See [GAME_BLUEPRINT.md](GAME_BLUEPRINT.md) for requirements and [ART_DIRECTION.md](ART_DIRECTION.md) for the strict shared visual standard.

## Current implementation

| Area | Current status |
| --- | --- |
| Relationship events / knowledge | Implemented in JS; each contestant learns only witnessed or explicitly revealed events |
| Free-text conversation | Basic rule-based intent recognition and authored responses; significant writing still needed |
| Five-trait personalities | Implemented personality profiles and deterministic NPC action scoring |
| Gossip / jealousy | Implemented private knowledge propagation and jealousy-driven action scoring |
| Couples / ceremonies | Implemented mutual-attraction pairing, public recoupling and single contestants |
| Full 90-day season | Day progression and scheduled NPC activities, bombshell arrivals, fictional votes and eliminations; still needs story content |
| Cast generation | Seeded profiles for eleven distinct adults; appearance data for the same visual pipeline as the player |
| Character visual art | **Not finished**; visual-profile contract exists but image assets and actual live customization must be built |
| Fashion | 60 free wardrobe item *descriptions and outfit slots*; corresponding illustrations still to be produced |
| Villa scenes / UI | **Not finished**; final visual and navigational integration outstanding |
| Saves | Versioned world serialization and browser save slots |
| Finale / reunion / endings | **Not implemented as interactive outcomes** |
| Automated tests | Node test suite in `tests/`; GitHub Actions runs `npm test` on each commit |

### Run logic tests

No paid services or external packages are required. With Node.js available in a development environment:

```bash
npm test
```

The final player-facing game will run directly in a browser without requiring Node.js or any installation.

## Project structure

- `src/relationship-engine.js` — event ledger, trust/affection, secret knowledge, save version.
- `src/contestant-ai.js` — trait scoring, autonomous NPC intent.
- `src/conversation.js` — basic player text/choice interpretation.
- `src/season.js` — simulation coordinator.
- `src/villa-schedule.js` — daily activities and locations.
- `src/cast-generator.js` — adult contestant profiles and identities.
- `src/coupling.js` — mutual attraction, recouplings, known partner infidelity.
- `src/gossip.js` — controlled disclosure of private information.
- `src/cast-management.js` — bombshell arrivals and eliminations.
- `src/character-style.js` — shared appearance options, wardrobe data and art-manifest validation.
- `src/save-slots.js` — persistence helpers.
- `tests/` — repeatable tests, including complete 90-day progression.

## Rules of development

1. Do not mark a feature *finished* because a mockup or data schema exists. Artwork must actually show the changes it claims to support.
2. The same realistic visual system and quality must apply to player and all male/female/nonbinary contestants.
3. No subscription, microtransactions, paywalled AI API or heavy game-engine install is permitted.
4. Do not publish copyrighted third-party game art or the owner's references without proper rights.
5. Do not release or invite play-testing until the owner is ready for a complete-game build.

This is an ongoing creative software project; code tests passing does **not** prove the overall game is complete.
