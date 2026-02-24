import { createMemo } from "solid-js"
import { cn } from "@/utils/cn"

const COBBLEMON_ITEM_SPRITE_BASE_URL =
  "https://gitlab.com/cable-mc/cobblemon-assets/-/raw/master/items/evolution_items"
const MINECRAFT_ITEM_SPRITE_BASE_URL =
  "https://raw.githubusercontent.com/PixiGeko/Minecraft-default-assets/latest/assets/minecraft/textures/item"

type ItemSpriteProps = {
  itemId: string
  name: string
  assetPath?: string | null
  class?: string
}

export function parseItemId(itemId: string): { namespace: string | null; path: string } {
  const trimmed = itemId.trim().toLowerCase()
  const separatorIndex = trimmed.indexOf(":")

  if (separatorIndex < 0) {
    return {
      namespace: null,
      path: trimmed,
    }
  }

  return {
    namespace: trimmed.slice(0, separatorIndex) || null,
    path: trimmed.slice(separatorIndex + 1),
  }
}

export function normalizeItemId(itemId: string): string {
  return parseItemId(itemId)
    .path.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function getItemSpriteUrl(itemId: string): string {
  const parsed = parseItemId(itemId)
  const normalizedItemId = normalizeItemId(parsed.path)

  if (parsed.namespace === "minecraft") {
    return `${MINECRAFT_ITEM_SPRITE_BASE_URL}/${encodeURIComponent(normalizedItemId)}.png`
  }

  return `${COBBLEMON_ITEM_SPRITE_BASE_URL}/${encodeURIComponent(normalizedItemId)}.png`
}

export function getItemSpriteUrlFromPath(assetPath: string): string {
  return `https://gitlab.com/cable-mc/cobblemon-assets/-/raw/master/${assetPath}`
}

export function ItemSprite(props: ItemSpriteProps) {
  const spriteUrl = createMemo(() => {
    const path = props.assetPath?.trim().toLowerCase()
    if (path) {
      return getItemSpriteUrlFromPath(path)
    }

    return getItemSpriteUrl(props.itemId)
  })

  return (
    <img
      src={spriteUrl()}
      alt={props.name}
      class={cn("h-5 w-5 shrink-0 object-contain", props.class)}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = "none"
      }}
    />
  )
}
