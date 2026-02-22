import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js"
import { useMetadata } from "vike-metadata-solid"
import { usePageContext } from "vike-solid/usePageContext"
import { IconBox, IconEgg } from "@/assets/icons"
import { DualEggGroupSelector } from "@/components/dual-egg-group-selector"
import { PokemonSprite } from "@/components/pokemon-sprite"
import { loadPokemonList } from "@/data/data-loader"
import { canonicalId, formatEggGroup, titleCaseFromId } from "@/data/formatters"
import { cn } from "@/utils/cn"
import getTitle from "@/utils/get-title"

const EGG_GROUP_ORDER = [
  "monster",
  "water1",
  "bug",
  "flying",
  "field",
  "fairy",
  "grass",
  "human_like",
  "water3",
  "mineral",
  "amorphous",
  "water2",
  "ditto",
  "dragon",
  "undiscovered",
] as const

const EGG_GROUP_COLORS: Record<string, string> = {
  monster: "#8b5cf6",
  water1: "#38bdf8",
  bug: "#84cc16",
  flying: "#818cf8",
  field: "#d97706",
  fairy: "#f472b6",
  grass: "#22c55e",
  human_like: "#f97316",
  water3: "#0ea5e9",
  mineral: "#94a3b8",
  amorphous: "#a78bfa",
  water2: "#0284c7",
  ditto: "#e879f9",
  dragon: "#6366f1",
  undiscovered: "#64748b",
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
}

export default function Page() {
  const pageContext = usePageContext()
  const initialEggGroup = createMemo(() => String(pageContext.routeParams.eggGroupId ?? ""))

  return <EggGroupsPageView initialEggGroup={initialEggGroup()} />
}

