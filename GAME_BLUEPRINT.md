# Villa After Dark — Game blueprint

Status: **In development, not ready to play.** This repository is the single source of truth for the game. No prototype is considered the completed game.

## Product requirements
- 100% free to play; no subscriptions, purchases, or paid AI APIs required.
- Browser-based and usable in Microsoft Edge on a Windows laptop with 4 GB RAM.
- A complete 90-day romance reality-show season with 12 starting adults (player plus 11 contestants), bombshell arrivals, dates, challenges, recouplings, eliminations, a finale and reunion.
- Player can choose a name, gender, romantic attraction, age (21–35), hometown, occupation, up to 2,000 characters of backstory, and five personality traits.
- Attractive, diverse, semi-realistic human character art inspired by Sims custom content and high-end fashion games; **not cartoon emoji or simple geometric avatars**.
- Character studio with meaningful visible variations in hair, face, skin, body, makeup, tattoos, piercings, clothing and accessories. Full-body and face close-up views, outfit presets and saved looks.
- Luxurious villa environments guided by the owner's five supplied reference photos. Shared main bedroom plus two private suites, pool/firepit, outdoor kitchen, spa, dressing room, beach and garden. Locations should form one coherent property.
- Hybrid dialogue: suggested replies **and free text** for dialogue/actions/thoughts. AI generation is optional, not required. A non-AI parser must be honest about what it understands.
- NPCs have individual traits, motives, preferences, relationships, autonomy, and **persistent structured memories**. Memories and consequences must survive save/load.
- Multiple save slots, autosave, player/contestant profiles, relationship histories, messages, journal, public rankings and multiple endings.

## Engineering approach
- Static HTML/CSS/JavaScript client, optimized image assets, no engine installation or build process required.
- Separate data from UI and simulation logic. Persist a versioned save-game schema in IndexedDB or localStorage with migrations.
- Event-driven simulation with an event ledger. Each NPC's knowledge is separate from the global truth: an NPC should not react to a secret they have not learned.
- Test continuity, saves, eligibility, recoupling outcomes and full-season progression before release.
- Avoid copyrighted game assets; use original or properly licensed assets.
- Public repository means source and uploaded art are visible to anyone.

## Development sequence
1. Organize the existing gameplay foundation into modules and add repeatable tests.
2. Implement the versioned player profile, cast profiles and memory/event ledger.
3. Build and approve **coordinated** realistic character art assets, not a static screenshot masquerading as customization.
4. Implement visual character variants, wardrobe layering and saved looks.
5. Build the connected villa location scenes from approved visual references.
6. Deepen dialogue, autonomous relationships, 90-day events and branching outcomes.
7. End-to-end testing, accessibility, performance, save/load and bug fixes.
8. Publish only when the complete-game acceptance criteria are met.

## Definition of done
A player can create and see their customized character, complete an entire 90-day season with consistent contestant memories and relationship consequences, explore the coherent villa, dress up with visible changes, save/reload, and reach a meaningful finale/reunion. No payment or installation required.
