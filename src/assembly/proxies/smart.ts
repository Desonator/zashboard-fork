import { driver } from '@/assembly/driver'
import { activeUuid } from '@/store/setup'
import type { NodeRank } from '@/types'
import { ref } from 'vue'

export const smartWeightsMap = ref<Record<string, Record<string, NodeRank>>>({})
export const smartOrderMap = ref<Record<string, Record<string, number>>>({})

export type SmartWeightHistoryEntry = {
  groupName: string
  nodeName: string
  time: number
  rank: string
  weight: number
}

const SMART_WEIGHT_HISTORY_PREFIX = 'cache/smart-weight-history:'
const SMART_WEIGHT_HISTORY_MAX_ENTRIES = 10_000
const SMART_WEIGHT_HISTORY_MAX_AGE = 90 * 24 * 60 * 60 * 1000

export const smartWeightHistory = ref<SmartWeightHistoryEntry[]>([])
let historyBackendId = ''
let lastWeightByNode = new Map<string, SmartWeightHistoryEntry>()

const historyNodeKey = (groupName: string, nodeName: string) => `${groupName}\u0000${nodeName}`

const isSmartWeightHistoryEntry = (entry: unknown): entry is SmartWeightHistoryEntry => {
  if (!entry || typeof entry !== 'object') return false

  const item = entry as Partial<SmartWeightHistoryEntry>

  return (
    typeof item.groupName === 'string' &&
    typeof item.nodeName === 'string' &&
    Number.isFinite(item.time) &&
    typeof item.rank === 'string' &&
    Number.isFinite(item.weight)
  )
}

const loadSmartWeightHistory = () => {
  const backendId = activeUuid.value || 'default'
  if (historyBackendId === backendId) return

  historyBackendId = backendId
  lastWeightByNode = new Map()

  try {
    const saved = localStorage.getItem(`${SMART_WEIGHT_HISTORY_PREFIX}${backendId}`)
    const parsed: unknown = saved ? JSON.parse(saved) : []
    const entries = Array.isArray(parsed) ? parsed.filter(isSmartWeightHistoryEntry) : []

    smartWeightHistory.value = entries
      .filter((entry) => Date.now() - entry.time <= SMART_WEIGHT_HISTORY_MAX_AGE)
      .slice(-SMART_WEIGHT_HISTORY_MAX_ENTRIES)

    for (const entry of smartWeightHistory.value) {
      lastWeightByNode.set(historyNodeKey(entry.groupName, entry.nodeName), entry)
    }
  } catch {
    smartWeightHistory.value = []
  }
}

const recordSmartWeightHistory = (weights: Record<string, NodeRank[]>) => {
  loadSmartWeightHistory()

  let changed = false
  const time = Date.now()

  for (const [groupName, groupWeights] of Object.entries(weights)) {
    for (const weight of groupWeights ?? []) {
      const key = historyNodeKey(groupName, weight.Name)
      const previous = lastWeightByNode.get(key)

      if (previous && previous.weight === weight.Weight && previous.rank === weight.Rank) continue

      const entry: SmartWeightHistoryEntry = {
        groupName,
        nodeName: weight.Name,
        time,
        rank: weight.Rank,
        weight: weight.Weight,
      }

      smartWeightHistory.value.push(entry)
      lastWeightByNode.set(key, entry)
      changed = true
    }
  }

  if (!changed) return

  smartWeightHistory.value = smartWeightHistory.value
    .filter((entry) => time - entry.time <= SMART_WEIGHT_HISTORY_MAX_AGE)
    .slice(-SMART_WEIGHT_HISTORY_MAX_ENTRIES)

  try {
    localStorage.setItem(
      `${SMART_WEIGHT_HISTORY_PREFIX}${historyBackendId}`,
      JSON.stringify(smartWeightHistory.value),
    )
  } catch {
    // Keep the in-memory history when storage is unavailable or full.
  }
}

export const getSmartWeightHistory = (groupName: string, nodeName: string) =>
  smartWeightHistory.value
    .filter((entry) => entry.groupName === groupName && entry.nodeName === nodeName)
    .slice(-10)

const restructWeights = (proxyName: string, weights: NodeRank[]) => {
  const smartWeights: Record<string, NodeRank> = {}
  const smartOrder: Record<string, number> = {}

  weights.forEach((weight, index) => {
    smartWeights[weight.Name] = weight
    smartOrder[weight.Name] = index
  })

  smartWeightsMap.value[proxyName] = smartWeights
  smartOrderMap.value[proxyName] = smartOrder
}

export const initSmartWeights = async () => {
  let smartWeights: Record<string, NodeRank[]> | null = null

  try {
    smartWeights = await driver().proxies.fetchSmartWeights()
  } catch {
    smartWeights = null
  }

  smartWeightsMap.value = {}
  smartOrderMap.value = {}

  if (!smartWeights) return

  for (const [group, weights] of Object.entries(smartWeights)) {
    if (!weights?.length) continue

    restructWeights(group, weights)
  }

  recordSmartWeightHistory(smartWeights)
}
