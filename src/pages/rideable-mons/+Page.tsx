import { useKeyboard } from "bagon-hooks"
import type { JSX } from "solid-js"
import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js"
import { useMetadata } from "vike-metadata-solid"
import { PokemonSprite } from "@/components/pokemon-sprite"
import { RideableCategoryIcon, RideableClassIcon } from "@/components/rideable-icons"
import { loadRideableMons } from "@/data/data-loader"
import { titleCaseFromId } from "@/data/formatters"
import { formatRideableCategory, formatRideableClass } from "@/data/rideable"
import { cn } from "@/utils/cn"
import getTitle from "@/utils/get-title"

type SeatFilter = "ALL" | "1" | "2" | "3+"
type SortOption = "dex" | "name" | "seats" | "modes"

const CATEGORY_FILTERS = ["ALL", "LAND", "LIQUID", "AIR"] as const

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

const CLASS_ORDER = ["horse", "bird", "boat", "dolphin", "hover", "jet", "rocket", "submarine"]

export default function Page() {
  useMetadata({
    title: getTitle("Rideable Mons"),
  })

  const [rideableMons] = createResource(loadRideableMons)
  const [search, setSearch] = createSignal("")
  const [categoryFilter, setCategoryFilter] = createSignal<string>("ALL")
  const [classFilter, setClassFilter] = createSignal<string>("ALL")
  const [seatFilter, setSeatFilter] = createSignal<SeatFilter>("ALL")
  const [sortBy, setSortBy] = createSignal<SortOption>("dex")
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  let searchInputRef: HTMLInputElement | undefined

  createEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const queryParam = new URLSearchParams(window.location.search).get("query")?.trim() ?? ""
    if (queryParam) {
      setSearch(queryParam)
    }
  })

  const availableClasses = createMemo(() => {
    const classes = new Set<string>()

    for (const pokemon of rideableMons() ?? []) {
      for (const classId of pokemon.classes) {
        classes.add(classId)
      }
    }

    return Array.from(classes).sort((left, right) => {
      const leftOrder = CLASS_ORDER.indexOf(left)
      const rightOrder = CLASS_ORDER.indexOf(right)

      if (leftOrder !== -1 && rightOrder !== -1 && leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }

      if (leftOrder !== -1) {
        return -1
      }

      if (rightOrder !== -1) {
        return 1
      }

      return left.localeCompare(right)
    })
  })

  const categoryCounts = createMemo(() => {
    const counts: Record<string, number> = {
      ALL: (rideableMons() ?? []).length,
      LAND: 0,
      LIQUID: 0,
      AIR: 0,
    }

    for (const pokemon of rideableMons() ?? []) {
      for (const category of pokemon.categories) {
        if (category in counts) {
          counts[category] += 1
        }
      }
    }

    return counts
  })

  const filteredMons = createMemo(() => {
    const query = search().trim().toLowerCase()
    const category = categoryFilter()
    const classId = classFilter()
    const seats = seatFilter()
    const sort = sortBy()

    const filtered = (rideableMons() ?? []).filter((pokemon) => {
      if (query) {
        const haystack = `${pokemon.name} ${pokemon.slug} ${pokemon.dexNumber}`.toLowerCase()
        if (!haystack.includes(query)) {
          return false
        }
      }

      if (category !== "ALL" && !pokemon.categories.includes(category)) {
        return false
      }

      if (classId !== "ALL" && !pokemon.classes.includes(classId)) {
        return false
      }

      if (seats === "1" && pokemon.seatCount !== 1) {
        return false
      }

      if (seats === "2" && pokemon.seatCount !== 2) {
        return false
      }

      if (seats === "3+" && pokemon.seatCount < 3) {
        return false
      }

      return true
    })

    return filtered.sort((left, right) => {
      if (sort === "name") {
        return left.name.localeCompare(right.name)
      }

      if (sort === "seats") {
        if (left.seatCount !== right.seatCount) {
          return right.seatCount - left.seatCount
        }
      }

      if (sort === "modes") {
        if (left.categories.length !== right.categories.length) {
          return right.categories.length - left.categories.length
        }
      }

      if (left.dexNumber !== right.dexNumber) {
        return left.dexNumber - right.dexNumber
      }

      return left.slug.localeCompare(right.slug)
    })
  })

  const summary = createMemo(() => {
    const all = rideableMons() ?? []

    return {
      total: all.length,
      air: all.filter((pokemon) => pokemon.categories.includes("AIR")).length,
      land: all.filter((pokemon) => pokemon.categories.includes("LAND")).length,
      liquid: all.filter((pokemon) => pokemon.categories.includes("LIQUID")).length,
      multiMode: all.filter((pokemon) => pokemon.categories.length > 1).length,
      multiSeat: all.filter((pokemon) => pokemon.seatCount > 1).length,
    }
  })

  createEffect(() => {
    search()
    categoryFilter()
    classFilter()
    seatFilter()
    sortBy()
    setSelectedIndex(0)
  })

  createEffect(() => {
    const maxIndex = filteredMons().length - 1
    const nextIndex = Math.min(selectedIndex(), maxIndex)
    setSelectedIndex(nextIndex < 0 ? 0 : nextIndex)
  })

  useKeyboard({
    onKeyDown: (event) => {
      const targetIsEditable = isEditableTarget(event.target)

      if (event.key === "/" && !targetIsEditable) {
        event.preventDefault()
        searchInputRef?.focus()
        searchInputRef?.select()
        return
      }

      if (targetIsEditable) {
        return
      }

      const list = filteredMons()
      if (list.length === 0) {
        return
      }

      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault()
        setSelectedIndex((index) => Math.min(index + 1, list.length - 1))
        return
      }

      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault()
        setSelectedIndex((index) => Math.max(index - 1, 0))
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        const selected = list[selectedIndex()]
        if (selected) {
          window.location.assign(`/pokemon/${selected.slug}`)
        }
      }
    },
  })

  return (
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Show when={!rideableMons.loading} fallback={<LoadingState />}>
        <Show when={rideableMons()}>
          {(dataSignal) => (
            <div class="space-y-5">
              <header class="border border-border bg-card p-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                      Mobility Index
                    </p>
                    <h1 class="mt-1 font-semibold text-3xl tracking-tight sm:text-4xl">
                      Rideable Mons
                    </h1>
                    <p class="mt-2 max-w-2xl text-muted-foreground text-sm">
                      Filter every mountable species by movement category, ride class, and seat
                      count.
                    </p>
                  </div>

                  <div class="grid grid-cols-2 gap-px border border-border bg-border text-sm sm:grid-cols-3">
                    <StatCell label="Total" value={summary().total} />
                    <StatCell label="Air" value={summary().air} />
                    <StatCell label="Land" value={summary().land} />
                    <StatCell label="Liquid" value={summary().liquid} />
                    <StatCell label="Multi-Mode" value={summary().multiMode} />
                    <StatCell label="Multi-Seat" value={summary().multiSeat} />
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                  <kbd class="border border-border bg-secondary px-1.5 py-0.5 font-mono">/</kbd>
                  <span>Focus search</span>
                  <kbd class="border border-border bg-secondary px-1.5 py-0.5 font-mono">J</kbd>
                  <kbd class="border border-border bg-secondary px-1.5 py-0.5 font-mono">K</kbd>
                  <span>Move selection</span>
                  <kbd class="border border-border bg-secondary px-1.5 py-0.5 font-mono">Enter</kbd>
                  <span>Open Pokemon</span>
                </div>
              </header>

              <section class="border border-border bg-card">
                <div class="border-border border-b p-4">
                  <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      class="w-full border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
                      placeholder="Search by name, slug, or dex..."
                      value={search()}
                      onInput={(event) => setSearch(event.currentTarget.value)}
                    />

                    <label class="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                      Sort
                      <select
                        class="border border-border bg-background px-2 py-1.5 text-foreground text-xs"
                        value={sortBy()}
                        onChange={(event) => setSortBy(event.currentTarget.value as SortOption)}
                      >
                        <option value="dex">Dex #</option>
                        <option value="name">Name</option>
                        <option value="seats">Seats (high)</option>
                        <option value="modes">Modes (high)</option>
                      </select>
                    </label>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <For each={CATEGORY_FILTERS}>
                      {(category) => (
                        <FilterChip
                          active={categoryFilter() === category}
                          label={
                            category === "ALL" ? "All Categories" : formatRideableCategory(category)
                          }
                          count={categoryCounts()[category] ?? 0}
                          onClick={() => setCategoryFilter(category)}
                          icon={
                            category === "ALL" ? null : (
                              <RideableCategoryIcon category={category} class="h-3.5 w-3.5" />
                            )
                          }
                        />
                      )}
                    </For>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <FilterChip
                      active={classFilter() === "ALL"}
                      label="All Classes"
                      onClick={() => setClassFilter("ALL")}
                    />
                    <For each={availableClasses()}>
                      {(classId) => (
                        <FilterChip
                          active={classFilter() === classId}
                          label={formatRideableClass(classId)}
                          onClick={() => setClassFilter(classId)}
                          icon={<RideableClassIcon classId={classId} class="h-3.5 w-3.5" />}
                        />
                      )}
                    </For>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <FilterChip
                      active={seatFilter() === "ALL"}
                      label="All Seats"
                      onClick={() => setSeatFilter("ALL")}
                    />
                    <FilterChip
                      active={seatFilter() === "1"}
                      label="1 seat"
                      onClick={() => setSeatFilter("1")}
                    />
                    <FilterChip
                      active={seatFilter() === "2"}
                      label="2 seats"
                      onClick={() => setSeatFilter("2")}
                    />
                    <FilterChip
                      active={seatFilter() === "3+"}
                      label="3+ seats"
                      onClick={() => setSeatFilter("3+")}
                    />
                  </div>
                </div>

                <Show
                  when={filteredMons().length > 0}
                  fallback={
                    <div class="px-4 py-10 text-center">
                      <p class="font-medium">No rideable Pokemon match this filter set.</p>
                      <p class="mt-1 text-muted-foreground text-sm">
                        Try clearing a category or class.
                      </p>
                    </div>
                  }
                >
                  <div class="max-h-[68vh] overflow-auto">
                    <table class="w-full text-sm">
                      <thead class="sticky top-0 bg-secondary/95 backdrop-blur-sm">
                        <tr>
                          <th class="px-4 py-2 text-left font-medium text-muted-foreground">
                            Pokemon
                          </th>
                          <th class="px-4 py-2 text-left font-medium text-muted-foreground">
                            Ride Classes
                          </th>
                          <th class="px-4 py-2 text-right font-medium text-muted-foreground">
                            Seats
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        <For each={filteredMons()}>
                          {(pokemon, index) => {
                            const isSelected = () => selectedIndex() === index()

                            return (
                              <tr
                                class={cn(
                                  "cursor-pointer transition-colors",
                                  isSelected() ? "bg-secondary/70" : "hover:bg-secondary/40"
                                )}
                                onMouseEnter={() => setSelectedIndex(index())}
                                onClick={() => window.location.assign(`/pokemon/${pokemon.slug}`)}
                                aria-selected={isSelected()}
                              >
                                <td class="px-4 py-3 align-top">
                                  <div class="flex items-center gap-3">
                                    <PokemonSprite
                                      dexNumber={pokemon.dexNumber}
                                      name={pokemon.name}
                                    />

                                    <div>
                                      <a
                                        href={`/pokemon/${pokemon.slug}`}
                                        class="font-medium hover:underline"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        {pokemon.name}
                                      </a>
                                      <div class="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
                                        <span class="font-mono">
                                          #{String(pokemon.dexNumber).padStart(3, "0")}
                                        </span>
                                        <span>·</span>
                                        <div class="flex flex-wrap gap-1">
                                          <For each={pokemon.types}>
                                            {(type) => (
                                              <span
                                                class="border px-1.5 py-0 font-medium text-[10px] uppercase tracking-wide"
                                                style={{
                                                  "border-color": TYPE_COLORS[type] ?? "#888888",
                                                  color: TYPE_COLORS[type] ?? "#888888",
                                                }}
                                              >
                                                {titleCaseFromId(type)}
                                              </span>
                                            )}
                                          </For>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td class="px-4 py-3 align-top">
                                  <div class="flex flex-wrap gap-1">
                                    <For each={pokemon.behaviours}>
                                      {(behaviour) => (
                                        <span class="inline-flex items-center gap-1 border border-border bg-secondary/40 px-2 py-0.5 text-[11px]">
                                          <RideableCategoryIcon
                                            category={behaviour.category}
                                            class="h-3.5 w-3.5 text-muted-foreground"
                                          />
                                          <RideableClassIcon
                                            classId={behaviour.classId}
                                            class="h-3.5 w-3.5"
                                          />
                                          <span>{formatRideableCategory(behaviour.category)}</span>
                                          <span class="text-muted-foreground">/</span>
                                          <span>{titleCaseFromId(behaviour.classId)}</span>
                                        </span>
                                      )}
                                    </For>
                                  </div>
                                </td>

                                <td class="px-4 py-3 text-right align-top">
                                  <span class="font-mono text-base">{pokemon.seatCount}</span>
                                  <p class="text-muted-foreground text-xs">
                                    {pokemon.seatCount === 1 ? "seat" : "seats"}
                                  </p>
                                </td>
                              </tr>
                            )
                          }}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>

                <div class="border-border border-t px-4 py-2 font-mono text-muted-foreground text-xs uppercase tracking-wide">
                  Showing {filteredMons().length} of {dataSignal().length} rideable species
                </div>
              </section>
            </div>
          )}
        </Show>
      </Show>
    </div>
  )
}

function FilterChip(props: {
  label: string
  active: boolean
  onClick: () => void
  icon?: JSX.Element | null
  count?: number
}) {
  return (
    <button
      type="button"
      class={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors",
        props.active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground hover:text-foreground"
      )}
      onClick={props.onClick}
    >
      {props.icon}
      <span>{props.label}</span>
      <Show when={typeof props.count === "number"}>
        <span class="font-mono opacity-80">{props.count}</span>
      </Show>
    </button>
  )
}

function StatCell(props: { label: string; value: number }) {
  return (
    <div class="bg-card px-3 py-2">
      <p class="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        {props.label}
      </p>
      <p class="mt-0.5 font-mono text-lg">{props.value}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div class="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div class="h-8 w-8 animate-spin border-2 border-border border-t-foreground" />
      <p class="text-muted-foreground text-sm">Loading rideable data...</p>
    </div>
  )
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true
  }

  if (target instanceof HTMLSelectElement) {
    return true
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  return Boolean(target.closest("[contenteditable='true']"))
}
