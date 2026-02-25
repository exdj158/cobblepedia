import { useQuery } from "@tanstack/solid-query"
import { createEffect, createMemo, For, Show } from "solid-js"
import { useMetadata } from "vike-metadata-solid"
import { usePageContext } from "vike-solid/usePageContext"
import { ItemSprite, normalizeItemId, parseItemId } from "@/components/item-sprite"
import { PokemonSprite } from "@/components/pokemon-sprite"
import type {
  ItemEntryRecord,
  ItemIndex,
  PokemonInteractionIndex,
  PokemonInteractionRecord,
} from "@/data/cobblemon-types"
import { loadItemIndex, loadPokemonInteractionIndex } from "@/data/data-loader"
import { canonicalId, titleCaseFromId } from "@/data/formatters"
import getTitle from "@/utils/get-title"

export default function Page() {
  const pageContext = usePageContext()
  const routeItemId = createMemo(() =>
    String(pageContext.routeParams.itemId ?? "")
      .trim()
      .toLowerCase()
  )

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

  const entry = createMemo(() => {
    const requestedItemId = routeItemId()
    const index = itemIndex()
    if (!requestedItemId || Object.keys(index).length === 0) {
      return null
    }

    return resolveItemEntry(index, requestedItemId)
  })

  const requiredInteractions = createMemo(() => {
    const requestedItemId = routeItemId()
    const index = interactionIndex()
    if (!requestedItemId || !index.byRequiredItem) {
      return [] as PokemonInteractionRecord[]
    }

    return dedupeInteractions(index.byRequiredItem[normalizeItemId(requestedItemId)] ?? [])
  })

  const grantedInteractions = createMemo(() => {
    const requestedItemId = routeItemId()
    const index = interactionIndex()
    if (!requestedItemId || !index.byGrantedItem) {
      return [] as PokemonInteractionRecord[]
    }

    return dedupeInteractions(index.byGrantedItem[normalizeItemId(requestedItemId)] ?? [])
  })

  createEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const resolvedEntry = entry()
    const requestedItemId = routeItemId()

    if (!resolvedEntry || !requestedItemId) {
      return
    }

    if (
      requestedItemId !== resolvedEntry.itemId &&
      normalizeItemId(requestedItemId) === resolvedEntry.itemId
    ) {
      window.history.replaceState(null, "", `/items/${encodeURIComponent(resolvedEntry.itemId)}`)
    }
  })

  useMetadata({
    title: getTitle("Item"),
  })

  return (
    <div class="mx-auto max-w-4xl px-3 py-8 sm:px-4 lg:px-8">
      <Show
        when={itemIndexQuery.isPending || interactionIndexQuery.isPending}
        fallback={
          <Show when={entry()} fallback={<NotFoundState itemId={routeItemId()} />}>
            {(entrySignal) => (
              <ItemDetailView
                entry={entrySignal()}
                itemIndex={itemIndex()}
                requiredInteractions={requiredInteractions()}
                grantedInteractions={grantedInteractions()}
              />
            )}
          </Show>
        }
      >
        <LoadingState />
      </Show>
    </div>
  )
}

function LoadingState() {
  return (
    <div class="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div class="h-8 w-8 animate-spin border-2 border-border border-t-foreground" />
      <p class="text-muted-foreground text-sm">Loading item data...</p>
    </div>
  )
}

function NotFoundState(props: { itemId: string }) {
  return (
    <div class="flex min-h-[40vh] flex-col items-center justify-center gap-4 border border-border bg-card p-6 text-center">
      <h1 class="font-semibold text-2xl">Item Not Found</h1>
      <p class="text-muted-foreground text-sm">
        No item entry exists for <span class="font-mono">{props.itemId || "this id"}</span>.
      </p>
      <a
        href="/items"
        class="border border-border bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/70"
      >
        Browse interaction items
      </a>
    </div>
  )
}

