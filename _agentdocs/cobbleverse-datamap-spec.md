# Cobbleverse Data Map Spec

Status: Draft
Last updated: 2026-02-26
Scope: Data coverage and provenance requirements for Cobbleverse Pokemon support

## 1) Purpose

Define what must be true for Cobblepedia to map Cobbleverse Pokemon data reliably, with source traceability per species.

This spec is intentionally about requirements (what), not implementation steps (how).

## 2) Source Policy (Required)

- Do not use Lumyverse wiki tables as source-of-truth.
- Use upstream code/data repositories as source-of-truth.
- Use Modrinth collection/project pages only for discovery and dependency inventory.
- Every mapped species must be traceable to concrete source files.

### 2.1 Generated data location policy (Required)

- Generated data artifacts must be emitted under `public/data/generated/**`.
- App/runtime code must not import generated data modules from `src/**`.
- Generated artifacts are consumed as static public assets only.

### 2.2 Main source map (Current decision)

- [x] Cobblemon (base canonical source; already wired)
  - Local generation source root: `.tmp-cobblemon/common/src/main/resources/data/cobblemon/**`
  - Current generator default root: `scripts/generate-cobblemon-data.ts` -> `.tmp-cobblemon` (override: `COBBLEMON_REPO_PATH`)
  - Remote code/data repo: `https://gitlab.com/cable-mc/cobblemon`
  - Remote asset tree: `https://gitlab.com/cable-mc/cobblemon-assets/-/tree/master?ref_type=heads`
  - Remote Pokemon asset raw base: `https://gitlab.com/cable-mc/cobblemon-assets/-/raw/master/blockbench/pokemon/{subpath}`
  - Local snapshot SHA: `d1b8094539f2dd23bd98c1a48293fac1f2010c16`

- [ ] ATMxMSD (not yet wired in generator; high coverage impact)
  - Local generation source root candidate: `.tmp-atmxmsd/data/cobblemon/{species,species_additions,spawn_pool_world,spawn_detail_presets}/**/*.json`
  - Local addon asset root: `.tmp-atmxmsd/assets/cobblemon/bedrock/pokemon/{models,animations,posers,resolvers}/**`
  - Remote repo: `https://gitlab.com/lvnatic/allthemons-x-mega-showdown`
  - Remote asset tree: `https://gitlab.com/lvnatic/allthemons-x-mega-showdown/-/tree/main/assets/cobblemon/bedrock/pokemon?ref_type=heads`
  - Remote asset raw base: `https://gitlab.com/lvnatic/allthemons-x-mega-showdown/-/raw/main/assets/cobblemon/bedrock/pokemon/{subpath}`
  - Local snapshot SHA: `a9417b01b805ca4f3331cbae2ad07a7e9107ca10`

- [ ] Mega Showdown (not yet wired in generator; still required for current coverage targets)
  - Local generation source root candidate: `.tmp-mega-showdown/common/src/main/resources/data/cobblemon/{species,species_additions,spawn_pool_world}/**/*.json`
  - Local addon asset root: `.tmp-mega-showdown/common/src/main/resources/assets/cobblemon/bedrock/pokemon/{models,animations,posers,resolvers}/**`
  - Remote repo: `https://github.com/yajatkaul/CobblemonMegaShowdown`
  - Remote asset raw base: `https://raw.githubusercontent.com/yajatkaul/CobblemonMegaShowdown/main/common/src/main/resources/assets/cobblemon/bedrock/pokemon/{subpath}`
  - Local snapshot SHA: `e2b39f15920d46e81f2ddd76ba32f0e58e7a6f6a`

- [ ] GlitchDex (downloaded pack only; no upstream code repo currently tracked)
  - Local source root candidate: `.tmp-glitchdex/data/cobblemon/{species,spawn_pool_world}/**/*.json`
  - Local addon asset root: `.tmp-glitchdex/assets/cobblemon/bedrock/{models,animations,posers,species}/**`
  - Remote distribution project: `https://modrinth.com/datapack/glitchdex-cobblemon`
  - Remote package URL (snapshot): `https://cdn.modrinth.com/data/Gdq5F7ud/versions/eHQG8T0Y/GlitchDex-1.1.zip`
  - Snapshot file SHA1: `af46e52755f7305cd44996818fe62bfbaf55736d`

## 3) Findings Snapshot (Current)

### 3.1 Base Cobblemon snapshot

From `public/data/generated/meta.json`:

- Species total: `1025`
- Implemented in base Cobblemon: `851`
- Base gap: `174`

### 3.2 AllTheMons x Mega Showdown (ATMxMSD) snapshot

Local repo snapshot (`.tmp-atmxmsd`):

- `data/cobblemon/species/**/*.json`: `4`
- `data/cobblemon/species_additions/**/*.json`: `203`
- Unique species targets across species/species_additions: `202`
- Spawn files total: `173`
  - `data/cobblemon/spawn_pool_world`: `66`
  - `data/legendary_spawns_atm/spawn_pool_world`: `82`
  - `data/paradox_spawns_atm/spawn_pool_world`: `17`
  - `data/ultra_beast_spawns_atm/spawn_pool_world`: `8`
- Model/resource breadth:
  - `.geo.json` models: `163`
  - animation json: `158`
  - posers: `159`
  - resolvers: `165`
  - pokemon texture png: `391`

Coverage impact against base gap (`174`), using conservative "implemented flip" signal:

- Base-unimplemented species targeted by ATMxMSD species data: `138`
- Explicit implemented flips by ATMxMSD: `101`
  - includes boolean `true` and string `"true"`
- Remaining after base + ATMxMSD explicit flips: `73`

### 3.3 Cobblemon Mega Showdown (MSD) snapshot

