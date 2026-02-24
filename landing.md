# Cobblepedia Landing Page Redesign

## Design Philosophy

Transform from "minimal tech doc" to "living encyclopedia entrance." Keep the keyboard-first DNA but add warmth, motion, and discovery.

---

## Section 1: Hero — "The Living Gateway"

### Layout
Full-width immersive header with centered content. Subtle animated accents flank the sides — floating type icons, pokemon silhouettes, or data particles that drift slowly. Content remains vertically centered and focused, with the live search demo positioned below the headline and CTAs.

### Content

```
[Animated Logo/Wordmark — Cobblepedia]

# The fastest
# Cobblemon wiki.

Built for speed. Vim-inspired.
Keyboard-first, zero friction, instant answers.
Spawns, moves, evolutions, egg groups, plus Smogon/Pikalytics movesets — everything's here.

[Primary CTA: Open Search — ⌘K]
[Secondary CTA: Browse All Pokémon →]
```

### Visual Hook
**Live Search Demo** (centered below CTAs):
- Animated typing: `lucario` → results appear → ` moves` → facet activates
- Shows actual search interface in motion with Pokémon sprites in results
- Sprite preview appears for selected Pokémon (Lucario sprite visible)
- Subtle glow/pulse on the search bar
- Micro-animations on result cards appearing

### Side Accents
Floating decorations on left and right edges (desktop only):
- Left side: Floating type icons (Fire, Water, Grass, Electric) drifting upward
- Right side: Pokémon sprites slowly floating (Lucario, Charizard, Garchomp, Gyarados)
- Both fade to transparent near center to keep focus on content
- Very subtle parallax on scroll
- Respects `prefers-reduced-motion`

---

## Section 2: "Three Ways In" — Feature Triptych

Instead of 4 boxes, use 3 larger, more visual cards with icons and concrete examples.

### Layout
3-column grid with hover lift effects.

### Cards

**0. Built for Speed — Vim Style**
```
[Icon: Keyboard or Command Line]

hjkl to navigate. gg to top. G to bottom.
For vim nerds who hate reaching for the mouse.

Every page responds to your muscle memory.
Speed is a feature, not an afterthought.

Shortcuts: ⌘K / Ctrl+K | Esc | ↑↓ | Enter
```

**1. Search by Pokémon**
```
[Sprite strip: Charizard, Lucario, Metagross, Garchomp]

Know the name?
We've got everything.

Moves, spawns, evolutions, egg groups,
base stats, abilities. Plus Smogon/Pikalytics
moveset suggestions for team building.

Example: "charizard" → instant overview
Try: lucario | gyarados | metagross
```

**2. Search by Move**
```
[Sprite cluster showing diverse learners: Pikachu, Alakazam, Gengar, Dragonite]

Looking for a specific move?
Find every learner instantly.

Who learns Surf? Who gets Trick Room?
One query, complete answers.

Example: "moves trickroom" → all learners
Try: surf | earthquake | swordsdance
```

**3. Search by Mechanic**
```
[Sprite strip: Magikarp → Gyarados (evolution demo)]

Need spawn data? Evolution chains?
Breeding groups? We surface it all.

Natural language facets that just work.

Example: "gyarados spawn" → where to find
Try: [pokemon] egg | [pokemon] evolve
```

---

## Section 3: "See It Work" — Interactive Playground

### Concept
An embedded, interactive mini-version of the palette. Not a screenshot — a working demo.

### Layout
Centered "window" with terminal aesthetic but polished.

### Content

```
[Window chrome with traffic lights]

Try these searches (click or type):
┌─────────────────────────────────────┐
│  [Search bar with placeholder]      │
└─────────────────────────────────────┘

Quick jumps:
[ lucario moves ] [ garchomp spawn ] [ moves earthquake ]
[ pikachu evolve ] [ tyranitar egg ] [ charizard ]

[Dynamic results area — updates as user clicks/types]
[Results show: Sprite + Name + Type icons + Quick stats]
```

### Behavior
- Clicking a quick jump populates the search
- Shows mock results that look like the real app
- Demonstrates the instant feedback loop