function ItemDetailView(props: {
  entry: ItemEntryRecord
  itemIndex: ItemIndex
  requiredInteractions: PokemonInteractionRecord[]
  grantedInteractions: PokemonInteractionRecord[]
}) {
  const resourceId = createMemo(() => getItemResourceId(props.entry))

  return (
    <div class="space-y-6">
      <header class="border border-border bg-card p-6">
        <div class="mb-3 flex items-start gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center bg-secondary/30">
            <ItemSprite
              itemId={resourceId()}
              name={props.entry.name}
              assetPath={props.entry.assetPath}
              class="h-12 w-12"
            />
          </div>
          <div class="min-w-0">
            <p class="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-wide">
              Item: {resourceId()}
            </p>
            <h1 class="font-semibold text-3xl tracking-tight sm:text-4xl">{props.entry.name}</h1>
            <p class="mt-4 text-muted-foreground text-sm leading-relaxed">
              {props.entry.description || "No item description is available."}
            </p>
          </div>
        </div>
      </header>

      <Show when={props.entry.descriptionLines.length > 1}>
        <section class="border border-border bg-card">
          <div class="border-border border-b p-4">
            <p class="font-mono text-muted-foreground text-xs uppercase tracking-wide">
              Description
            </p>
          </div>
          <div class="space-y-2 p-4">
            <For each={props.entry.descriptionLines}>
              {(line) => <p class="text-muted-foreground text-sm leading-relaxed">{line}</p>}
            </For>
          </div>
        </section>
      </Show>

      <Show when={props.requiredInteractions.length > 0}>
        <section class="border border-border bg-card">
          <div class="border-border border-b p-4">
            <h2 class="font-semibold">Use This Item On</h2>
            <p class="mt-1 text-muted-foreground text-sm">
              Pokemon that can be interacted with while holding {props.entry.name}.
            </p>
          </div>
          <div class="divide-y divide-border">
            <For each={props.requiredInteractions}>
              {(interaction) => (
                <div class="flex items-start gap-3 p-3">
                  <a
                    href={`/pokemon/${interaction.pokemonSlug}`}
                    class="flex shrink-0 items-center gap-2 hover:underline"
                  >
                    <PokemonSprite
                      dexNumber={interaction.dexNumber}
                      name={interaction.pokemonName}
                      class="h-7 w-7"
                      imageClass="h-5 w-5"
                    />
                    <span class="font-medium text-sm">{interaction.pokemonName}</span>
                    <span class="font-mono text-muted-foreground text-xs">
                      #{interaction.dexNumber}
                    </span>
                  </a>

                  <div class="flex flex-1 flex-wrap items-center gap-1.5">
                    <Show when={interaction.contextLabel}>
                      {(contextLabel) => (
                        <span class="border border-border bg-secondary px-1.5 py-0.5 text-muted-foreground text-xs">
                          {contextLabel()}
                        </span>
                      )}
                    </Show>
                    <Show when={formatInteractionCooldown(interaction)}>
                      {(cooldownLabel) => (
                        <span class="border border-border bg-secondary px-1.5 py-0.5 text-muted-foreground text-xs">
                          {cooldownLabel()}
                        </span>
                      )}
                    </Show>
                    <For each={interaction.drops}>
                      {(drop) => (
                        <a
                          href={toItemHref(drop.item)}
                          class="inline-flex items-center gap-1 border border-border bg-secondary/40 px-2 py-0.5 text-xs hover:bg-secondary/70"
                        >
                          <ItemSprite
                            itemId={drop.item}
                            name={formatItemName(props.itemIndex, drop.item)}
                            assetPath={resolveItemAssetPath(props.itemIndex, drop.item)}
                            class="h-3.5 w-3.5"
                          />
                          <span>{formatItemName(props.itemIndex, drop.item)}</span>
                          <Show when={drop.amount}>
                            {(amount) => (
                              <span class="font-mono text-muted-foreground">{amount()}</span>
                            )}
                          </Show>
                        </a>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>

      <Show when={props.grantedInteractions.length > 0}>
        <section class="border border-border bg-card">
          <div class="border-border border-b p-4">
            <h2 class="font-semibold">Pokemon That Grant This Item</h2>
            <p class="mt-1 text-muted-foreground text-sm">
              Interactions where this item is the result and the required tool for each Pokemon.
            </p>
          </div>
          <div class="divide-y divide-border">
            <For each={props.grantedInteractions}>
              {(interaction) => (
                <div class="flex items-start gap-3 p-3">
                  <a
                    href={`/pokemon/${interaction.pokemonSlug}`}
                    class="flex shrink-0 items-center gap-2 hover:underline"
                  >
                    <PokemonSprite
                      dexNumber={interaction.dexNumber}
                      name={interaction.pokemonName}
                      class="h-7 w-7"
                      imageClass="h-5 w-5"
                    />
                    <span class="font-medium text-sm">{interaction.pokemonName}</span>
                    <span class="font-mono text-muted-foreground text-xs">
                      #{interaction.dexNumber}
                    </span>
                  </a>

                  <div class="flex flex-1 flex-wrap items-center gap-1.5">
                    <Show
                      when={interaction.requiredItem}
                      fallback={
                        <span class="border border-border bg-secondary px-1.5 py-0.5 text-foreground text-xs">
                          Use {titleCaseFromId(parseItemId(interaction.grouping).path)}
                        </span>
                      }
                    >
                      {(requiredItem) => (
                        <a
                          href={toItemHref(requiredItem())}
                          class="inline-flex items-center gap-1 border border-border bg-secondary px-2 py-0.5 text-xs hover:bg-secondary/70"
                        >
                          <span class="text-muted-foreground">Use</span>
                          <ItemSprite
                            itemId={requiredItem()}
                            name={formatItemName(props.itemIndex, requiredItem())}
                            assetPath={resolveItemAssetPath(props.itemIndex, requiredItem())}
                            class="h-3.5 w-3.5"
                          />
                          <span>{formatItemName(props.itemIndex, requiredItem())}</span>
                        </a>
                      )}
                    </Show>
                    <Show when={interaction.contextLabel}>
                      {(contextLabel) => (
                        <span class="border border-border bg-secondary px-1.5 py-0.5 text-muted-foreground text-xs">
                          {contextLabel()}
                        </span>
                      )}
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>
    </div>
  )
}

function resolveItemEntry(itemIndex: ItemIndex, routeItemId: string): ItemEntryRecord | null {
  const normalizedRouteId = normalizeItemId(routeItemId)
  if (normalizedRouteId && itemIndex[normalizedRouteId]) {
    return itemIndex[normalizedRouteId]
  }

  const routeCanonicalId = canonicalId(routeItemId)
  if (!routeCanonicalId) {
    return null
  }

  for (const entry of Object.values(itemIndex)) {
    const resourceId = getItemResourceId(entry)
    if (
      canonicalId(entry.itemId) === routeCanonicalId ||
      canonicalId(entry.name) === routeCanonicalId ||
      canonicalId(resourceId) === routeCanonicalId
    ) {
      return entry
    }
  }

  return null
}

function dedupeInteractions(interactions: PokemonInteractionRecord[]): PokemonInteractionRecord[] {
  const byId = new Map<string, PokemonInteractionRecord>()
  for (const interaction of interactions) {
    byId.set(interaction.id, interaction)
  }

  return Array.from(byId.values()).sort((left, right) => {
    if (left.dexNumber !== right.dexNumber) {
      return left.dexNumber - right.dexNumber
    }

    return left.id.localeCompare(right.id)
  })
}

function getItemResourceId(entry: ItemEntryRecord): string {
  if (entry.resourceId) {
    return entry.resourceId
  }

  if (entry.namespace) {
    return `${entry.namespace}:${entry.itemId}`
  }

  return entry.itemId
}

function resolveItemByRef(itemIndex: ItemIndex, itemRef: string): ItemEntryRecord | null {
  const pathId = normalizeItemId(parseItemId(itemRef).path)
  return itemIndex[pathId] ?? null
}

function resolveItemAssetPath(itemIndex: ItemIndex, itemRef: string): string | null {
  return resolveItemByRef(itemIndex, itemRef)?.assetPath ?? null
}

function formatItemName(itemIndex: ItemIndex, itemRef: string): string {
  return resolveItemByRef(itemIndex, itemRef)?.name ?? titleCaseFromId(parseItemId(itemRef).path)
}

function formatInteractionCooldown(interaction: PokemonInteractionRecord): string | null {
  if (!interaction.cooldownSeconds || interaction.cooldownSeconds <= 0) {
    return null
  }

  if (interaction.cooldownSeconds % 60 === 0) {
    return `Cooldown ${interaction.cooldownSeconds / 60}m`
  }

  return `Cooldown ${interaction.cooldownSeconds}s`
}

function toItemHref(itemRef: string): string {
  return `/items/${encodeURIComponent(parseItemId(itemRef).path)}`
}
