import { Show } from "solid-js"
import { getPokemonOfficialArtworkUrl } from "@/lib/pokeapi-artwork"

export function PokemonArtworkSprite(props: { dexNumber: number; name: string; shiny?: boolean }) {
  const artworkUrl = () => getPokemonOfficialArtworkUrl(props.dexNumber, Boolean(props.shiny))

  return (
    <Show
      when={artworkUrl()}
      fallback={
        <div class="flex h-full w-full items-center justify-center font-mono text-muted-foreground text-xs">
          {props.name.slice(0, 1).toUpperCase()}
        </div>
      }
    >
      {(url) => (
        <img
          src={url()}
          alt={`${props.name} ${props.shiny ? "shiny" : "official"} artwork`}
          class="h-full w-full object-contain p-1"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      )}
    </Show>
  )
}
