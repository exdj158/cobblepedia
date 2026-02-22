const OFFICIAL_ARTWORK_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork"

export function getPokemonOfficialArtworkUrl(
  dexNumber: number,
  shiny = false,
  _formSlug: string | null = null
): string | null {
  if (!Number.isFinite(dexNumber) || dexNumber <= 0) {
    return null
  }

  const normalizedDexNumber = Math.trunc(dexNumber)

  // Note: PokeAPI doesn't have form-specific official artwork for most forms
  // (megas, regional variants, etc.). We fall back to base form artwork.
  const shinyPath = shiny ? "shiny/" : ""
  return `${OFFICIAL_ARTWORK_ROOT}/${shinyPath}${normalizedDexNumber}.png`
}