---

## Section 4: "The Data Difference" — Trust & Transparency

### Layout
Split section: left side stats/metrics, right side visual timeline or data flow diagram.

### Left Side — Live Stats
```
Powered by official sources

Data Pipeline:
Cobblemon GitLab → Nightly Sync → Your Screen

[Current Stats — from metadata]
🎮 Playable Species: 147
📍 Spawn Entries: 2,341
⚡ Total Moves: 845
🥚 Egg Groups Mapped: 15
🏆 Smogon & Pikalytics movesets
📊 Last Updated: Feb 24, 2026

[View Data Sources →] [See Changelog →]
```

### Sprite Showcase
Horizontal scrolling strip or grid of Pokémon sprites representing variety:
- **Starters**: Bulbasaur, Charmander, Squirtle, Chikorita, Cyndaquil, Totodile
- **Fan Favorites**: Pikachu, Lucario, Garchomp, Metagross, Tyranitar, Gyarados
- **Cobblemon Exclusives**: Regional forms and special variants

Sprites animate slightly on hover (scale 1.1, subtle bounce). Click navigates to that Pokémon's page.

### Right Side — Visual
Simple animated diagram showing:
```
[GitLab Icon] → [Sync Arrow] → [Database Icon] → [Lightning Bolt] → [Your Browser]
```
Or: A mini timeline of recent updates/commits

---

## Section 5: "Community & Ecosystem" — Connected

### Layout
Horizontal scrolling or grid of related projects/tools.

### Content
```
Part of the Cobblemon ecosystem

[Cobblemon Logo]      [Cobbledex Logo]      [PokeAPI Logo]
Official Mod          Companion Tool        Sprite Data

[Discord Icon]        [GitHub Icon]         [Wiki Icon]
Community Chat        Open Source           Full Wiki

Not affiliated with The Pokémon Company.
Made by fans, for fans.
```

---

## Section 6: "Start Exploring" — Final CTA

### Layout
Full-width band with gradient or textured background.

### Content
```
# Everything's here.

Spawns, moves, evolutions, egg groups, plus Smogon/Pikalytics movesets — all at your fingertips.
Your next discovery is a keystroke away.

[Big Button: Open Search — ⌘K]
[Small: or press Ctrl+K / Cmd+K anytime]

[Tip: Works on every page. Try it now. ↑]
```

---

## Visual Design Notes

### Color Evolution
- Keep dark mode first, but add subtle gradients
- Accent colors: pull from Cobblemon logo (cyan/blue gradient)
- Add subtle animated backgrounds (slow-moving gradient mesh or particle field)

### Typography
- Keep mono for data/code examples
- Use larger, bolder headings
- Better hierarchy: Hero H1 (72px+) > Section H2 (48px) > Card H3 (24px)

### Motion & Micro-interactions
- Hero: Subtle parallax on scroll
- Cards: Lift + shadow on hover
- Search demo: Typing cursor blink, results cascade in
- Stats: Count-up animation on scroll into view
- Background: Very subtle particle grid or flowing lines

### New Elements to Add
1. **Command Palette Preview** — Not a static image, but a styled div showing the actual interface
2. **Pokemon Sprites Everywhere** — PokeAPI sprites throughout: hero accents, feature cards, data showcase, final CTA
3. **Pokemon Grid Preview** — Interactive grid of sprites that link to their pages
4. **Keyboard Shortcut Badges** — Visual ⌘K, Ctrl+K, Esc keys shown inline
5. **Type Badges** — Show actual type colors/icons from the game
6. **Animated Underlines** — Links that draw their underline on hover

### Content Additions
- Real Pokemon examples throughout (not just lucario)
- "Did you know?" style tips embedded in sections
- Keyboard shortcut reference mini-section
- Browser/extension support indicators
- Mobile responsiveness promise ("Works great on mobile too")

---

## Technical Implementation Notes

### Animations
- Use Framer Motion or GSAP for scroll-triggered animations
- Keep reduced-motion media query respect
- All animations should be 60fps, use transform/opacity only

