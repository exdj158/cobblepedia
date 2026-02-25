import { createMemo, createResource } from "solid-js"
import { resolvePokemonArtworkUrls } from "@/lib/pokeapi-artwork"
import { cn } from "@/utils/cn"

type PokemonSpriteProps = {
  dexNumber: number
  slug?: string
  formSlug?: string | null
  formName?: string | null
  name: string
  class?: string
  imageClass?: string
}

export function getPokemonSpriteUrl(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`
}

export function PokemonSprite(props: PokemonSpriteProps) {
  const [resolvedArtwork] = createResource(
    () => {
      if (!props.slug || (!props.formSlug && !props.formName)) {
        return null
      }

      return {
        dexNumber: props.dexNumber,
        baseSlug: props.slug,
        formSlug: props.formSlug ?? null,
        formName: props.formName ?? null,
        shiny: false,
      }
    },
    async (params) => {
      if (!params) {
        return null
      }

      return resolvePokemonArtworkUrls(params)
    }
  )

  const spriteDexNumber = createMemo(() => {
    const resolved = resolvedArtwork()
    if (resolved?.matchedForm && resolved.pokemonId > 0) {
      return resolved.pokemonId
    }

    return props.dexNumber
  })

  const spriteUrl = createMemo(() => getPokemonSpriteUrl(spriteDexNumber()))

  return (
    <div
      class={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-secondary/40",
        props.class
      )}
    >
      <img
        src={spriteUrl()}
        alt={props.name}
        class={cn("pixelart h-8 w-8 object-contain", props.imageClass)}
        loading="lazy"
        onError={(event) => {
          const fallback = getPokemonSpriteUrl(props.dexNumber)
          if (event.currentTarget.src !== fallback && spriteDexNumber() !== props.dexNumber) {
            event.currentTarget.src = fallback
            return
          }

          event.currentTarget.style.display = "none"
        }}
      />
    </div>
  )
}
