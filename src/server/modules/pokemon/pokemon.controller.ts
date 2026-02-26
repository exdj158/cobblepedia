import { Hono } from "hono"
import type { PokemonDexNavItem, PokemonListItem } from "@/data/cobblemon-types"

let pokemonDexNavIndex: PokemonDexNavIndex | null = null
let indexPromise: Promise<PokemonDexNavIndex> | null = null

const generatedDataBasePath = (() => {
  const basePath = import.meta.env.BASE_URL ?? "/"
  const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath
  return `${normalizedBasePath}/data/generated`
})()

const GENERATED_JSON_FETCH_TIMEOUT_MS = 15000

type PokemonDexNeighborsResponse = {
  current: PokemonDexNavItem | null
  previous: PokemonDexNavItem | null
  next: PokemonDexNavItem | null
}

type PokemonDexNavIndex = {
  items: PokemonDexNavItem[]
  bySlug: Map<string, number>
  byDexNumber: Map<number, number>
}

type GeneratedJsonLoadContext = {
  requestUrl: string
  assetsBinding: unknown
}

type GeneratedJsonValidator = (value: unknown) => boolean

type AssetsBinding = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

async function loadPokemonDexNavIndex(
  context: GeneratedJsonLoadContext
): Promise<PokemonDexNavIndex> {
  if (pokemonDexNavIndex) {
    return pokemonDexNavIndex
  }

  if (indexPromise) {
    return indexPromise
  }

  indexPromise = (async () => {
    const pokemonDexNavArtifact = await loadGeneratedJson(
      "pokemon-dex-nav.json",
      context,
      (value) => Array.isArray(value)
    )
    const pokemonListArtifact = await loadGeneratedJson("pokemon-list.json", context, (value) =>
      Array.isArray(value)
    )

    const index = buildPokemonDexNavIndex(
      resolvePokemonDexNavItems(pokemonDexNavArtifact, pokemonListArtifact)
    )
    pokemonDexNavIndex = index
    return index
  })()

  return indexPromise
}

async function loadGeneratedJson(
  relativePath: string,
  context: GeneratedJsonLoadContext,
  validate: GeneratedJsonValidator = () => true
): Promise<unknown> {
  try {
    const assetsBinding = resolveAssetsBinding(context.assetsBinding)
    if (assetsBinding) {
      const jsonFromAssets = await loadGeneratedJsonFromAssets(
        relativePath,
        context.requestUrl,
        assetsBinding
      )
      if (jsonFromAssets !== null && validate(jsonFromAssets)) {
        return jsonFromAssets
      }
    }

    const jsonFromFilesystem = await readGeneratedJsonFromFilesystem(relativePath)
    return validate(jsonFromFilesystem) ? jsonFromFilesystem : null
  } catch {
    return null
  }
}

