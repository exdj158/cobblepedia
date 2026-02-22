import type { RideableBehaviourRecord, RideableSummaryRecord } from "./cobblemon-types"
import { titleCaseFromId } from "./formatters"

const CATEGORY_ORDER = ["LAND", "LIQUID", "AIR"]
const CLASS_ORDER = ["horse", "boat", "dolphin", "bird", "hover", "jet", "rocket", "submarine"]

export function parseRideableSummary(rawRiding: unknown): RideableSummaryRecord | null {
  if (!isRecord(rawRiding)) {
    return null
  }

  const seatCount = Array.isArray(rawRiding.seats) ? rawRiding.seats.length : 0
  if (seatCount <= 0) {
    return null
  }

  const behaviourEntries = isRecord(rawRiding.behaviours)
    ? Object.entries(rawRiding.behaviours)
    : []

  const behaviours: RideableBehaviourRecord[] = []
  const behaviourKeys = new Set<string>()

  for (const [rawCategory, rawBehaviour] of behaviourEntries) {
    if (!isRecord(rawBehaviour) || typeof rawBehaviour.key !== "string") {
      continue
    }

    const key = rawBehaviour.key.trim()
    if (!key) {
      continue
    }

    const category = rawCategory.trim().toUpperCase()
    if (!category) {
      continue
    }

    const classId = extractClassId(key)
    if (!classId) {
      continue
    }

    const dedupeKey = `${category}::${classId}::${key}`
    if (behaviourKeys.has(dedupeKey)) {
      continue
    }

    behaviourKeys.add(dedupeKey)
    behaviours.push({
      category,
      key,
      classId,
    })
  }

  if (behaviours.length === 0) {
    return null
  }

  const categories = dedupeAndSort(
    behaviours.map((behaviour) => behaviour.category),
    CATEGORY_ORDER
  )
  const classes = dedupeAndSort(
    behaviours.map((behaviour) => behaviour.classId),
    CLASS_ORDER
  )

  const sortedBehaviours = [...behaviours].sort((left, right) => {
    const categoryDiff = sortByOrder(left.category, right.category, CATEGORY_ORDER)
    if (categoryDiff !== 0) {
      return categoryDiff
    }

    return sortByOrder(left.classId, right.classId, CLASS_ORDER)
  })

  return {
    seatCount,
    categories,
    classes,
    behaviours: sortedBehaviours,
  }
}

export function parseRideableSummaryFromSpecies(
  rawSpecies: Record<string, unknown> | null | undefined
): RideableSummaryRecord | null {
  if (!rawSpecies) {
    return null
  }

  return parseRideableSummary(rawSpecies.riding)
}

export function formatRideableCategory(category: string): string {
  const normalized = category.trim().toUpperCase()
  if (normalized === "AIR") {
    return "Air"
  }

  if (normalized === "LAND") {
    return "Land"
  }

  if (normalized === "LIQUID") {
    return "Liquid"
  }

  return titleCaseFromId(category)
}

export function formatRideableClass(classId: string): string {
  return `${titleCaseFromId(classId)} Class`
}

function dedupeAndSort(values: string[], order: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => sortByOrder(left, right, order))
}

function sortByOrder(left: string, right: string, order: string[]): number {
  const leftIndex = order.indexOf(left)
  const rightIndex = order.indexOf(right)

  if (leftIndex !== -1 && rightIndex !== -1 && leftIndex !== rightIndex) {
    return leftIndex - rightIndex
  }

  if (leftIndex !== -1) {
    return -1
  }

  if (rightIndex !== -1) {
    return 1
  }

  return left.localeCompare(right)
}

function extractClassId(behaviourKey: string): string {
  const token = behaviourKey.split("/").at(-1) ?? behaviourKey
  return token.toLowerCase().replace(/[^a-z0-9_-]/g, "")
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