export function EggGroupsPageView(props: { initialEggGroup?: string }) {
  const [pokemonList] = createResource(loadPokemonList)
  const [primaryEggGroup, setPrimaryEggGroup] = createSignal("")
  const [secondaryEggGroup, setSecondaryEggGroup] = createSignal<string | null>(null)

  useMetadata({
    title: getTitle("Egg Groups"),
  })

  const availableEggGroups = createMemo(() => {
    const set = new Set<string>()
    for (const pokemon of pokemonList() ?? []) {
      for (const group of pokemon.eggGroups) {
        set.add(group)
      }
    }
    return sortEggGroups(Array.from(set))
  })

  const resolveEggGroup = (value: string) => {
    const normalized = canonicalId(value)
    if (!normalized) return ""
    return availableEggGroups().find((group) => canonicalId(group) === normalized) ?? ""
  }

  createEffect(() => {
    const nextPrimary = resolveEggGroup(props.initialEggGroup ?? "")
    const nextSecondaryFromUrl =
      typeof window !== "undefined"
        ? canonicalId(new URLSearchParams(window.location.search).get("secondary") ?? "")
        : ""
    const nextSecondary = resolveEggGroup(nextSecondaryFromUrl)

    setPrimaryEggGroup(nextPrimary)
    setSecondaryEggGroup(
      nextPrimary && nextSecondary && nextSecondary !== nextPrimary ? nextSecondary : null
    )
  })

  const selectedEggGroups = createMemo(() => {
    const primary = primaryEggGroup()
    const secondary = secondaryEggGroup()
    if (!primary) return []
    if (secondary) return [primary, secondary]
    return [primary]
  })

  const syncUrl = (primary: string, secondary: string | null) => {
    if (typeof window === "undefined") return
    const path = primary ? `/egg-groups/${primary}` : "/egg-groups"
    const search = new URLSearchParams()
    if (secondary) {
      search.set("secondary", secondary)
    }
    const nextUrl = search.toString() ? `${path}?${search.toString()}` : path
    window.history.replaceState(null, "", nextUrl)
  }

  const handleEggGroupChange = (eggGroups: string[]) => {
    const validGroups = availableEggGroups()
    const normalized = eggGroups
      .map((group) => resolveEggGroup(group))
      .filter(Boolean)
      .filter((group, index, arr) => arr.indexOf(group) === index)
      .filter((group) => validGroups.length === 0 || validGroups.includes(group))
      .slice(0, 2)

    const nextPrimary = normalized[0] ?? ""
    const nextSecondary = normalized[1] ?? null

    setPrimaryEggGroup(nextPrimary)
    setSecondaryEggGroup(nextPrimary ? nextSecondary : null)
    syncUrl(nextPrimary, nextPrimary ? nextSecondary : null)
  }

  const filteredPokemon = createMemo(() => {
    const list = pokemonList() ?? []
    const primary = primaryEggGroup()
    const secondary = secondaryEggGroup()
    if (!primary) return []

    return list.filter((pokemon) => {
      if (!pokemon.implemented) return false
      if (!pokemon.eggGroups.includes(primary)) return false
      if (secondary && !pokemon.eggGroups.includes(secondary)) return false
      return true
    })
  })

  const requestedEggGroup = createMemo(() => canonicalId(props.initialEggGroup ?? ""))

  const isUnknownEggGroup = createMemo(() => {
    const requested = requestedEggGroup()
    if (!requested || availableEggGroups().length === 0) return false
    return !availableEggGroups().some((group) => canonicalId(group) === requested)
  })

  const primaryEggGroupColor = createMemo(() => EGG_GROUP_COLORS[primaryEggGroup()] ?? "#9ca3af")
  const hasNoSelection = createMemo(() => !primaryEggGroup())

  return (
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Show when={!pokemonList.loading} fallback={<LoadingState />}>
        <Show
          when={!isUnknownEggGroup()}
          fallback={<UnknownEggGroupState eggGroupId={props.initialEggGroup ?? ""} />}
        >
          <div class="space-y-6">
            <section class="border border-border bg-card p-4">
              <div class="mb-3">
                <p class="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                  Egg Group Explorer
                </p>
              </div>
              <DualEggGroupSelector
                availableEggGroups={availableEggGroups()}
                selectedEggGroups={selectedEggGroups()}
                onChange={handleEggGroupChange}
              />
            </section>

            <Show
              when={!hasNoSelection()}
              fallback={<EmptySelectionState availableEggGroups={availableEggGroups()} />}
            >
              <header class="relative overflow-hidden border border-border bg-card">
                <div class="relative p-5 sm:p-6">
                  <div class="flex items-start justify-between gap-4">
                    <div class="space-y-2">
                      <p class="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                        Egg Group Analysis
                      </p>
                      <div class="flex items-center gap-2">
                        <IconEgg class="h-4 w-4" style={{ color: primaryEggGroupColor() }} />
                        <h1 class="font-semibold text-2xl tracking-tight sm:text-3xl">
                          {formatEggGroup(primaryEggGroup())}
                          <Show when={secondaryEggGroup()}>
                            {(group) => (
                              <>
                                {" / "}
                                <span style={{ color: EGG_GROUP_COLORS[group()] ?? "#9ca3af" }}>
                                  {formatEggGroup(group())}
                                </span>
                              </>
                            )}
                          </Show>
                        </h1>
                      </div>
                      <p class="text-muted-foreground text-sm">
                        {filteredPokemon().length} Pokemon
                        <Show when={secondaryEggGroup()}>
                          <span> with both egg groups</span>
                        </Show>
                      </p>
                    </div>

                    <div class="hidden text-right sm:block">
                      <p class="font-mono text-muted-foreground text-xs">
                        #
                        {String(
                          EGG_GROUP_ORDER.indexOf(
                            primaryEggGroup() as (typeof EGG_GROUP_ORDER)[number]
                          ) + 1
                        ).padStart(2, "0")}
                      </p>
                    </div>
                  </div>
                </div>
              </header>

              <section>
                <div class="mb-3 flex items-center justify-between">
                  <p class="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                    Pokemon ({filteredPokemon().length})
                  </p>
                </div>

                <Show
                  when={filteredPokemon().length > 0}
                  fallback={
                    <div class="border border-border bg-card p-8 text-center">
                      <p class="text-muted-foreground text-sm">
                        No Pokemon with {formatEggGroup(primaryEggGroup())}
                        <Show when={secondaryEggGroup()}>
                          {(group) => <span> and {formatEggGroup(group())}</span>}
                        </Show>
                        .
                      </p>
                    </div>
                  }
                >
                  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <For each={filteredPokemon()}>
                      {(pokemon) => (
                        <a
                          href={`/pokemon/${pokemon.slug}`}
                          class="group border border-border bg-card p-3 transition-colors hover:border-muted-foreground"
                        >
                          <div class="mb-2 flex items-center justify-between gap-2">
                            <div class="flex min-w-0 items-center gap-2">
                              <PokemonSprite
                                dexNumber={pokemon.dexNumber}
                                name={pokemon.name}
                                class="h-8 w-8"
                                imageClass="h-6 w-6"
                              />
                              <p class="truncate font-medium text-sm group-hover:text-foreground">
                                {pokemon.name}
                              </p>
                            </div>
                            <span class="font-mono text-muted-foreground text-xs">
                              #{String(pokemon.dexNumber).padStart(3, "0")}
                            </span>
                          </div>

                          <div class="mb-2 flex flex-wrap items-center gap-1">
                            <For each={pokemon.types}>
                              {(type) => (
                                <span
                                  class="inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                                  style={{
                                    "border-color": TYPE_COLORS[type] ?? "#888888",
                                    color: TYPE_COLORS[type] ?? "#888888",
                                  }}
                                >
                                  <IconBox class="h-3 w-3" />
                                  {titleCaseFromId(type)}
                                </span>
                              )}
                            </For>
                          </div>

                          <div class="flex flex-wrap items-center gap-1">
                            <For each={pokemon.eggGroups}>
                              {(group) => (
                                <span
                                  class={cn(
                                    "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                                    (group === primaryEggGroup() ||
                                      group === secondaryEggGroup()) &&
                                      "ring-1 ring-offset-1 ring-offset-background"
                                  )}
                                  style={{
                                    "border-color": EGG_GROUP_COLORS[group] ?? "#9ca3af",
                                    color: EGG_GROUP_COLORS[group] ?? "#9ca3af",
                                    "--tw-ring-color": EGG_GROUP_COLORS[group] ?? "#9ca3af",
                                  }}
                                >
                                  <IconEgg class="h-3 w-3" />
                                  {formatEggGroup(group)}
                                </span>
                              )}
                            </For>
                          </div>
                        </a>
                      )}
                    </For>
                  </div>
                </Show>
              </section>
            </Show>
          </div>
        </Show>
      </Show>
    </div>
  )
}

