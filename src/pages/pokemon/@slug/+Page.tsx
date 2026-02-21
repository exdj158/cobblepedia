import { createMemo, createResource, createSignal, For, Show } from "solid-js"
import { useMetadata } from "vike-metadata-solid"
import { usePageContext } from "vike-solid/usePageContext"
import type { MoveSourceType, PokemonDetailRecord } from "@/data/cobblemon-types"
import { loadPokemonDetail } from "@/data/data-loader"
import {
  formatConditionChips,
  formatEggGroup,
  formatMoveSource,
  titleCaseFromId,
} from "@/data/formatters"
import { cn } from "@/utils/cn"
import getTitle from "@/utils/get-title"

const PAGE_MOVE_TABS = ["all", "level", "egg", "tm", "tutor"] as const
type PageMoveTab = (typeof PAGE_MOVE_TABS)[number]

// Type color mapping for subtle accents
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

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] || "#888888"
}

export default function Page() {
  const pageContext = usePageContext()
  const slug = createMemo(() =>
    String(pageContext.routeParams.slug ?? "")
      .trim()
      .toLowerCase()
  )

  const [detail] = createResource(slug, async (nextSlug) => {
    if (!nextSlug) {
      return null
    }
    return loadPokemonDetail(nextSlug)
  })

  useMetadata({
    title: getTitle("Pokemon"),
  })

  return (
    <div class="min-h-screen bg-background">
      <Show when={!detail.loading} fallback={<LoadingState />}>
        <Show when={detail()} fallback={<NotFoundState />}>
          {(detailSignal) => <PokemonDetailView detail={detailSignal()} />}
        </Show>
      </Show>
    </div>
  )
}

function LoadingState() {
  return (
    <div class="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div class="h-8 w-8 animate-spin border-2 border-border border-t-foreground" />
      <p class="text-muted-foreground text-sm">Loading Pokemon data...</p>
    </div>
  )
}

function NotFoundState() {
  return (
    <div class="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div class="flex h-16 w-16 items-center justify-center border border-border bg-secondary font-mono text-2xl text-muted-foreground">
        ?
      </div>
      <h2 class="font-semibold text-xl">Pokemon Not Found</h2>
      <p class="text-muted-foreground text-sm">
        This Pokemon doesn't exist in the current data snapshot.
      </p>
    </div>
  )
}

