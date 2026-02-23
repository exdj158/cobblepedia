import { canonicalId } from "./formatters"

const SHARD_FALLBACK_CHAR = "_"
const SHARD_CHAR_REGEX = /^[a-z0-9]$/u

export function getMoveLearnerShardId(moveId: string): string {
  const normalizedMoveId = canonicalId(moveId)
  const firstChar = normalizedMoveId[0] ?? SHARD_FALLBACK_CHAR
  const secondChar = normalizedMoveId[1] ?? SHARD_FALLBACK_CHAR

  return `${normalizeShardChar(firstChar)}${normalizeShardChar(secondChar)}`
}

function normalizeShardChar(value: string): string {
  const normalized = value.toLowerCase()
  return SHARD_CHAR_REGEX.test(normalized) ? normalized : SHARD_FALLBACK_CHAR
}