Local repo snapshot (`.tmp-mega-showdown`):

- `common/src/main/resources/data/cobblemon/species/**/*.json`: `24`
- `common/src/main/resources/data/cobblemon/species_additions/**/*.json`: `58`
- `common/src/main/resources/data/cobblemon/spawn_pool_world/**/*.json`: `21`

Coverage impact against base gap (`174`), same conservative signal:

- Explicit implemented flips by MSD: `62`
- Overlap with ATMxMSD flips: `9`
- MSD-only flips: `53`

### 3.4 Combined coverage (base + ATMxMSD + MSD)

- Combined explicit implemented flips: `154`
- Projected implemented total: `1005 / 1025`
- Remaining unresolved: `20`

Unresolved species (`20`):

- `audino`
- `beautifly`
- `cascoon`
- `celesteela`
- `cherubi`
- `diancie`
- `dustox`
- `eternatus`
- `ironboulder`
- `ironhands`
- `ironjugulis`
- `kyurem`
- `palpitoad`
- `pheromosa`
- `seismitoad`
- `silcoon`
- `tinglu`
- `tympole`
- `virizion`
- `wurmple`

### 3.5 Decision check: do we still need Mega Showdown if ATMxMSD exists?

Using the current conservative signal (`implemented === true` or `"true"` on species/species_additions targets that are base-unimplemented):

- Base gap starts at: `174`
- ATMxMSD alone closes: `101` -> `73` remain
- MSD closes: `62`, with overlap `9` vs ATMxMSD
- MSD unique closes: `53`
- ATMxMSD + MSD combined unresolved: `20`

Current conclusion:

- For coverage/provenance parity goals, keep `.tmp-mega-showdown` in the source set.
- ATMxMSD alone is not enough yet for deterministic near-parity coverage accounting.
- If we later prove ATMxMSD contains equivalent implementation evidence for those `53` MSD-only flips, this decision can be revisited.

### 3.6 GlitchDex snapshot

Local pack snapshot (`.tmp-glitchdex`):

- `data/cobblemon/species/**/*.json`: `4`
- `data/cobblemon/species_additions/**/*.json`: `0`
- `data/cobblemon/spawn_pool_world/**/*.json`: `4`
- Bedrock assets:
  - `.geo.json` models: `4`
  - animation json: `4`
  - posers: `4`
  - species bedrock json: `4`
  - pokemon texture png: `8`

Coverage impact against base gap (`174`), same conservative signal:

- Explicit implemented flips by GlitchDex: `0`
- Base-gap species targeted by GlitchDex species data: `0`
- Current contribution to unresolved reduction: `0`

Current conclusion:

- Keep GlitchDex as optional/source-discovery input, not as a current base-gap closer.
- The four GlitchDex species in this snapshot (`croagunk`, `toxicroak`, `capsakid`, `scovillain`) are already base-implemented in the current Cobblemon snapshot.

## 4) Coverage Checklist (Live)

- [x] Cobblemon (`851 / 1025`) -> `174` left
- [x] ATMxMSD explicit implemented flips (`101 / 174`) -> `73` left
- [x] + Mega Showdown explicit implemented flips (`+53` unique) -> `20` left
- [ ] Identify remaining source mods for unresolved `20` (from Cobbleverse dependency set)
- [ ] Reach `1025 / 1025` coverage or explicitly classify accepted exclusions

## 5) Required Data Classification

Each species must be assigned exactly one status for coverage accounting:

- `base-implemented`
- `addon-implemented` (not base-implemented, but implemented by one or more Cobbleverse mods)
- `addon-touched-not-implemented` (patched/mentioned but not proven implemented)
- `unresolved`

The classification rule must be deterministic and documented.

## 6) Required Provenance Contract (Per Species)

Each Pokemon detail payload must include provenance metadata:

- `isBaseCobblemonImplemented: boolean`
- `isCobbleverseProvided: boolean`
- `providedByMods: string[]`
- `provenanceEvidence: { mod: string; files: string[]; urls: string[] }[]`
- `provenanceStatus: "base-implemented" | "addon-implemented" | "addon-touched-not-implemented" | "unresolved"`

Unknown or unsupported fields must not be silently dropped from raw source payloads.

## 7) Required UI Contract (Pokemon Page)

For `/pokemon/:slug`:

- If species is not base Cobblemon implemented and is addon-provided, show a visible provenance label.
- Label must state that data is not from base Cobblemon and identify contributing Cobbleverse mod(s).
- If source is unresolved, show an explicit unresolved/source-pending message.

Minimum content requirement:

- "Not in base Cobblemon"
- "Added by Cobbleverse mod(s): <mod list>"

## 8) Required Reporting Artifact

A deterministic coverage report artifact must exist and be generated with data build output.

Minimum required report fields:

- `speciesTotal`
- `baseImplemented`
- `addonImplemented`
- `addonTouchedNotImplemented`
- `unresolved`
- `unresolvedSpecies[]`
- source snapshot metadata (repo URLs + commit SHAs/version IDs)

## 9) Acceptance Criteria

- Coverage checklist numbers are reproducible from source repos.
- Every species has provenance metadata and one classification status.
- Pokemon page provenance label is shown for non-base species.
- Build output includes coverage report artifact.
- For Cobbleverse parity mode: unresolved must be `0`, or build must fail with unresolved list.

## 10) Discovery Inputs to Continue

Needed next for unresolved `20`:

- Inspect Cobbleverse dependency inventory from Modrinth project/versions.
- Prioritize species-providing datapacks/resourcepacks beyond ATMxMSD and MSD.
- Map unresolved species to exact upstream file evidence in those dependencies.

Reference discovery source:

- Cobbleverse Modrinth collection: `https://modrinth.com/collection/vgKtV1Ao`