function PokemonDetailView(props: { detail: PokemonDetailRecord }) {
  const detail = () => props.detail
  const primaryType = () => detail().types[0] || "normal"
  const typeColor = () => getTypeColor(primaryType())

  return (
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <header class="relative mb-8 overflow-hidden border border-border bg-card">
        <div class="flex items-start justify-between p-6 sm:p-8">
          <div class="flex flex-1 flex-col gap-4">
            <span class="font-mono text-muted-foreground text-sm">
              #{String(detail().dexNumber).padStart(3, "0")}
            </span>

            <h1 class="font-semibold text-4xl tracking-tight sm:text-5xl">{detail().name}</h1>

            <div class="flex flex-wrap gap-2">
              <For each={detail().types}>
                {(type) => (
                  <span
                    class="border px-3 py-1 font-medium text-xs uppercase tracking-wider"
                    style={{
                      "border-color": getTypeColor(type),
                      color: getTypeColor(type),
                    }}
                  >
                    {titleCaseFromId(type)}
                  </span>
                )}
              </For>
            </div>
          </div>

          <div class="hidden h-24 w-24 items-center justify-center border border-border bg-secondary sm:flex">
            <span class="font-mono text-2xl text-muted-foreground">{detail().name[0]}</span>
          </div>
        </div>

        {/* Type accent line */}
        <div class="h-1 w-full" style={{ background: typeColor() }} />
      </header>

      {/* Main Content Grid */}
      <div class="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Stats & Core Info */}
        <div class="space-y-6">
          {/* Base Stats */}
          <section class="border border-border bg-card">
            <div class="flex items-center gap-2 border-border border-b bg-secondary px-4 py-3">
              <span class="text-muted-foreground">◈</span>
              <h2 class="font-semibold">Base Stats</h2>
            </div>
            <div class="p-4">
              <For each={Object.entries(detail().baseStats)}>
                {([stat, value]) => (
                  <div class="mb-3 last:mb-0">
                    <div class="mb-1 flex items-center justify-between text-sm">
                      <span class="text-muted-foreground">{formatStatName(stat)}</span>
                      <span class="font-medium font-mono">{value}</span>
                    </div>
                    <div class="h-2 w-full bg-secondary">
                      <div
                        class="h-full bg-foreground transition-all duration-500"
                        style={{ width: `${Math.min((value / 255) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </For>
            </div>
          </section>

          {/* Abilities */}
          <section class="border border-border bg-card">
            <div class="flex items-center gap-2 border-border border-b bg-secondary px-4 py-3">
              <span class="text-muted-foreground">⚡</span>
              <h2 class="font-semibold">Abilities</h2>
            </div>
            <div class="divide-y divide-border">
              <For each={detail().abilities}>
                {(ability) => (
                  <div class="flex items-center justify-between px-4 py-3">
                    <span>{ability.label}</span>
                    {ability.hidden && (
                      <span class="border border-border bg-secondary px-2 py-0.5 text-muted-foreground text-xs">
                        Hidden
                      </span>
                    )}
                  </div>
                )}
              </For>
            </div>
          </section>

          {/* Breeding */}
          <section class="border border-border bg-card">
            <div class="flex items-center gap-2 border-border border-b bg-secondary px-4 py-3">
              <span class="text-muted-foreground">♦</span>
              <h2 class="font-semibold">Breeding</h2>
            </div>
            <div class="grid grid-cols-2 gap-px bg-border">
              <div class="bg-card p-4">
                <span class="mb-1 block font-mono text-muted-foreground text-xs uppercase">
                  Egg Groups
                </span>
                <div class="flex flex-wrap gap-1">
                  <For each={detail().eggGroups}>
                    {(group) => <span class="text-sm">{formatEggGroup(group)}</span>}
                  </For>
                </div>
              </div>
              <div class="bg-card p-4">
                <span class="mb-1 block font-mono text-muted-foreground text-xs uppercase">
                  Egg Cycles
                </span>
                <span class="font-mono text-lg">{detail().eggCycles ?? "—"}</span>
              </div>
              <div class="bg-card p-4">
                <span class="mb-1 block font-mono text-muted-foreground text-xs uppercase">
                  Base Friendship
                </span>
                <span class="font-mono text-lg">{detail().baseFriendship ?? "—"}</span>
              </div>
              <div class="bg-card p-4">
                <span class="mb-1 block font-mono text-muted-foreground text-xs uppercase">
                  Catch Rate
                </span>
                <span class="font-mono text-lg">{detail().catchRate ?? "—"}</span>
              </div>
              <div class="col-span-2 bg-card p-4">
                <span class="mb-1 block font-mono text-muted-foreground text-xs uppercase">
                  Dimensions
                </span>
                <span class="font-mono text-lg">
                  {detail().height ?? "—"} × {detail().weight ?? "—"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Moves, Spawns, Evolution */}
        <div class="space-y-6">
          <MovesSection moves={detail().moves} />

          {/* Spawn Locations */}
          <section class="border border-border bg-card">
            <div class="flex items-center gap-2 border-border border-b bg-secondary px-4 py-3">
              <span class="text-muted-foreground">⌖</span>
              <h2 class="font-semibold">Spawn Locations</h2>
            </div>
            <Show
              when={detail().spawnEntries.length > 0}
              fallback={
                <p class="p-4 text-muted-foreground text-sm">
                  No spawn data available for this species.
                </p>
              }
            >
              <div class="divide-y divide-border">
                <For each={detail().spawnEntries}>
                  {(entry) => {
                    const chips = formatConditionChips(entry.condition)
                    return (
                      <div class="p-4">
                        <div class="mb-2 flex items-center justify-between">
                          <span class="font-medium">{titleCaseFromId(entry.bucket)}</span>
                          <div class="flex items-center gap-2 text-muted-foreground text-sm">
                            <span>{entry.levelText ?? "—"}</span>
                            <span>·</span>
                            <span>{titleCaseFromId(entry.spawnablePositionType)}</span>
                          </div>
                        </div>
                        <Show when={chips.length > 0}>
                          <div class="mb-2 flex flex-wrap gap-1">
                            <For each={chips.slice(0, 4)}>
                              {(chip) => (
                                <span class="border border-border bg-secondary px-2 py-0.5 text-xs">
                                  {chip}
                                </span>
                              )}
                            </For>
                          </div>
                        </Show>
                        <Show when={entry.weightMultipliers.length > 0}>
                          <div class="flex flex-wrap gap-2 text-xs">
                            <For each={entry.weightMultipliers.slice(0, 2)}>
                              {(multiplier) => {
                                const conditionChips = formatConditionChips(multiplier.condition)
                                return (
                                  <span class="text-muted-foreground">
                                    <span class="font-mono text-foreground">
                                      {multiplier.multiplier}×
                                    </span>
                                    {conditionChips.length > 0 && (
                                      <span> ({conditionChips.join(", ")})</span>
                                    )}
                                  </span>
                                )
                              }}
                            </For>
                          </div>
                        </Show>
                      </div>
                    )
                  }}
                </For>
              </div>
            </Show>
          </section>

          {/* Evolution Family */}
          <section class="border border-border bg-card">
            <div class="flex items-center gap-2 border-border border-b bg-secondary px-4 py-3">
              <span class="text-muted-foreground">⟿</span>
              <h2 class="font-semibold">Evolution Family</h2>
            </div>
            <div class="p-4">
              <div class="mb-4 flex flex-wrap gap-2">
                <For each={detail().evolutionFamily.members}>
                  {(member) => (
                    <a
                      href={`/pokemon/${member.slug}`}
                      class={cn(
                        "border px-3 py-1 text-sm transition-colors",
                        member.slug === detail().slug
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-secondary hover:border-muted-foreground"
                      )}
                    >
                      {member.name}
                    </a>
                  )}
                </For>
              </div>
              <Show when={detail().evolutionFamily.edges.length > 0}>
                <div class="space-y-2">
                  <For each={detail().evolutionFamily.edges}>
                    {(edge) => (
                      <div class="flex items-center justify-between border-border border-b pb-2 last:border-0 last:pb-0">
                        <div class="flex items-center gap-2 text-sm">
                          <span>{titleCaseFromId(edge.fromSlug)}</span>
                          <span class="text-muted-foreground">→</span>
                          <span>{titleCaseFromId(edge.toSlug)}</span>
                        </div>
                        <div class="text-right">
                          <span class="text-muted-foreground text-sm">
                            {titleCaseFromId(edge.method)}
                          </span>
                          <Show when={edge.requirementText.length > 0}>
                            <div class="mt-1 flex flex-wrap justify-end gap-1">
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
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function MovesSection(props: { moves: PokemonDetailRecord["moves"] }) {
  const [activeTab, setActiveTab] = createSignal<PageMoveTab>("all")
  const [searchQuery, setSearchQuery] = createSignal("")

  const counts = createMemo(() => ({
    all: props.moves.length,
    level: props.moves.filter((m) => m.sourceType === "level").length,
    egg: props.moves.filter((m) => m.sourceType === "egg").length,
    tm: props.moves.filter((m) => m.sourceType === "tm").length,
    tutor: props.moves.filter((m) => m.sourceType === "tutor").length,
  }))

  const filteredMoves = createMemo(() => {
    const query = searchQuery().toLowerCase().trim()
    const tab = activeTab()

    return props.moves.filter((move) => {
      if (tab !== "all" && move.sourceType !== tab) return false
      if (!query) return true
      return (
        move.moveName.toLowerCase().includes(query) || move.moveId.toLowerCase().includes(query)
      )
    })
  })

  return (
    <section class="border border-border bg-card">
      <div class="flex items-center justify-between border-border border-b bg-secondary px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">✦</span>
          <h2 class="font-semibold">Moveset</h2>
        </div>
        <span class="font-mono text-muted-foreground text-xs">{counts().all} total</span>
      </div>

      <div class="border-border border-b p-4">
        <div class="mb-3 flex flex-wrap gap-1">
          <For each={PAGE_MOVE_TABS}>
            {(tab) => (
              <button
                type="button"
                role="tab"
                class={cn(
                  "border px-3 py-1.5 text-xs transition-colors",
                  activeTab() === tab
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-secondary hover:border-muted-foreground"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "all" ? "All" : titleCaseFromId(tab)}
                <span class="ml-1 font-mono opacity-60">{counts()[tab]}</span>
              </button>
            )}
          </For>
        </div>

        <input
          type="text"
          class="w-full border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
          placeholder="Filter moves..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </div>

      <div class="max-h-[400px] overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-secondary">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Move</th>
              <th class="px-4 py-2 text-right font-medium text-muted-foreground">Source</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <For each={filteredMoves().slice(0, 50)}>
              {(move) => (
                <tr class="hover:bg-secondary/50">
                  <td class="px-4 py-2.5">{move.moveName}</td>
                  <td class="px-4 py-2.5 text-right">
                    <SourceBadge type={move.sourceType} value={move.sourceValue} />
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

      <Show when={filteredMoves().length > 50}>
        <div class="border-border border-t px-4 py-2 text-center text-muted-foreground text-xs">
          +{filteredMoves().length - 50} more moves
        </div>
      </Show>
    </section>
  )
}

function SourceBadge(props: { type: MoveSourceType; value: number | null }) {
  const colors: Record<string, string> = {
    level: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    egg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    tm: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    tutor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  }

  return (
    <span
      class={cn("border px-2 py-0.5 text-xs", colors[props.type] || "border-border bg-secondary")}
    >
      {formatMoveSource(props.type, props.value)}
    </span>
  )
}

function formatStatName(stat: string): string {
  const names: Record<string, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    special_attack: "Sp. Attack",
    special_defense: "Sp. Defense",
    speed: "Speed",
  }
  return names[stat] || titleCaseFromId(stat)
}
