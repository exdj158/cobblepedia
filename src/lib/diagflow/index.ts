export type DiagflowNode<TNodeData = unknown> = {
  id: string
  data: TNodeData
}

export type DiagflowEdge<TEdgeData = unknown> = {
  id: string
  from: string
  to: string
  data: TEdgeData
}

export type DiagflowLayoutOptions = {
  nodeWidth?: number
  nodeHeight?: number
  columnGap?: number
  rowGap?: number
  paddingX?: number
  paddingY?: number
  minHeight?: number
  portSpacing?: number
}

export type DiagflowPoint = {
  x: number
  y: number
}

export type DiagflowNodeLayout<TNodeData = unknown> = {
  id: string
  data: TNodeData
  x: number
  y: number
  width: number
  height: number
  column: number
  row: number
  center: DiagflowPoint
}

export type DiagflowEdgeLayout<TEdgeData = unknown> = {
  id: string
  from: string
  to: string
  data: TEdgeData
  start: DiagflowPoint
  end: DiagflowPoint
  label: DiagflowPoint
  path: string
}

export type DiagflowLayout<TNodeData = unknown, TEdgeData = unknown> = {
  width: number
  height: number
  nodes: DiagflowNodeLayout<TNodeData>[]
  edges: DiagflowEdgeLayout<TEdgeData>[]
}

const DEFAULT_LAYOUT_OPTIONS: Required<DiagflowLayoutOptions> = {
  nodeWidth: 172,
  nodeHeight: 88,
  columnGap: 104,
  rowGap: 34,
  paddingX: 24,
  paddingY: 20,
  minHeight: 176,
  portSpacing: 14,
}

export function buildDiagflowLayout<TNodeData, TEdgeData>(input: {
  nodes: DiagflowNode<TNodeData>[]
  edges: DiagflowEdge<TEdgeData>[]
  roots?: string[]
  options?: DiagflowLayoutOptions
}): DiagflowLayout<TNodeData, TEdgeData> {
  const options = {
    ...DEFAULT_LAYOUT_OPTIONS,
    ...(input.options ?? {}),
  }

  if (input.nodes.length === 0) {
    return {
      width: 0,
      height: 0,
      nodes: [],
      edges: [],
    }
  }

  const nodeById = new Map<string, DiagflowNode<TNodeData>>()
  for (const node of input.nodes) {
    nodeById.set(node.id, node)
  }

  const edges = input.edges.filter((edge) => nodeById.has(edge.from) && nodeById.has(edge.to))
  const outgoingByNode = buildEdgeMap(edges, "from")
  const incomingByNode = buildEdgeMap(edges, "to")

  const nodeOrder = new Map<string, number>()
  for (const [index, node] of input.nodes.entries()) {
    nodeOrder.set(node.id, index)
  }

  const roots = resolveRoots({
    nodes: input.nodes,
    explicitRoots: input.roots,
    incomingByNode,
    nodeOrder,
  })

  const depthByNode = computeNodeDepths({
    nodes: input.nodes,
    edges,
    roots,
    outgoingByNode,
    nodeOrder,
  })

  const columns = buildColumns({
    nodes: input.nodes,
    depthByNode,
    incomingByNode,
    outgoingByNode,
    nodeOrder,
  })

  const contentHeight = Math.max(
    options.minHeight,
    ...columns.map((column) =>
      column.length === 0
        ? 0
        : column.length * options.nodeHeight + (column.length - 1) * options.rowGap
    )
  )

  const width =
    options.paddingX * 2 +
    options.nodeWidth +
    Math.max(0, columns.length - 1) * (options.nodeWidth + options.columnGap)
  const height = options.paddingY * 2 + contentHeight

  const nodeLayouts: DiagflowNodeLayout<TNodeData>[] = []
  const nodeLayoutById = new Map<string, DiagflowNodeLayout<TNodeData>>()

  for (const [columnIndex, column] of columns.entries()) {
    const columnHeight =
      column.length === 0
        ? 0
        : column.length * options.nodeHeight + (column.length - 1) * options.rowGap
    const yOffset = options.paddingY + (contentHeight - columnHeight) / 2

    for (const [rowIndex, nodeId] of column.entries()) {
      const node = nodeById.get(nodeId)
      if (!node) {
        continue
      }

      const x = options.paddingX + columnIndex * (options.nodeWidth + options.columnGap)
      const y = yOffset + rowIndex * (options.nodeHeight + options.rowGap)

      const layoutNode: DiagflowNodeLayout<TNodeData> = {
        id: node.id,
        data: node.data,
        x,
        y,
        width: options.nodeWidth,
        height: options.nodeHeight,
        column: columnIndex,
        row: rowIndex,
        center: {
          x: x + options.nodeWidth / 2,
          y: y + options.nodeHeight / 2,
        },
      }

      nodeLayouts.push(layoutNode)
      nodeLayoutById.set(layoutNode.id, layoutNode)
    }
  }

  const edgeSlotById = assignEdgeSlots({ edges, incomingByNode, outgoingByNode, nodeLayoutById })

  const edgeLayouts: DiagflowEdgeLayout<TEdgeData>[] = []
  for (const edge of edges) {
    const fromNode = nodeLayoutById.get(edge.from)
    const toNode = nodeLayoutById.get(edge.to)
    if (!fromNode || !toNode) {
      continue
    }

    const slot = edgeSlotById.get(edge.id)
    const outIndex = slot?.outIndex ?? 0
    const outTotal = slot?.outTotal ?? 1
    const inIndex = slot?.inIndex ?? 0
    const inTotal = slot?.inTotal ?? 1

    const start: DiagflowPoint = {
      x: fromNode.x + fromNode.width,
      y: resolvePortY(fromNode, outIndex, outTotal, options.portSpacing),
    }
    const end: DiagflowPoint = {
      x: toNode.x,
      y: resolvePortY(toNode, inIndex, inTotal, options.portSpacing),
    }

    const route = buildCurveRoute(start, end, width, height)

    edgeLayouts.push({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      data: edge.data,
      start,
      end,
      label: route.label,
      path: route.path,
    })
  }

  return {
    width,
    height,
    nodes: nodeLayouts,
    edges: edgeLayouts,
  }
}

