import { cn } from "@/utils/cn"

type PokemonSpriteProps = {
  dexNumber: number
  name: string
  class?: string
  imageClass?: string
}

export function getPokemonSpriteUrl(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`
}

export function PokemonSprite(props: PokemonSpriteProps) {
  return (
    <div
      class={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-secondary/40",
        props.class
      )}
    >
      <img
        src={getPokemonSpriteUrl(props.dexNumber)}
        alt={props.name}
        class={cn("h-8 w-8 object-contain", props.imageClass)}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none"
        }}
      />
    </div>
  )
}
