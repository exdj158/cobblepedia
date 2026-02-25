import { useQuery } from "@tanstack/solid-query"
import { createMemo, For, Show } from "solid-js"
import { useMetadata } from "vike-metadata-solid"
import { ItemSprite } from "@/components/item-sprite"
import type { ItemEntryRecord, ItemIndex, PokemonInteractionIndex } from "@/data/cobblemon-types"
import { loadItemIndex, loadPokemonInteractionIndex } from "@/data/data-loader"
import getTitle from "@/utils/get-title"

type InteractionItemRow = {
  itemId: string
  entry: ItemEntryRecord
  requiredCount: number
  grantedCount: number
}

export default function Page() {
  const itemIndexQuery = useQuery(() => ({
    queryKey: ["item-index"],
    queryFn: loadItemIndex,
  }))

  const interactionIndexQuery = useQuery(() => ({
    queryKey: ["pokemon-interaction-index"],
    queryFn: loadPokemonInteractionIndex,
  }))

  const itemIndex = createMemo(() => itemIndexQuery.data ?? ({} as ItemIndex))
  const interactionIndex = createMemo(
    () => interactionIndexQuery.data ?? ({} as PokemonInteractionIndex)
  )

  const interactionItems = createMemo(() => {
    const index = interactionIndex()
    const itemIdx = itemIndex()

    if (!index.byRequiredItem || !index.byGrantedItem || Object.keys(itemIdx).length === 0) {
      return []
    }

    const itemIds = new Set<string>()
    for (const itemId of Object.keys(index.byRequiredItem)) {
      itemIds.add(itemId)
    }

    for (const itemId of Object.keys(index.byGrantedItem)) {
      itemIds.add(itemId)
    }

    const rows: InteractionItemRow[] = []
    for (const itemId of itemIds) {
      const entry = itemIdx[itemId]
      if (!entry) {
        continue
      }

      if (entry.namespace !== "minecraft") {
        continue
      }

      rows.push({
        itemId,
        entry,
        requiredCount: index.byRequiredItem[itemId]?.length ?? 0,
        grantedCount: index.byGrantedItem[itemId]?.length ?? 0,
      })
    }

    return rows.sort((left, right) => left.entry.name.localeCompare(right.entry.name))
  })

  useMetadata({
    title: getTitle("Items"),
  })

  return (
    <div class="mx-auto max-w-5xl px-3 py-8 sm:px-4 lg:px-8">
      <header class="mb-6 border border-border bg-card p-6">
        <h1 class="font-semibold text-3xl tracking-tight sm:text-4xl">
          Minecraft Interaction Items
        </h1>
        <p class="mt-3 max-w-3xl text-muted-foreground text-sm">
          Items used by Cobblemon's Pokemon interaction system and the Pokemon linked to each one.
        </p>
      </header>

      <Show
        when={!itemIndexQuery.isPending && !interactionIndexQuery.isPending}
        fallback={
          <div class="flex min-h-[40vh] flex-col items-center justify-center gap-4">
            <div class="h-8 w-8 animate-spin border-2 border-border border-t-foreground" />
            <p class="text-muted-foreground text-sm">Loading items...</p>
          </div>
        }
      >
        <Show
          when={interactionItems().length > 0}
          fallback={
            <div class="border border-border bg-card p-6 text-center text-muted-foreground text-sm">
              No interaction item data is available.
            </div>
          }
        >
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <For each={interactionItems()}>
              {(row) => (
                <a
                  href={`/items/${encodeURIComponent(row.itemId)}`}
                  class="group border border-border bg-card p-4 transition-colors hover:border-muted-foreground hover:bg-secondary/30"
                >
                  <div class="mb-3 flex items-center gap-3">
                    <ItemSprite
                      itemId={row.entry.resourceId ?? `minecraft:${row.entry.itemId}`}
                      name={row.entry.name}
                      assetPath={row.entry.assetPath}
                      class="h-8 w-8"
                    />
                    <div class="min-w-0">
                      <p class="truncate font-medium text-sm">{row.entry.name}</p>
                      <p class="font-mono text-[11px] text-muted-foreground">
                        minecraft:{row.itemId}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-1.5 text-xs">
                    <Show when={row.requiredCount > 0}>
                      <span class="border border-border bg-secondary px-2 py-0.5 text-muted-foreground">
                        Tool for {row.requiredCount}
                      </span>
                    </Show>
                    <Show when={row.grantedCount > 0}>
                      <span class="border border-border bg-secondary px-2 py-0.5 text-muted-foreground">
                        Granted by {row.grantedCount}
                      </span>
                    </Show>
                  </div>
                </a>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}