async function loadGeneratedJsonFromAssets(
  relativePath: string,
  requestUrl: string,
  assetsBinding: AssetsBinding
): Promise<unknown> {
  const assetsRequestUrl = new URL(`${generatedDataBasePath}/${relativePath}`, requestUrl)
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort()
  }, GENERATED_JSON_FETCH_TIMEOUT_MS)

  try {
    const response = await assetsBinding.fetch(
      new Request(assetsRequestUrl.toString(), {
        signal: controller.signal,
      })
    )
    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

async function readGeneratedJsonFromFilesystem(relativePath: string): Promise<unknown> {
  const fsPromisesSpecifier = "node:fs/promises"
  const pathSpecifier = "node:path"
  const urlSpecifier = "node:url"

  const [{ readFile }, pathModule, urlModule] = await Promise.all([
    import(/* @vite-ignore */ fsPromisesSpecifier) as Promise<typeof import("node:fs/promises")>,
    import(/* @vite-ignore */ pathSpecifier) as Promise<typeof import("node:path")>,
    import(/* @vite-ignore */ urlSpecifier) as Promise<typeof import("node:url")>,
  ])

  const roots = discoverServerDataRoots(pathModule, urlModule)
  const candidateBasePaths = buildGeneratedDataBasePaths(pathModule, roots)

  for (const basePath of candidateBasePaths) {
    const filePath = pathModule.join(basePath, relativePath)

    try {
      const source = await readFile(filePath, "utf8")
      return JSON.parse(source)
    } catch {}
  }

  return null
}

function discoverServerDataRoots(
  pathModule: typeof import("node:path"),
  urlModule: typeof import("node:url")
): string[] {
  const roots = new Set<string>()

  const pushRoot = (value: string | undefined | null) => {
    if (!value) {
      return
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    roots.add(trimmed)
  }

  pushRoot(process.cwd())
  pushRoot(process.env.PWD)
  pushRoot(process.env.INIT_CWD)
  pushRoot(typeof process.argv[1] === "string" ? pathModule.dirname(process.argv[1]) : null)

  try {
    pushRoot(pathModule.dirname(urlModule.fileURLToPath(import.meta.url)))
  } catch {}

  return Array.from(roots)
}

function buildGeneratedDataBasePaths(
  pathModule: typeof import("node:path"),
  roots: string[]
): string[] {
  const candidateBasePaths = new Set<string>()

  const addAncestorPaths = (root: string) => {
    let current = pathModule.resolve(root)

    for (let depth = 0; depth < 8; depth += 1) {
      candidateBasePaths.add(pathModule.join(current, "public", "data", "generated"))
      candidateBasePaths.add(pathModule.join(current, "dist", "client", "data", "generated"))
      candidateBasePaths.add(pathModule.join(current, "dist", "server", "data", "generated"))
      candidateBasePaths.add(pathModule.join(current, "data", "generated"))

      const parent = pathModule.dirname(current)
      if (parent === current) {
        break
      }

      current = parent
    }
  }

  for (const root of roots) {
    addAncestorPaths(root)
  }

  return Array.from(candidateBasePaths)
}

function resolveAssetsBinding(value: unknown): AssetsBinding | null {
  if (!isRecord(value) || typeof value.fetch !== "function") {
    return null
  }

  return value as AssetsBinding
}

export const pokemonController = new Hono().get("/dex-neighbors", async (c) => {
  const dexNumberRaw = c.req.query("dexNumber")
  const dexNumber = Number.parseInt(String(dexNumberRaw ?? ""), 10)
  const slug = String(c.req.query("slug") ?? "")
    .trim()
    .toLowerCase()

  if (!Number.isFinite(dexNumber) || dexNumber <= 0) {
    return c.json({ error: "Expected a numeric dexNumber query parameter." }, 400)
  }

  const navIndex = await loadPokemonDexNavIndex({
    requestUrl: c.req.url,
    assetsBinding: isRecord(c.env) ? c.env.ASSETS : null,
  })

  if (navIndex.items.length === 0) {
    return c.json({ error: "Pokemon dex navigation data is unavailable." }, 503)
  }

  const index = resolvePokemonDexIndex(navIndex, slug, dexNumber)
  c.header("cache-control", "public, max-age=7200") // 2 hrs
  return c.json(toNeighborsResponse(navIndex.items, index))
})

function buildPokemonDexNavIndex(items: PokemonDexNavItem[]): PokemonDexNavIndex {
  const bySlug = new Map<string, number>()
  const byDexNumber = new Map<number, number>()

  for (const [index, pokemon] of items.entries()) {
    if (!bySlug.has(pokemon.slug)) {
      bySlug.set(pokemon.slug, index)
    }

    if (!byDexNumber.has(pokemon.dexNumber)) {
      byDexNumber.set(pokemon.dexNumber, index)
    }
  }

  return {
    items,
    bySlug,
    byDexNumber,
  }
}

function resolvePokemonDexNavItems(
  pokemonDexNavRaw: unknown,
  pokemonListRaw: unknown
): PokemonDexNavItem[] {
  const fromDexNav = toPokemonDexNavItems(pokemonDexNavRaw)
  if (fromDexNav.length > 0) {
    return fromDexNav
  }

  const fromPokemonList = toPokemonListItems(pokemonListRaw).map((pokemon) => ({
    slug: pokemon.slug,
    name: pokemon.name,
    dexNumber: pokemon.dexNumber,
  }))

  return fromPokemonList
}

function resolvePokemonDexIndex(
  navIndex: PokemonDexNavIndex,
  slug: string,
  dexNumber: number
): number | null {
  if (slug) {
    const slugIndex = navIndex.bySlug.get(slug)
    if (slugIndex !== undefined) {
      return slugIndex
    }
  }

  const dexIndex = navIndex.byDexNumber.get(dexNumber)
  return dexIndex ?? null
}

function toNeighborsResponse(
  pokemonDexNav: PokemonDexNavItem[],
  index: number | null
): PokemonDexNeighborsResponse {
  if (index === null || index < 0 || index >= pokemonDexNav.length) {
    return {
      current: null,
      previous: null,
      next: null,
    }
  }

  return {
    current: pokemonDexNav[index] ?? null,
    previous: pokemonDexNav[index - 1] ?? null,
    next: pokemonDexNav[index + 1] ?? null,
  }
}

function toPokemonDexNavItems(value: unknown): PokemonDexNavItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => normalizePokemonDexNavItem(entry))
    .filter((entry): entry is PokemonDexNavItem => entry !== null)
}

function toPokemonListItems(value: unknown): PokemonListItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => normalizePokemonListItem(entry))
    .filter((entry): entry is PokemonListItem => entry !== null)
}

function normalizePokemonDexNavItem(value: unknown): PokemonDexNavItem | null {
  if (!isRecord(value)) {
    return null
  }

  const slug = normalizeNonEmptyString(value.slug)
  const name = normalizeNonEmptyString(value.name)
  const dexNumber = normalizePositiveInteger(value.dexNumber)

  if (!slug || !name || dexNumber === null) {
    return null
  }

  return {
    slug,
    name,
    dexNumber,
  }
}

function normalizePokemonListItem(value: unknown): PokemonListItem | null {
  if (!isRecord(value)) {
    return null
  }

  const slug = normalizeNonEmptyString(value.slug)
  const name = normalizeNonEmptyString(value.name)
  const dexNumber = normalizePositiveInteger(value.dexNumber)

  if (!slug || !name || dexNumber === null) {
    return null
  }

  return {
    slug,
    name,
    dexNumber,
    implemented: Boolean(value.implemented),
    types: Array.isArray(value.types)
      ? value.types.filter((type): type is string => typeof type === "string")
      : [],
    aliases: Array.isArray(value.aliases)
      ? value.aliases.filter((alias): alias is string => typeof alias === "string")
      : [],
    eggGroups: Array.isArray(value.eggGroups)
      ? value.eggGroups.filter((group): group is string => typeof group === "string")
      : [],
  }
}

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function normalizePositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  const normalized = Math.trunc(value)
  return normalized > 0 ? normalized : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
