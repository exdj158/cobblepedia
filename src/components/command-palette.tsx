import { useHotkeys } from "bagon-hooks"
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js"
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type {
  MoveLearnerEntryRecord,
  MoveLearnersIndex,
  MoveSourceType,
  PaletteResult,
  PokemonDetailRecord,
  PokemonListItem,
  QueryFacet,
  SearchDocument,
} from "@/data/cobblemon-types"
import {
  loadMoveLearners,
  loadPokemonDetail,
  loadPokemonList,
  loadSearchIndex,
} from "@/data/data-loader"
import {
  formatConditionChips,
  formatEggGroup,
  formatMoveSource,
  titleCaseFromId,
} from "@/data/formatters"
import { resolveQuery } from "@/data/query-engine"
import { cn } from "@/utils/cn"

const MOVE_TABS = ["all", "level", "egg", "tm", "tutor"] as const
type MoveTab = (typeof MOVE_TABS)[number]

export default function CommandPalette() {
  const [isOpen, setIsOpen] = createSignal(false)
  const [query, setQuery] = createSignal("")
  const [activeIndex, setActiveIndex] = createSignal(0)

  const [searchIndex, setSearchIndex] = createSignal<SearchDocument[] | null>(null)
  const [pokemonList, setPokemonList] = createSignal<PokemonListItem[] | null>(null)
  const [moveLearners, setMoveLearners] = createSignal<MoveLearnersIndex | null>(null)
  const [loadError, setLoadError] = createSignal<string | null>(null)

  let inputRef: HTMLInputElement | undefined

  const dataReady = createMemo(() => {
    return searchIndex() !== null && pokemonList() !== null && moveLearners() !== null
  })

  const resolution = createMemo(() => {
    if (!dataReady()) {
      return {
        intent: "fuzzy-fallback" as const,
        normalizedQuery: "",
        results: [] as PaletteResult[],
      }
    }

    return resolveQuery(query(), searchIndex() ?? [], pokemonList() ?? [], moveLearners() ?? {})
  })

  const results = createMemo(() => resolution().results)
  const activeResult = createMemo(() => {
    const current = results()
    const index = activeIndex()
    if (current.length === 0) {
      return null
    }

    if (index < 0) {
      return current[0]
    }

    if (index >= current.length) {
      return current[current.length - 1]
    }

    return current[index]
  })

  const [activePokemonDetail] = createResource(
    () => activeResult()?.slug,
    async (slug) => {
      if (!slug) {
        return null
      }

      return loadPokemonDetail(slug)
    }
  )

  const activeMoveEntry = createMemo<MoveLearnerEntryRecord | null>(() => {
    const result = activeResult()
    const index = moveLearners()
    if (!result || result.type !== "move-learners" || !result.moveId || !index) {
      return null
    }

    return index[result.moveId] ?? null
  })

  createEffect(
    on(results, (nextResults) => {
      if (nextResults.length === 0) {
        setActiveIndex(0)
        return
      }

      if (activeIndex() >= nextResults.length) {
        setActiveIndex(0)
      }
    })
  )

  createEffect(
    on(query, () => {
      setActiveIndex(0)
    })
  )

  createEffect(() => {
    if (!isOpen() || dataReady()) {
      return
    }

    void Promise.all([loadSearchIndex(), loadPokemonList(), loadMoveLearners()])
      .then(([nextSearchIndex, nextPokemonList, nextMoveLearners]) => {
        setSearchIndex(nextSearchIndex)
        setPokemonList(nextPokemonList)
        setMoveLearners(nextMoveLearners)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to load index"
        setLoadError(message)
      })
  })

  // Focus input when dialog opens
  createEffect(() => {
    if (isOpen()) {
      queueMicrotask(() => {
        inputRef?.focus()
        inputRef?.select()
      })
    }
  })

  useHotkeys([
    [
      "meta+k",
      (event?: KeyboardEvent) => {
        event?.preventDefault()
        openPalette()
      },
    ],
    [
      "ctrl+k",
      (event?: KeyboardEvent) => {
        event?.preventDefault()
        openPalette()
      },
    ],
  ])

  onMount(() => {
    const onOpenPalette = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return
      }

      openPalette(typeof event.detail === "string" ? event.detail : "")
    }

    window.addEventListener("cobblepedia:open-palette", onOpenPalette)
    onCleanup(() => {
      window.removeEventListener("cobblepedia:open-palette", onOpenPalette)
    })
  })

  function openPalette(nextQuery = "") {
    setIsOpen(true)
    setQuery(nextQuery)
  }

  function closePalette() {
    setIsOpen(false)
    setQuery("")
    setActiveIndex(0)
  }

  function executeResult(result: PaletteResult | null, openInNewTab = false) {
    if (!result) {
      return
    }

    const navigate = (url: string) => {
      if (openInNewTab) {
        window.open(url, "_blank")
      } else {
        window.location.assign(url)
      }
    }

    if (result.slug) {
      closePalette()
      navigate(`/pokemon/${result.slug}`)
      return
    }

    if (result.type === "move-learners" && result.moveId) {
      const firstLearner = moveLearners()?.[result.moveId]?.learners[0]
      if (firstLearner) {
        closePalette()
        navigate(`/pokemon/${firstLearner.slug}`)
      }
    }
  }

  function onQueryKeyDown(event: KeyboardEvent) {
    const currentResults = results()

    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (currentResults.length > 0) {
        setActiveIndex((current) => Math.min(current + 1, currentResults.length - 1))
      }
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (currentResults.length > 0) {
        setActiveIndex((current) => Math.max(current - 1, 0))
      }
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const openInNewTab = event.shiftKey
      executeResult(activeResult(), openInNewTab)
      return
    }
  }

  return (
    <CommandDialog
      open={isOpen()}
      onOpenChange={(open) => {
        if (!open) closePalette()
      }}
      class="!max-w-[900px] !w-[90vw] !p-0 !overflow-hidden"
    >
      <div class="flex flex-col bg-card">
        <CommandInput
          ref={inputRef}
          value={query()}
          onValueChange={setQuery}
          onKeyDown={onQueryKeyDown}
          placeholder="Try: lucario moves | lucario spawn | moves trickroom"
        />

        <div class="grid max-h-[500px] min-h-[400px]">
          <div class="overflow-y-auto border-border border-r">
            <Show
              when={!loadError()}
              fallback={
                <div class="p-12 text-center text-muted-foreground text-sm">
                  Failed to load index: {loadError()}
                </div>
              }
            >
              <Show
                when={dataReady()}
                fallback={
                  <div class="p-12 text-center text-muted-foreground text-sm">
                    Loading search index...
                  </div>
                }
              >
                <CommandList class="p-2">
                  <Show
                    when={results().length > 0}
                    fallback={
                      <CommandEmpty class="py-6 text-center text-sm">
                        Try `lucario evolution` or `moves trickroom`.
                      </CommandEmpty>
                    }
                  >
                    <For each={results()}>
                      {(result, index) => (
                        <CommandItem
                          value={result.id}
                          class={cn(
                            "mb-0.5 flex cursor-pointer flex-col gap-1 border-transparent border-l-2 p-3 transition-colors",
                            index() === activeIndex() && "border-l-foreground bg-secondary"
                          )}
                          onPointerMove={() => setActiveIndex(index())}
                          onClick={() => executeResult(result)}
                        >
                          <div class="font-medium text-sm">{result.title}</div>
                          <div class="text-muted-foreground text-xs">{result.subtitle}</div>
                        </CommandItem>
                      )}
                    </For>
                  </Show>
                </CommandList>
              </Show>
            </Show>
          </div>

          <div class="hidden overflow-y-auto p-5 lg:block">
            <QuickviewPanel
              result={activeResult()}
              pokemonDetail={activePokemonDetail()}
              moveEntry={activeMoveEntry()}
              loadingPokemon={activePokemonDetail.loading}
            />
          </div>
        </div>

        <div class="flex items-center justify-between border-border border-t bg-secondary px-5 py-3">
          <span class="text-muted-foreground text-xs">Enter to open</span>
          <span class="text-muted-foreground text-xs">Esc to close</span>
        </div>
      </div>
    </CommandDialog>
  )
}