### Images/Assets
- Use actual Pokemon sprites from PokeAPI for visual interest
- Lazy load below-fold images
- Consider WebP format for better compression

### Performance
- Hero animations should pause when off-screen
- Use will-change sparingly
- Preload critical fonts

---

## ASCII Wireframe

```
+----------------------------------------------------------+
|  [Logo]                                          [⌘K]   |
+----------------------------------------------------------+
|                                                          |
|  [Charizard]                                    [Gyarados]
|  [Lucario]        The fastest Cobblemon wiki.      [Pikachu]
|  [Garchomp]                                          [Gengar]
|                                                          |
|         Built for speed. Vim-inspired.                  |
|    No clicks. No loading. Just answers.                 |
|                                                          |
|                 [Open Search ⌘K]  [Browse All →]        |
|                                                          |
|  [Metagross]                                    [Tyranitar]
|                                                          |
|         ╔════════════════════════════════════════╗      |
|         ║  ┌──────────────────────────────────┐  ║      |
|         ║  │  lucario moves                   │  ║      |
|         ║  └──────────────────────────────────┘  ║      |
|         ║                                      ║      |
|         ║  ┌─ Lucario  Fighting/Steel         │  ║      |
|         ║  ├─ Aura Sphere      Level 1        │  ║      |
|         ║  ├─ Dragon Pulse    Level 1        │  ║      |
|         ║  └─ Flash Cannon        TM         │  ║      |
|         ╚════════════════════════════════════════╝      |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  |
|   │[Charizard]   │  │[Pikachu]     │  │[Magikarp]    │  |
|   │[Lucario]     │  │[Alakazam]    │  │    ↓         │  |
|   │[Garchomp]    │  │[Gengar]      │  │[Gyarados]    │  |
|   │              │  │              │  │              │  |
|   │ By Pokémon   │  │ By Move      │  │ By Mechanic  │  |
|   │ Type a name  │  │ "moves surf" │  │ "evolve"     │  |
|   └──────────────┘  └──────────────┘  └──────────────┘  |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|   Try it live:                                           |
|   ┌─────────────────────────────────────────────────┐   |
|   │  > lucario spawn                                │   |
|   │  └─ Mountains (5% chance, Daytime only)         │   |
|   │  └─ Caves (12% chance, Any time)                │   |
|   └─────────────────────────────────────────────────┘   |
|   [lucario] [moves] [spawn] [evolve] [egg]              |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|   Powered by official sources        Data Pipeline      |
|   ─────────────────────────          ─────────────      |
|   🎮 147 Species          GitLab → Sync → You          |
|   📍 2,341 Spawn Entries                                |
|   ⚡ 845 Moves                                          |
|                                                          |
|   [Sprite showcase: Bulbasaur Charmander Squirtle...]   |
|   [Pikachu Lucario Garchomp Metagross Tyranitar...]     |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|   Everything's here.                                     |
|                                                          |
|    [Pikachu] [Charizard] [Lucario] [Garchomp] [Mewtwo]  |
|                                                          |
|              [      Open Search ⌘K      ]               |
|                                                          |
+----------------------------------------------------------+
|   Cobblepedia · Not affiliated with TPC                |
|   [Discord] [GitHub] [Cobblemon] [Cobbledex]            |
+----------------------------------------------------------+
```

---

## Key Changes Summary

| Current | Proposed |
|---------|----------|
| 4 small feature boxes | 4 feature cards (vim + 3 search methods) |
| Static terminal screenshot | Interactive search playground |
| Simple stats grid | Animated stats + data pipeline visual |
| Minimal footer | Full ecosystem section |
| No imagery | Pokemon sprites, type badges |
| Single CTA | Multiple contextual CTAs |
| Flat design | Subtle depth, gradients, motion |
| Text-heavy | Visual + text balance |

---

## Next Steps

1. **Review** this design direction
2. **Choose** which sections to prioritize
3. **Provide** any brand assets (logo files, color preferences)
4. **Confirm** the interactive demo approach
5. **Build** — I'll implement section by section