function LoadingState() {
  return (
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div class="h-8 w-8 animate-spin border-2 border-border border-t-foreground" />
      <p class="text-muted-foreground text-sm">Loading egg group data...</p>
    </div>
  )
}

function EmptySelectionState(props: { availableEggGroups: string[] }) {
  return (
    <div class="flex min-h-[40vh] flex-col items-center justify-center gap-4 border border-border bg-card p-8 text-center">
      <h2 class="font-semibold text-xl">Select an Egg Group</h2>
      <p class="text-muted-foreground text-sm">
        Use the selector above to explore one egg group or intersect two groups.
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <For each={props.availableEggGroups}>
          {(group) => (
            <a
              href={`/egg-groups/${group}`}
              class="inline-flex items-center gap-1 border px-3 py-1.5 font-mono text-xs uppercase transition-colors hover:opacity-80"
              style={{
                "border-color": EGG_GROUP_COLORS[group] ?? "#9ca3af",
                color: EGG_GROUP_COLORS[group] ?? "#9ca3af",
              }}
            >
              <IconEgg class="h-3 w-3" />
              {formatEggGroup(group)}
            </a>
          )}
        </For>
      </div>
    </div>
  )
}

function UnknownEggGroupState(props: { eggGroupId: string }) {
  return (
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 border border-border bg-card p-8 text-center">
      <h1 class="font-semibold text-2xl">Egg Group Not Found</h1>
      <p class="text-muted-foreground text-sm">
        <span class="font-mono">{props.eggGroupId || "unknown"}</span> is not a recognized egg
        group.
      </p>
    </div>
  )
}

function sortEggGroups(groups: string[]): string[] {
  return [...groups].sort((left, right) => {
    const leftIndex = EGG_GROUP_ORDER.indexOf(left as (typeof EGG_GROUP_ORDER)[number])
    const rightIndex = EGG_GROUP_ORDER.indexOf(right as (typeof EGG_GROUP_ORDER)[number])

    if (leftIndex !== -1 && rightIndex !== -1 && leftIndex !== rightIndex) {
      return leftIndex - rightIndex
    }

    if (leftIndex !== -1) return -1
    if (rightIndex !== -1) return 1

    return left.localeCompare(right)
  })
}
