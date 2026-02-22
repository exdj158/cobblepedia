import { createMemo, For, Show } from "solid-js"
import type {
  EvolutionFamilyEdgeRecord,
  EvolutionFamilyMemberRecord,
  EvolutionFamilyRecord,
} from "@/data/cobblemon-types"
import { titleCaseFromId } from "@/data/formatters"
import { buildDiagflowLayout, type DiagflowEdge, type DiagflowNode } from "@/lib/diagflow"
import { cn } from "@/utils/cn"
import { PokemonSprite } from "./pokemon-sprite"

type EvolutionFamilyFlowProps = {
  family: EvolutionFamilyRecord
  activeSlug: string
}

type EvolutionFlowNode = DiagflowNode<EvolutionFamilyMemberRecord>
type EvolutionFlowEdge = DiagflowEdge<EvolutionFamilyEdgeRecord>

function formatMethodLabel(method: string): string {
  const map: Record<string, string> = {
    level_up: "Lvl",
    trade: "Trade",
    stone: "Stone",
    item_interact: "Use Item",
    block_click: "Click Block",
    use_move: "Use Move",
    defeat: "Defeat",
    friendship: "Friendship",
    biome: "Biome",
    weather: "Weather",
    party: "Party",
    advancement: "Advancement",
    function: "Function",
  }

  const normalized = method.toLowerCase().replace(/[-_]/g, "_")
  return map[normalized] ?? titleCaseFromId(method)
}

export function EvolutionFamilyFlow(props: EvolutionFamilyFlowProps) {
  const nodes = createMemo<EvolutionFlowNode[]>(() =>
    props.family.members.map((member) => ({
      id: member.slug,
      data: member,
    }))
  )

  const edges = createMemo<EvolutionFlowEdge[]>(() =>
    props.family.edges.map((edge, index) => ({
      id: `${edge.fromSlug}-${edge.toSlug}-${index}`,
      from: edge.fromSlug,
      to: edge.toSlug,
      data: edge,
    }))
  )

  const maxLabelWidth = createMemo(() => {
    let maxWidth = 180
    for (const edge of props.family.edges) {
      const method = formatMethodLabel(edge.method)
      const reqs = edge.requirementText.join(" ")
      const text = `${method} ${reqs}`.trim()
      const estimatedWidth = text.length * 6.5 + 48
      maxWidth = Math.max(maxWidth, estimatedWidth)
    }
    return maxWidth
  })

  const layout = createMemo(() =>
    buildDiagflowLayout({
      nodes: nodes(),
      edges: edges(),
      roots: props.family.roots,
      options: {
        nodeWidth: 186,
        nodeHeight: 92,
        columnGap: Math.max(200, maxLabelWidth() + 40),
        rowGap: 46,
        minHeight: 188,
      },
    })
  )

  return (
    <div>
      <div class="overflow-x-auto pb-1">
        <div
          class="relative mx-auto min-w-fit"
          style={{
            width: `${layout().width}px`,
            height: `${layout().height}px`,
          }}
        >
          <svg
            class="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${layout().width} ${layout().height}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <For each={layout().edges}>
              {(edge) => {
                const isActiveEdge = edge.from === props.activeSlug || edge.to === props.activeSlug

                return (
                  <g>
                    <path
                      d={edge.path}
                      class={cn(
                        "fill-none stroke-border/70",
                        isActiveEdge ? "stroke-foreground/70" : "stroke-border/70"
                      )}
                      stroke-width={2.5}
                      stroke-linecap="round"
                    />
                    <circle
                      cx={edge.start.x}
                      cy={edge.start.y}
                      r={1.8}
                      class={cn(
                        "fill-border/75",
                        isActiveEdge ? "fill-foreground/70" : "fill-border/75"
                      )}
                    />
                    <circle
                      cx={edge.end.x}
                      cy={edge.end.y}
                      r={2.1}
                      class={cn(
                        "fill-border/75",
                        isActiveEdge ? "fill-foreground/75" : "fill-border/75"
                      )}
                    />
                  </g>
                )
              }}
            </For>
          </svg>

          <For each={layout().edges}>
            {(edge) => {
              const isActiveEdge = edge.from === props.activeSlug || edge.to === props.activeSlug
              const requirementSummary = summarizeRequirements(edge.data.requirementText)

              return (
                <div
                  class="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${edge.label.x}px`,
                    top: `${edge.label.y}px`,
                  }}
                >
                  <div
                    class={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5",
                      isActiveEdge
                        ? "border-foreground/30 bg-background"
                        : "border-border/60 bg-background/90"
                    )}
                    title={edge.data.requirementText.join(", ") || undefined}
                  >
                    <span class="whitespace-nowrap font-medium text-[10px] leading-none">
                      {formatMethodLabel(edge.data.method)}
                    </span>
                    <Show when={requirementSummary}>
                      <span class="h-3 w-px bg-border/60" />
                      <span class="whitespace-nowrap text-[10px] text-muted-foreground leading-none">
                        {requirementSummary}
                      </span>
                    </Show>
                  </div>
                </div>
              )
            }}
          </For>

          <For each={layout().nodes}>
            {(node) => {
              const isActiveNode = node.id === props.activeSlug

              return (
                <a
                  href={`/pokemon/${node.id}`}
                  class={cn(
                    "group absolute z-20 flex items-center gap-3 border px-3 py-2 transition-all",
                    isActiveNode
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card hover:border-muted-foreground hover:bg-secondary/25"
                  )}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  aria-current={isActiveNode ? "page" : undefined}
                >
                  <PokemonSprite
                    dexNumber={node.data.dexNumber}
                    name={node.data.name}
                    class={cn(
                      "h-10 w-10",
                      isActiveNode
                        ? "border-background/40 bg-background/20"
                        : "border-border bg-secondary/40"
                    )}
                    imageClass="h-8 w-8"
                  />

                  <div class="min-w-0">
                    <p class="truncate font-medium text-sm leading-tight">{node.data.name}</p>
                    <p
                      class={cn(
                        "mt-1 font-mono text-[10px] uppercase tracking-wider",
                        isActiveNode ? "text-background/80" : "text-muted-foreground"
                      )}
                    >
                      #{String(node.data.dexNumber).padStart(4, "0")}
                    </p>
                  </div>
                </a>
              )
            }}
          </For>
        </div>
      </div>
    </div>
  )
}

function summarizeRequirements(requirements: string[]): string | null {
  if (requirements.length === 0) {
    return null
  }

  if (requirements.length === 1) {
    return requirements[0]
  }

  return `${requirements[0]} +${requirements.length - 1}`
}