function QuickviewPanel(props: {
  result: PaletteResult | null
  pokemonDetail: PokemonDetailRecord | null | undefined
  moveEntry: MoveLearnerEntryRecord | null
  loadingPokemon: boolean
}) {
  return (
    <Show
      when={props.result}
      fallback={
        <div class="flex h-full flex-col items-center justify-center gap-2 border border-border border-dashed p-10 text-center text-muted-foreground">
          <p class="font-medium text-foreground">Quickview</p>
          <p class="text-sm">Type to preview details.</p>
        </div>
      }
    >
      {(resultSignal) => {
        const result = createMemo(() => resultSignal())
        const facet = createMemo(() => resolveResultFacet(result()))

        return (
          <Switch>
            <Match when={result().type === "move-learners"}>
              <MoveLearnersQuickview entry={props.moveEntry} />
            </Match>

            <Match when={facet() === "moves"}>
              <MovesFacetQuickview detail={props.pokemonDetail} loading={props.loadingPokemon} />
            </Match>

            <Match when={facet() === "spawn"}>
              <SpawnFacetQuickview detail={props.pokemonDetail} loading={props.loadingPokemon} />
            </Match>

            <Match when={facet() === "evolution"}>
              <EvolutionFacetQuickview
                detail={props.pokemonDetail}
                loading={props.loadingPokemon}
              />
            </Match>

            <Match when={facet() === "egg-group"}>
              <EggGroupFacetQuickview detail={props.pokemonDetail} loading={props.loadingPokemon} />
            </Match>

            <Match when={true}>
              <PokemonOverviewQuickview
                detail={props.pokemonDetail}
                loading={props.loadingPokemon}
              />
            </Match>
          </Switch>
        )
      }}
    </Show>
  )
}