function buildEdgeMap<TEdgeData>(
  edges: DiagflowEdge<TEdgeData>[],
  key: "from" | "to"
): Map<string, DiagflowEdge<TEdgeData>[]> {
  const map = new Map<string, DiagflowEdge<TEdgeData>[]>()

  for (const edge of edges) {
    const value = edge[key]
    const existing = map.get(value)
    if (existing) {
      existing.push(edge)
      continue
    }
    map.set(value, [edge])
  }

  return map
}

function resolveRoots<TNodeData, TEdgeData>(params: {
  nodes: DiagflowNode<TNodeData>[]
  explicitRoots: string[] | undefined
  incomingByNode: Map<string, DiagflowEdge<TEdgeData>[]>
  nodeOrder: Map<string, number>
}): string[] {
  const explicit = (params.explicitRoots ?? []).filter((nodeId) => params.nodeOrder.has(nodeId))
  if (explicit.length > 0) {
    return uniqueInStableOrder(explicit)
  }

  const inferredRoots = params.nodes
    .filter((node) => (params.incomingByNode.get(node.id)?.length ?? 0) === 0)
    .map((node) => node.id)

  if (inferredRoots.length > 0) {
    return inferredRoots
  }

  return [params.nodes[0].id]
}

function uniqueInStableOrder(values: string[]): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []

  for (const value of values) {
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ordered.push(value)
  }

  return ordered
}

function computeNodeDepths<TNodeData, TEdgeData>(params: {
  nodes: DiagflowNode<TNodeData>[]
  edges: DiagflowEdge<TEdgeData>[]
  roots: string[]
  outgoingByNode: Map<string, DiagflowEdge<TEdgeData>[]>
  nodeOrder: Map<string, number>
}): Map<string, number> {
  const indegreeByNode = new Map<string, number>()
  for (const node of params.nodes) {
    indegreeByNode.set(node.id, 0)
  }
  for (const edge of params.edges) {
    indegreeByNode.set(edge.to, (indegreeByNode.get(edge.to) ?? 0) + 1)
  }

  const rootPriority = new Map<string, number>()
  for (const [index, rootId] of params.roots.entries()) {
    rootPriority.set(rootId, index)
  }

  const queue = params.nodes
    .map((node) => node.id)
    .filter((nodeId) => (indegreeByNode.get(nodeId) ?? 0) === 0)
    .sort((left, right) => compareNodePriority(left, right, rootPriority, params.nodeOrder))

  const topological: string[] = []
  const queued = new Set(queue)

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }

    topological.push(current)

    for (const edge of params.outgoingByNode.get(current) ?? []) {
      const nextInDegree = (indegreeByNode.get(edge.to) ?? 1) - 1
      indegreeByNode.set(edge.to, nextInDegree)
      if (nextInDegree === 0 && !queued.has(edge.to)) {
        queue.push(edge.to)
        queued.add(edge.to)
      }
    }

    queue.sort((left, right) => compareNodePriority(left, right, rootPriority, params.nodeOrder))
  }

  if (topological.length < params.nodes.length) {
    const seen = new Set(topological)
    const leftovers = params.nodes
      .map((node) => node.id)
      .filter((nodeId) => !seen.has(nodeId))
      .sort((left, right) => compareNodePriority(left, right, rootPriority, params.nodeOrder))
    topological.push(...leftovers)
  }

  const depthByNode = new Map<string, number>()
  for (const node of params.nodes) {
    depthByNode.set(node.id, 0)
  }

  for (const rootId of params.roots) {
    depthByNode.set(rootId, 0)
  }

  for (const nodeId of topological) {
    const currentDepth = depthByNode.get(nodeId) ?? 0
    for (const edge of params.outgoingByNode.get(nodeId) ?? []) {
      const nextDepth = currentDepth + 1
      depthByNode.set(edge.to, Math.max(depthByNode.get(edge.to) ?? 0, nextDepth))
    }
  }

  return depthByNode
}

