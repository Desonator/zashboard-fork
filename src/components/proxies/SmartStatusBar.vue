<template>
  <div
    v-if="smartNodes.length"
    class="bg-base-200/60 flex flex-wrap items-center gap-1.5 rounded-lg p-1.5"
  >
    <div class="text-base-content/70 shrink-0 px-1.5 text-xs font-medium">
      {{ t('smartStatusBar') }}
      <span class="tabular-nums">· {{ smartNodes.length }}</span>
    </div>
    <div class="flex min-w-0 flex-1 flex-wrap gap-1.5">
      <div
        v-for="node in smartNodes"
        :key="`${node.groupName}:${node.name}`"
        class="bg-base-100 flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs"
        :title="`${node.groupName} · ${node.name} · ${t(node.rank)} · ${node.latency > 0 ? `${node.latency} ms` : t('noData')}`"
      >
        <span class="text-base-content/80 shrink-0">{{ shortenName(node.name) }}</span>
        <span
          class="shrink-0 rounded px-1 text-[10px] leading-4 tabular-nums"
          :class="weightAccent(node.rank)"
        >
          {{ formatWeight(node.weight) }}
        </span>
        <span
          class="shrink-0 tabular-nums"
          :class="node.latency > 0 ? getColorForLatency(node.latency) : 'text-base-content/45'"
        >
          {{ node.latency > 0 ? `${node.latency} ms` : '—' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLatencyByName, proxyMap, smartWeightsMap } from '@/assembly/proxies'
import { getColorForLatency } from '@/helper'
import type { NodeRank } from '@/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const smartNodes = computed(() =>
  Object.entries(smartWeightsMap.value)
    .filter(([groupName]) => proxyMap.value[groupName]?.type.toLowerCase() === 'smart')
    .flatMap(([groupName, weights]) =>
      Object.values(weights).map((weight: NodeRank) => ({
        groupName,
        name: weight.Name,
        rank: weight.Rank,
        weight: weight.Weight,
        latency: getLatencyByName(weight.Name, groupName),
      })),
    )
    .sort((left, right) => right.weight - left.weight),
)

const shortenName = (name: string) => {
  const characters = Array.from(name)

  return characters.length > 13 ? `${characters.slice(0, 12).join('')}…` : name
}

const formatWeight = (weight: number) =>
  Number.isInteger(weight) ? weight.toString() : weight.toFixed(1)

const weightAccent = (rank: string) => {
  switch (rank) {
    case 'MostUsed':
      return 'bg-success/15 text-success'
    case 'OccasionalUsed':
      return 'bg-warning/15 text-warning'
    default:
      return 'bg-base-300/70 text-base-content/70'
  }
}
</script>
