<template>
  <div
    :class="cardClass"
    @contextmenu.stop.prevent="handlerLatencyTest"
  >
    <div
      class="flex w-full min-w-0 flex-1 items-center gap-1"
      :class="[truncateProxyName && 'truncate', titleSizeClass]"
      @mouseenter="checkTruncation"
    >
      <ProxyIcon
        v-if="node?.icon"
        class="-mt-[2px] shrink-0 align-middle"
        :icon="node.icon"
        :fill="active ? 'fill-primary-content' : 'fill-base-content'"
      />
      <span
        class="min-w-0 flex-1 truncate"
        :class="active ? 'text-primary-content' : 'text-base-content'"
        >{{ node.name }}</span
      >
      <span
        v-if="smartWeight"
        class="shrink-0 rounded px-1 text-[10px] leading-4"
        :class="smartWeightAccent"
        @mouseenter="showWeightHistory"
        >{{ formatSmartWeight(smartWeight.Weight) }}</span
      >
    </div>

    <div class="flex min-h-4 w-full min-w-0 items-center justify-between gap-1">
      <div class="flex min-w-0 items-center gap-1 overflow-hidden">
        <span
          :class="[
            'truncate tracking-tight',
            typeDescriptionSizeClass,
            active ? 'text-primary-content' : 'text-base-content/60',
          ]"
          @mouseenter="checkTruncation"
        >
          {{ typeDescription }}
        </span>
      </div>
      <LatencyTag
        :class="[latencyTagSizeClass, 'shrink-0']"
        :name="node.name"
        :loading="isLatencyTesting"
        :group-name="groupName"
        @click.stop="handlerLatencyTest"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { smartWeightsMap } from '@/assembly/proxies'