function PokemonOverviewQuickview(props: {
  detail: PokemonDetailRecord | null | undefined
  loading: boolean
}) {
  return (
    <Show
      when={!props.loading}
      fallback={
        <div class="p-12 text-center text-muted-foreground text-sm">Loading Pokemon details...</div>
      }
    >
      <Show
        when={props.detail}
        fallback={
          <div class="p-12 text-center text-muted-foreground text-sm">
            Pokemon details unavailable.
          </div>
        }
      >
        {(detailSignal) => {
          const detail = detailSignal()
          const nextEvolutions = detail.evolutions
            .map((edge) => titleCaseFromId(edge.result.slug))
            .filter(Boolean)
          const spawnHints = detail.spawnEntries.slice(0, 3)

          return (
            <div class="flex flex-col gap-6">
              <div class="border-border border-b pb-4">
                <h3 class="mb-1 font-semibold text-lg">
                  {detail.name}{" "}
                  <span class="font-normal text-muted-foreground">#{detail.dexNumber}</span>
                </h3>
                <p class="text-muted-foreground text-sm">
                  {detail.types.map((type) => titleCaseFromId(type)).join(" / ")}
                </p>
              </div>

              <div>
                <h4 class="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Abilities
                </h4>
                <div class="flex flex-wrap gap-2">
                  <For each={detail.abilities}>
                    {(ability) => (
                      <span class="border border-border bg-secondary px-2.5 py-1 text-xs">
                        {ability.hidden ? `${ability.label} (Hidden)` : ability.label}
                      </span>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <h4 class="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Egg Groups
                </h4>
                <div class="flex flex-wrap gap-2">
                  <For each={detail.eggGroups}>
                    {(group) => (
                      <span class="border border-border bg-secondary px-2.5 py-1 text-xs">
                        {formatEggGroup(group)}
                      </span>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <h4 class="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Evolution
                </h4>
                <p class="text-muted-foreground text-sm">
                  Pre: {detail.preEvolution ? titleCaseFromId(detail.preEvolution.slug) : "None"} ·
                  Next: {nextEvolutions.length > 0 ? nextEvolutions.join(", ") : "None"}
                </p>
              </div>

              <div>
                <h4 class="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Spawn Summary
                </h4>
                <Show
                  when={spawnHints.length > 0}
                  fallback={
                    <p class="text-muted-foreground text-sm">
                      No spawn entries available for this snapshot.
                    </p>
                  }
                >
                  <div class="space-y-1">
                    <For each={spawnHints}>
                      {(entry) => (
                        <p class="text-muted-foreground text-sm">
                          {titleCaseFromId(entry.bucket)} · {entry.levelText ?? "-"} ·{" "}
                          {titleCaseFromId(entry.spawnablePositionType)}
                        </p>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          )
        }}
      </Show>
    </Show>
  )
}

function EggGroupFacetQuickview(props: {
  detail: PokemonDetailRecord | null | undefined
  loading: boolean
}) {
  return (
    <Show
      when={!props.loading}
      fallback={
        <div class="p-12 text-center text-muted-foreground text-sm">Loading egg groups...</div>
      }
    >
      <Show
        when={props.detail}
        fallback={
          <div class="p-12 text-center text-muted-foreground text-sm">
            Pokemon details unavailable.
          </div>
        }
      >
        {(detailSignal) => {
          const detail = detailSignal()
          return (
            <div class="flex flex-col gap-6">
              <div class="border-border border-b pb-4">
                <h3 class="mb-1 font-semibold text-lg">{detail.name} Egg Groups</h3>
                <p class="text-muted-foreground text-sm">Breeding categories for this species.</p>
              </div>

              <div class="flex flex-wrap gap-2">
                <For each={detail.eggGroups}>
                  {(group) => (
                    <span class="border border-border bg-secondary px-2.5 py-1 text-sm">
                      {formatEggGroup(group)}
                    </span>
                  )}
                </For>
              </div>
            </div>
          )
        }}
      </Show>
    </Show>
  )
}

function MovesFacetQuickview(props: {
  detail: PokemonDetailRecord | null | undefined
  loading: boolean
}) {
  const [activeTab, setActiveTab] = createSignal<MoveTab>("all")
  const [moveQuery, setMoveQuery] = createSignal("")

  const counts = createMemo(() => {
    const detail = props.detail
    if (!detail) {
      return {
        all: 0,
        level: 0,
        egg: 0,
        tm: 0,
        tutor: 0,
      }
    }

    return {
      all: detail.moves.length,
      level: detail.moves.filter((move) => move.sourceType === "level").length,
      egg: detail.moves.filter((move) => move.sourceType === "egg").length,
      tm: detail.moves.filter((move) => move.sourceType === "tm").length,
      tutor: detail.moves.filter((move) => move.sourceType === "tutor").length,
    }
  })

  const filteredMoves = createMemo(() => {
    const detail = props.detail
    if (!detail) {
      return []
    }

    const tab = activeTab()
    const normalizedMoveQuery = moveQuery().toLowerCase().trim()

    return detail.moves
      .filter((move) => {
        if (tab !== "all" && move.sourceType !== tab) {
          return false
        }

        if (!normalizedMoveQuery) {
          return true
        }

        const target = `${move.moveName} ${move.moveId}`.toLowerCase()
        return target.includes(normalizedMoveQuery)
      })
      .slice(0, 40)
  })

  return (
    <Show
      when={!props.loading}
      fallback={
        <div class="p-12 text-center text-muted-foreground text-sm">Loading move list...</div>
      }
    >
      <Show
        when={props.detail}
        fallback={
          <div class="p-12 text-center text-muted-foreground text-sm">
            Pokemon details unavailable.
          </div>
        }
      >
        {(detailSignal) => {
          const detail = detailSignal()

          return (
            <div class="flex flex-col gap-5">
              <div class="border-border border-b pb-4">
                <h3 class="mb-1 font-semibold text-lg">{detail.name} Moves</h3>
                <p class="text-muted-foreground text-sm">
                  Filter by source and search inside move names.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <For each={MOVE_TABS}>
                  {(tab) => (
                    <button
                      type="button"
                      role="tab"
                      class={cn(
                        "border px-2.5 py-1 text-xs transition-colors",
                        activeTab() === tab
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-secondary hover:border-muted-foreground"
                      )}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === "all" ? "All" : titleCaseFromId(tab)} ({counts()[tab]})
                    </button>
                  )}
                </For>
              </div>

              <input
                class="w-full border border-border bg-secondary px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
                value={moveQuery()}
                onInput={(event) => setMoveQuery(event.currentTarget.value)}
                placeholder="Search move names"
              />

              <div class="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
                <For each={filteredMoves()}>
                  {(move) => (
                    <div class="flex items-center justify-between border-border border-b py-2 last:border-0">
                      <span class="text-sm">{move.moveName}</span>
                      <span class="text-muted-foreground text-xs">
                        {formatMoveSource(move.sourceType, move.sourceValue)}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )
        }}
      </Show>
    </Show>
  )
}

function SpawnFacetQuickview(props: {
  detail: PokemonDetailRecord | null | undefined
  loading: boolean
}) {
  return (
    <Show
      when={!props.loading}
      fallback={
        <div class="p-12 text-center text-muted-foreground text-sm">Loading spawn rows...</div>
      }
    >
      <Show
        when={props.detail}
        fallback={
          <div class="p-12 text-center text-muted-foreground text-sm">
            Pokemon details unavailable.
          </div>
        }
      >
        {(detailSignal) => {
          const detail = detailSignal()
          return (
            <div class="flex flex-col gap-5">
              <div class="border-border border-b pb-4">
                <h3 class="mb-1 font-semibold text-lg">{detail.name} Spawn</h3>
                <p class="text-muted-foreground text-sm">
                  Bucket, level, position, and condition highlights.
                </p>
              </div>

              <Show
                when={detail.spawnEntries.length > 0}
                fallback={
                  <div class="p-12 text-center text-muted-foreground text-sm">
                    No spawn entries for this species.
                  </div>
                }
              >
                <div class="flex max-h-[400px] flex-col gap-3 overflow-y-auto">
                  <For each={detail.spawnEntries.slice(0, 16)}>
                    {(entry) => (
                      <div class="border-border border-b py-3 last:border-0">
                        <div class="mb-2 flex items-center justify-between">
                          <span class="font-medium">{titleCaseFromId(entry.bucket)}</span>
                          <span class="text-muted-foreground text-sm">
                            {entry.levelText ?? "-"} ·{" "}
                            {titleCaseFromId(entry.spawnablePositionType)}
                          </span>
                        </div>
                        <div class="flex flex-wrap gap-1">
                          <For each={formatConditionChips(entry.condition).slice(0, 3)}>
                            {(chip) => (
                              <span class="border border-border bg-secondary px-2 py-0.5 text-xs">
                                {chip}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )
        }}
      </Show>
    </Show>
  )
}

function EvolutionFacetQuickview(props: {
  detail: PokemonDetailRecord | null | undefined
  loading: boolean
}) {
  return (
    <Show
      when={!props.loading}
      fallback={
        <div class="p-12 text-center text-muted-foreground text-sm">
          Loading evolution family...
        </div>
      }
    >
      <Show
        when={props.detail}
        fallback={
          <div class="p-12 text-center text-muted-foreground text-sm">
            Pokemon details unavailable.
          </div>
        }
      >
        {(detailSignal) => {
          const detail = detailSignal()
          const family = detail.evolutionFamily

          return (
            <div class="flex flex-col gap-5">
              <div class="border-border border-b pb-4">
                <h3 class="mb-1 font-semibold text-lg">{detail.name} Evolution</h3>
                <p class="text-muted-foreground text-sm">
                  Full family edges and readable requirements.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <For each={family.members}>
                  {(member) => (
                    <span class="border border-border bg-secondary px-2.5 py-1 text-sm">
                      {member.name}
                    </span>
                  )}
                </For>
              </div>

              <div class="flex max-h-[400px] flex-col gap-3 overflow-y-auto">
                <For each={family.edges}>
                  {(edge) => (
                    <div class="border-border border-b py-3 last:border-0">
                      <div class="mb-2">
                        <span class="font-medium">
                          {titleCaseFromId(edge.fromSlug)} → {titleCaseFromId(edge.toSlug)}
                        </span>
                        <span class="ml-2 text-muted-foreground text-sm">
                          {titleCaseFromId(edge.method)}
                        </span>
                      </div>
                      <Show when={edge.requirementText.length > 0}>
                        <div class="flex flex-wrap gap-1">
                          <For each={edge.requirementText}>
                            {(text) => (
                              <span class="border border-border bg-secondary px-2 py-0.5 text-xs">
                                {text}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )
        }}
      </Show>
    </Show>
  )
}

function MoveLearnersQuickview(props: { entry: MoveLearnerEntryRecord | null }) {
  return (
    <Show
      when={props.entry}
      fallback={
        <div class="p-12 text-center text-muted-foreground text-sm">Move details unavailable.</div>
      }
    >
      {(entrySignal) => {
        const entry = entrySignal()
        return (
          <div class="flex flex-col gap-5">
            <div class="border-border border-b pb-4">
              <h3 class="mb-1 font-semibold text-lg">{entry.moveName}</h3>
              <p class="text-muted-foreground text-sm">
                {entry.learners.length} Pokemon can learn this move.
              </p>
            </div>

            <div class="flex max-h-[400px] flex-col gap-2 overflow-y-auto">
              <For each={entry.learners.slice(0, 30)}>
                {(learner) => (
                  <div class="flex items-center justify-between border-border border-b py-2 last:border-0">
                    <a href={`/pokemon/${learner.slug}`} class="text-sm hover:underline">
                      {learner.name}
                    </a>
                    <span class="text-muted-foreground text-xs">
                      {learner.methods.map((method) => sourceLabel(method)).join(", ")}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        )
      }}
    </Show>
  )
}

function sourceLabel(sourceType: string): string {
  return formatMoveSource(sourceType as MoveSourceType, null)
}

function resolveResultFacet(result: PaletteResult): QueryFacet | null {
  if (result.facet) {
    return result.facet
  }

  const subtitle = result.subtitle.toLowerCase()
  if (subtitle.includes("egg groups")) {
    return "egg-group"
  }
  if (subtitle.includes("moves")) {
    return "moves"
  }
  if (subtitle.includes("spawn")) {
    return "spawn"
  }
  if (subtitle.includes("evolution")) {
    return "evolution"
  }

  return null
}
