<template>
  <div
    :class="[
      'latency-tag bg-base-100 h-5 w-10 rounded-xl text-xs select-none md:hover:shadow-sm',
      color,
    ]"
    @mouseenter="handlerHistoryTip"
  >
    <Transition name="latency-state">
      <span
        v-if="state === 'loading'"
        class="latency-state loading loading-dots loading-xs text-base-content/80"
      ></span>
      <BoltIcon
        v-else-if="state === 'empty'"
        class="latency-state text-base-content h-3 w-3"
      />
      <div
        v-else
        ref="latencyRef"
        class="latency-state tabular-nums"
      >
        {{ latency }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { NOT_CONNECTED } from '@/constant'
import { getColorForLatency } from '@/helper'
import { useTooltip } from '@/composables/use-tooltip'
import { getHistoryByName, getLatencyByName, getTestUrl, proxyMap } from '@/assembly/proxies'
import { BoltIcon } from '@heroicons/vue/24/outline'
import { CountUp } from 'countup.js'
import dayjs from 'dayjs'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { showTip } = useTooltip()
const { t } = useI18n()
const handlerHistoryTip = (e: Event) => {
  const proxy = proxyMap.value[props.name ?? '']
  const group = props.groupName ? proxyMap.value[props.groupName] : undefined
  const testUrl = group?.testUrl || (props.groupName ? getTestUrl(props.groupName) : '')
  const pingConfig = group?.pingConfig
  const pingConfigHistory = testUrl ? proxy?.extra?.[testUrl] : undefined
  const history = getHistoryByName(props.name ?? '', props.groupName) ?? []

  if (!history.length) return

  const visibleHistory = history.slice(-12)
  const profileHistory = pingConfigHistory?.history ?? []
  const profileTimestamp = profileHistory.length
    ? dayjs(profileHistory[profileHistory.length - 1].time).valueOf()
    : Number.NaN
  let statusHistoryIndex = -1

  if (
    pingConfig &&
    typeof pingConfigHistory?.alive === 'boolean' &&
    Number.isFinite(profileTimestamp)
  ) {
    let nearestDistance = Infinity

    visibleHistory.forEach((item, index) => {
      const distance = Math.abs(dayjs(item.time).valueOf() - profileTimestamp)

      if (distance < nearestDistance) {
        nearestDistance = distance
        statusHistoryIndex = index
      }
    })

    if (nearestDistance > 90_000) statusHistoryIndex = -1
  }

  const historyList = document.createElement('div')
  const pingColumn = document.createElement('div')
  const statusColumn = document.createElement('div')
  const hasStatus = statusHistoryIndex >= 0 && typeof pingConfigHistory?.alive === 'boolean'

  historyList.classList.add('grid', 'w-max', 'grid-cols-[max-content_max-content]', 'gap-x-2')
  pingColumn.classList.add('flex', 'flex-col', 'gap-1')
  statusColumn.classList.add(
    'flex',
    'flex-col',
    'gap-1',
    'border-l',
    'border-base-content/20',
    'pl-2',
  )

  visibleHistory.forEach((item, index) => {
    const pingRow = document.createElement('div')
    const time = document.createElement('div')
    const latency = document.createElement('div')

    time.textContent = dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')
    time.classList.add('text-base-content/60')
    latency.textContent = item.delay + 'ms'
    latency.className = getColorForLatency(item.delay)

    pingRow.classList.add('flex', 'h-5', 'items-center', 'gap-2', 'whitespace-nowrap')
    pingRow.append(time, latency)
    pingColumn.append(pingRow)

    if (hasStatus) {
      const statusRow = document.createElement('div')
      statusRow.classList.add('flex', 'h-5', 'items-center', 'whitespace-nowrap')

      if (index === statusHistoryIndex && typeof pingConfigHistory?.alive === 'boolean') {
        const dataTransferLabel = document.createElement('span')
        const dataTransferStatus = document.createElement('span')

        dataTransferLabel.classList.add('text-base-content/60')
        dataTransferLabel.textContent = t('dataTransferLabel')
        dataTransferStatus.classList.add(
          pingConfigHistory.alive ? 'text-low-latency' : 'text-high-latency',
        )
        dataTransferStatus.textContent = t(
          pingConfigHistory.alive ? 'dataTransferStatusOk' : 'dataTransferStatusFailed',
        )
        statusRow.classList.add('gap-1')
        statusRow.append(dataTransferLabel, dataTransferStatus)
      }

      statusColumn.append(statusRow)
    }
  })

  historyList.append(pingColumn)
  if (hasStatus) historyList.append(statusColumn)

  showTip(e, historyList, {
    delay: [1000, 0],
    trigger: 'mouseenter',
    touch: false,
  })
}

const props = defineProps<{
  name?: string
  loading?: boolean
  groupName?: string
}>()
const latencyRef = ref<HTMLElement | null>(null)
const latency = computed(() => getLatencyByName(props.name ?? '', props.groupName))
let countUp: CountUp | null = null
let shownLatency = latency.value

const createCountUp = (el: HTMLElement) => {
  countUp = new CountUp(el, shownLatency, {
    duration: 1,
    separator: '',
    enableScrollSpy: false,
    startVal: shownLatency,
  })

  return countUp
}

watch(
  latencyRef,
  (el) => {
    countUp = null

    if (!el || latency.value === shownLatency) return

    createCountUp(el).update(latency.value)
    shownLatency = latency.value
  },
  { flush: 'post' },
)

watch(latency, (value) => {
  const el = latencyRef.value

  if (!el) return

  const instance = countUp ?? createCountUp(el)

  instance.update(value)
  shownLatency = value
})

onUnmounted(() => {
  countUp = null
})

const color = computed(() => {
  return getColorForLatency(latency.value)
})

type LatencyState = 'loading' | 'empty' | 'value'

const state = computed<LatencyState>(() => {
  if (props.loading) return 'loading'
  if (latency.value === NOT_CONNECTED || !latency.value) return 'empty'
  return 'value'
})
</script>

<style scoped>
.latency-tag {
  display: grid;
  place-items: center;
  transition:
    color 0.35s ease-out,
    background-color 0.35s ease-out;
}

.latency-state {
  grid-area: 1 / 1;
}

.latency-state-enter-active,
.latency-state-leave-active {
  transition:
    opacity 0.2s ease-out,
    scale 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.latency-state-enter-from,
.latency-state-leave-to {
  opacity: 0;
  scale: 0.6;
}

.latency-state-leave-active {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .latency-tag,
  .latency-state-enter-active,
  .latency-state-leave-active {
    transition: none;
  }
}

.custom-background .bg-primary\/85 .latency-tag {
  background-color: color-mix(
    in oklab,
    var(--color-base-100) max(var(--app-surface-alpha), 90%),
    transparent
  );
}

@media (prefers-reduced-motion: no-preference) {
  .loading-dots {
    mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='4' cy='12' r='3'%3E%3Canimate attributeName='cy' values='12;6;12;12' keyTimes='0;0.286;0.571;1' dur='1.05s' repeatCount='indefinite' keySplines='.33,0,.66,.33;.33,.66,.66,1'/%3E%3C/circle%3E%3Ccircle cx='12' cy='12' r='3'%3E%3Canimate attributeName='cy' values='12;6;12;12' keyTimes='0;0.286;0.571;1' dur='1.05s' repeatCount='indefinite' keySplines='.33,0,.66,.33;.33,.66,.66,1' begin='0.1s'/%3E%3C/circle%3E%3Ccircle cx='20' cy='12' r='3'%3E%3Canimate attributeName='cy' values='12;6;12;12' keyTimes='0;0.286;0.571;1' dur='1.05s' repeatCount='indefinite' keySplines='.33,0,.66,.33;.33,.66,.66,1' begin='0.2s'/%3E%3C/circle%3E%3C/svg%3E");
  }
}
</style>
