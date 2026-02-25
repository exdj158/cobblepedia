# AGENTS.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

If you are confused about project rules or references, check the minimal docs in `_agentdocs/`:

- `_agentdocs/data-sources.md` - Canonical upstream sources, required paths, and local development reference repositories, including model/image/sprite sourcing rules.
- `_agentdocs/tech-stack-guidelines.md` - Focused stack/code guidance for Tailwind setup, styling rules, and icon workflow.

## Known gotchas

- Not all Cobblemon "interactable drops" are declared in `data/cobblemon/pokemon_interactions/*.json`.
- Shearing interactions for `sheared` species are implemented in upstream code (`PokemonEntity.shear`) and can be missed if you only parse interaction JSON files.
- Slowpoke shearing (`tasty_tail`) is driven by `species_feature_assignments/slowpoke_tail_regrowth.json` + `mechanics/slowpoke_tails.json`.