function compareNodePriority(
  left: string,
  right: string,
  rootPriority: Map<string, number>,
  nodeOrder: Map<string, number>
): number {
  const leftRootOrder = rootPriority.get(left) ?? Number.POSITIVE_INFINITY
  const rightRootOrder = rootPriority.get(right) ?? Number.POSITIVE_INFINITY

  if (leftRootOrder !== rightRootOrder) {
    return leftRootOrder - rightRootOrder
  }

  return (nodeOrder.get(left) ?? 0) - (nodeOrder.get(right) ?? 0)
}

function buildColumns<TNodeData, TEdgeData>(params: {
  nodes: DiagflowNode<TNodeData>[]
  depthByNode: Map<string, number>
  incomingByNode: Map<string, DiagflowEdge<TEdgeData>[]>
  outgoingByNode: Map<string, DiagflowEdge<TEdgeData>[]>
  nodeOrder: Map<string, number>
}): string[][] {
  const depthGroups = new Map<number, string[]>()

  for (const node of params.nodes) {
    const depth = params.depthByNode.get(node.id) ?? 0
    const group = depthGroups.get(depth)
    if (group) {
      group.push(node.id)
      continue
    }
    depthGroups.set(depth, [node.id])
  }

  const orderedDepths = [...depthGroups.keys()].sort((left, right) => left - right)
  const columns = orderedDepths.map((depth) => depthGroups.get(depth) ?? [])

  const rowByNode = new Map<string, number>()
  for (const [columnIndex, column] of columns.entries()) {
    const sorted = [...column].sort((left, right) => {
      if (columnIndex === 0) {
        return (params.nodeOrder.get(left) ?? 0) - (params.nodeOrder.get(right) ?? 0)
      }

      const leftParentScore = getNeighborScore(
        left,
        params.incomingByNode,
        rowByNode,
        "from",
        params.nodeOrder
      )
      const rightParentScore = getNeighborScore(
        right,
        params.incomingByNode,
        rowByNode,
        "from",
        params.nodeOrder
      )

      if (leftParentScore.score !== rightParentScore.score) {
        return leftParentScore.score - rightParentScore.score
      }

      return leftParentScore.tieBreaker - rightParentScore.tieBreaker
    })

    columns[columnIndex] = sorted
    for (const [row, nodeId] of sorted.entries()) {
      rowByNode.set(nodeId, row)
    }
  }

  for (let columnIndex = columns.length - 2; columnIndex >= 0; columnIndex -= 1) {
    const sorted = [...columns[columnIndex]].sort((left, right) => {
      const leftChildScore = getNeighborScore(
        left,
        params.outgoingByNode,
        rowByNode,
        "to",
        params.nodeOrder
      )
      const rightChildScore = getNeighborScore(
        right,
        params.outgoingByNode,
        rowByNode,
        "to",
        params.nodeOrder
      )

      if (leftChildScore.score !== rightChildScore.score) {
        return leftChildScore.score - rightChildScore.score
      }

      return leftChildScore.tieBreaker - rightChildScore.tieBreaker
    })

    columns[columnIndex] = sorted
    for (const [row, nodeId] of sorted.entries()) {
      rowByNode.set(nodeId, row)
    }
  }

  return columns
}

function getNeighborScore<TEdgeData>(
  nodeId: string,
  edgeMap: Map<string, DiagflowEdge<TEdgeData>[]>,
  rowByNode: Map<string, number>,
  neighborKey: "from" | "to",
  nodeOrder: Map<string, number>
): { score: number; tieBreaker: number } {
  const edges = edgeMap.get(nodeId) ?? []
  if (edges.length === 0) {
    return {
      score: Number.POSITIVE_INFINITY,
      tieBreaker: nodeOrder.get(nodeId) ?? 0,
    }
  }

  const neighborRows = edges
    .map((edge) => rowByNode.get(edge[neighborKey]))
    .filter((row): row is number => typeof row === "number")

  if (neighborRows.length === 0) {
    return {
      score: Number.POSITIVE_INFINITY,
      tieBreaker: nodeOrder.get(nodeId) ?? 0,
    }
  }

  const total = neighborRows.reduce((sum, row) => sum + row, 0)
  return {
    score: total / neighborRows.length,
    tieBreaker: nodeOrder.get(nodeId) ?? 0,
  }
}

