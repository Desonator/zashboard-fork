<template>
  <div
    v-if="smartNodes.length"
    class="bg-base-100 flex w-full min-w-0 items-center overflow-hidden rounded-xl px-2 py-1 shadow-xs"
  >
    <div
      class="text-base-content/75 flex shrink-0 items-center gap-1.5 px-1.5 py-1 text-xs font-medium"
    >
      {{ t('smartStatusBar') }}
      <span class="bg-base-200 text-base-content/85 rounded-full px-1.5 py-0.5 tabular-nums">
        {{ smartNodes.length }}
      </span>
    </div>
    <div
      class="smart-status-scroll flex min-w-0 flex-1 flex-nowrap select-none overflow-x-auto overscroll-x-contain max-md:scrollbar-hidden"
    >
      <div
        v-for="node in smartNodes"
        :key="`${node.groupName}:${node.name}`"
        class="border-base-content/15 flex w-max shrink-0 items-center gap-1.5 border-l px-2 py-1 text-xs"
        @pointerenter="showNodeDetails($event, node)"
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
import { useTooltip } from '@/composables/use-tooltip'
import { getColorForLatency } from '@/helper'
import type { NodeRank } from '@/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { showTip } = useTooltip()

type SmartStatusNode = {
  groupName: string
  name: string
  rank: string
  weight: number
  latency: number
}

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

const showNodeDetails = (event: PointerEvent, node: SmartStatusNode) => {
  if (event.pointerType !== 'mouse') return

  const content = document.createElement('div')
  content.classList.add('flex', 'flex-col', 'gap-1')

  for (const line of [
    node.groupName,
    node.name,
    `${t(node.rank)} · ${formatWeight(node.weight)}`,
    node.latency > 0 ? `${node.latency} ms` : t('noData'),
  ]) {
    const row = document.createElement('div')
    row.textContent = line
    content.append(row)
  }

  showTip(event, content, {
    delay: [500, 0],
    trigger: 'mouseenter',
    touch: false,
  })
}

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

<style scoped>
.smart-status-scroll {
  -webkit-overflow-scrolling: touch;
}
</style>