import { getSmartWeightHistory } from '@/assembly/proxies/smart'
import { useTooltip } from '@/composables/use-tooltip'
import { PROXY_CARD_SIZE, PROXY_SORT_TYPE } from '@/constant'
import { checkTruncation } from '@/helper/tooltip'
import {
  highlightProxyNode,
  highlightedProxyNode,
  scrollNodeIntoViewKey,
} from '@/helper/proxies-scroll'
import { proxyLatencyTest } from '@/assembly/proxies'
import { getIPv6ByName, getTestUrl, proxyMap } from '@/assembly/proxies'
import { IPv6test, proxyCardSize, proxySortType, truncateProxyName } from '@/store/settings'
import { computed, inject, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import LatencyTag from './LatencyTag.vue'
import ProxyIcon from './ProxyIcon.vue'

const { t } = useI18n()
const { showTip } = useTooltip()
const props = defineProps<{
  name: string
  active?: boolean
  groupName?: string
}>()

const node = computed(() => proxyMap.value[props.name])
const isLatencyTesting = ref(false)
const typeFormatter = (type: string) => {
  type = type.toLowerCase()
  type = type.replace('shadowsocks', 'ss')
  type = type.replace('hysteria', 'hy')
  type = type.replace('wireguard', 'wg')

  return type
}
const isSmallCard = computed(() => proxyCardSize.value === PROXY_CARD_SIZE.SMALL)
const isMediumCard = computed(() => proxyCardSize.value === PROXY_CARD_SIZE.MEDIUM)
const titleSizeClass = computed(() => (isMediumCard.value ? 'text-[13px]' : 'text-sm'))
const typeDescriptionSizeClass = computed(() => (isMediumCard.value ? 'text-[11px]' : 'text-xs'))
const latencyTagSizeClass = computed(() =>
  isSmallCard.value
    ? 'h-4! w-8! rounded-md!'
    : isMediumCard.value
      ? 'h-[18px]! w-9! rounded-lg!'
      : '',
)
const typeDescription = computed(() => {
  const type = typeFormatter(node.value.type)
  const isV6 = IPv6test.value && getIPv6ByName(node.value.name) ? 'IPv6' : ''
  const isUDP = node.value.udp ? (node.value.xudp ? 'xudp' : 'udp') : ''

  return [type, isUDP, isV6].filter(Boolean).join(isSmallCard.value ? '/' : ' / ')
})
const isSmartGroup = computed(
  () => proxyMap.value[props.groupName ?? '']?.type.toLowerCase() === 'smart',
)
const smartWeight = computed(() =>
  isSmartGroup.value ? smartWeightsMap.value[props.groupName ?? '']?.[props.name] : undefined,
)
const smartWeightAccentFor = (rank: string) => {
  switch (rank) {
    case 'MostUsed':
      return 'bg-success/15 text-success'
    case 'OccasionalUsed':
      return 'bg-warning/15 text-warning'
    default:
      return 'bg-base-300/70 text-base-content/70'
  }
}
const smartWeightAccent = computed(() => smartWeightAccentFor(smartWeight.value?.Rank ?? ''))
const formatSmartWeight = (weight: number) =>
  Number.isInteger(weight) ? weight.toString() : weight.toFixed(1)
const showWeightHistory = (event: MouseEvent) => {
  const history = getSmartWeightHistory(props.groupName ?? '', props.name)

  const content = document.createElement('div')
  content.classList.add(
    'grid',
    'w-max',
    'grid-cols-[max-content_max-content_max-content]',
    'items-center',
    'gap-x-2',
    'gap-y-1',
  )

  if (!history.length) {
    const empty = document.createElement('div')
    empty.classList.add('col-span-3', 'text-base-content/60')
    empty.textContent = t('smartWeightHistoryEmpty')
    content.append(empty)
  }

  for (const entry of history) {
    const time = document.createElement('span')
    const weight = document.createElement('span')
    const rank = document.createElement('span')

    time.textContent = dayjs(entry.time).format('YYYY-MM-DD HH:mm:ss')
    time.classList.add('whitespace-nowrap', 'text-base-content/60')
    weight.classList.add('shrink-0', 'rounded', 'px-1', 'text-[10px]', 'leading-4', 'tabular-nums')
    weight.classList.add(...smartWeightAccentFor(entry.rank).split(' '))
    weight.textContent = formatSmartWeight(entry.weight)
    rank.classList.add('whitespace-nowrap')
    rank.classList.add('text-base-content/60')
    rank.textContent = t(entry.rank)
    content.append(time, weight, rank)
  }

  showTip(event, content, {
    delay: [500, 0],
    trigger: 'mouseenter',
    touch: false,
  })
}

const scrollNodeIntoView = inject(scrollNodeIntoViewKey, null)
const latencyTipAnimationClass = computed(() =>
  highlightedProxyNode.value === props.name ? ['latency-highlight'] : [],
)

const cardClass = computed(() => [
  `relative flex ${isSmartGroup.value ? 'cursor-default' : 'cursor-pointer'} flex-col items-start rounded-md hover:shadow-sm`,
  props.active
    ? 'proxy-active-card bg-primary/95 sm:hover:bg-primary'
    : 'bg-base-200 sm:hover:bg-base-300/50',
  isSmallCard.value ? 'gap-1 p-1' : isMediumCard.value ? 'gap-1.5 p-1.5' : 'gap-2 p-2',
  latencyTipAnimationClass.value,
])
const handlerLatencyTest = async () => {
  if (isLatencyTesting.value) return

  isLatencyTesting.value = true
  try {
    await proxyLatencyTest(props.name, getTestUrl(props.groupName))
    isLatencyTesting.value = false
  } catch {
    isLatencyTesting.value = false
  }

  if ([PROXY_SORT_TYPE.LATENCY_ASC, PROXY_SORT_TYPE.LATENCY_DESC].includes(proxySortType.value)) {
    highlightProxyNode(props.name)
    await nextTick()
    scrollNodeIntoView?.(props.name)
  }
}
</script>

<style scoped>
.tooltip:before {
  z-index: 20;
}

.latency-highlight::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background-color: var(--color-info);
  animation: latencyHighlightFade 1.5s ease-out forwards;
}

@keyframes latencyHighlightFade {
  0% {
    opacity: 0.2;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .latency-highlight::after {
    animation: none;
  }
}
</style>