function assignEdgeSlots<TEdgeData, TNodeData>(params: {
  edges: DiagflowEdge<TEdgeData>[]
  incomingByNode: Map<string, DiagflowEdge<TEdgeData>[]>
  outgoingByNode: Map<string, DiagflowEdge<TEdgeData>[]>
  nodeLayoutById: Map<string, DiagflowNodeLayout<TNodeData>>
}): Map<
  string,
  {
    outIndex: number
    outTotal: number
    inIndex: number
    inTotal: number
  }
> {
  const slots = new Map<
    string,
    {
      outIndex: number
      outTotal: number
      inIndex: number
      inTotal: number
    }
  >()

  for (const edge of params.edges) {
    slots.set(edge.id, {
      outIndex: 0,
      outTotal: 1,
      inIndex: 0,
      inTotal: 1,
    })
  }

  for (const edges of params.outgoingByNode.values()) {
    const sorted = [...edges].sort((left, right) => {
      const leftTargetY = params.nodeLayoutById.get(left.to)?.center.y ?? 0
      const rightTargetY = params.nodeLayoutById.get(right.to)?.center.y ?? 0
      if (leftTargetY !== rightTargetY) {
        return leftTargetY - rightTargetY
      }

      return left.id.localeCompare(right.id)
    })

    const total = sorted.length
    for (const [index, edge] of sorted.entries()) {
      const existing = slots.get(edge.id)
      if (!existing) {
        continue
      }
      slots.set(edge.id, {
        ...existing,
        outIndex: index,
        outTotal: total,
      })
    }
  }

  for (const edges of params.incomingByNode.values()) {
    const sorted = [...edges].sort((left, right) => {
      const leftSourceY = params.nodeLayoutById.get(left.from)?.center.y ?? 0
      const rightSourceY = params.nodeLayoutById.get(right.from)?.center.y ?? 0
      if (leftSourceY !== rightSourceY) {
        return leftSourceY - rightSourceY
      }

      return left.id.localeCompare(right.id)
    })

    const total = sorted.length
    for (const [index, edge] of sorted.entries()) {
      const existing = slots.get(edge.id)
      if (!existing) {
        continue
      }

      slots.set(edge.id, {
        ...existing,
        inIndex: index,
        inTotal: total,
      })
    }
  }

  return slots
}

function resolvePortY(
  node: DiagflowNodeLayout<unknown>,
  index: number,
  total: number,
  maxSpacing: number
): number {
  if (total <= 1) {
    return node.center.y
  }

  const available = Math.max(8, node.height - 30)
  const spacing = Math.min(maxSpacing, available / Math.max(1, total - 1))
  const offset = (index - (total - 1) / 2) * spacing
  return node.center.y + offset
}

function buildCurveRoute(
  start: DiagflowPoint,
  end: DiagflowPoint,
  width: number,
  height: number
): {
  path: string
  label: DiagflowPoint
} {
  const deltaX = Math.max(1, end.x - start.x)
  const handle = clamp(deltaX * 0.42, 34, 120)

  const c1 = {
    x: start.x + handle,
    y: start.y,
  }
  const c2 = {
    x: end.x - handle,
    y: end.y,
  }

  const path = [
    "M",
    round(start.x),
    round(start.y),
    "C",
    round(c1.x),
    round(c1.y),
    round(c2.x),
    round(c2.y),
    round(end.x),
    round(end.y),
  ].join(" ")

  const baseLabel = cubicPoint(start, c1, c2, end, 0.5)
  const tangent = cubicTangent(start, c1, c2, end, 0.5)
  const normal = {
    x: -tangent.y,
    y: tangent.x,
  }
  const normalLength = Math.hypot(normal.x, normal.y)
  const normalizedNormal =
    normalLength < 0.001
      ? {
          x: 0,
          y: -1,
        }
      : {
          x: normal.x / normalLength,
          y: normal.y / normalLength,
        }

  const labelOffset = 0
  const label = {
    x: clamp(baseLabel.x + normalizedNormal.x * labelOffset, 10, width - 10),
    y: clamp(baseLabel.y + normalizedNormal.y * labelOffset, 10, height - 10),
  }

  return {
    path,
    label,
  }
}

function cubicPoint(
  p0: DiagflowPoint,
  p1: DiagflowPoint,
  p2: DiagflowPoint,
  p3: DiagflowPoint,
  t: number
): DiagflowPoint {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  }
}

function cubicTangent(
  p0: DiagflowPoint,
  p1: DiagflowPoint,
  p2: DiagflowPoint,
  p3: DiagflowPoint,
  t: number
): DiagflowPoint {
  const u = 1 - t

  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  }
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
