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
  const hasGroupDiagnostics = Boolean(
    group?.testUrl || group?.expectedStatus !== undefined || pingConfig,
  )

  if (!history.length && !hasGroupDiagnostics) return

  const historyList = document.createElement('div')

  historyList.classList.add('flex', 'flex-col', 'gap-1')

  for (const item of history.slice(-12)) {
    const itemDiv = document.createElement('div')
    const time = document.createElement('div')
    const latency = document.createElement('div')

    time.textContent = dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')
    latency.textContent = item.delay + 'ms'
    latency.className = getColorForLatency(item.delay)

    itemDiv.classList.add('flex', 'items-center', 'gap-2')
    itemDiv.append(time, latency)
    historyList.append(itemDiv)
  }

  if (hasGroupDiagnostics) {
    const separator = document.createElement('div')
    separator.classList.add('my-1', 'border-t', 'border-base-content/15')
    historyList.append(separator)

    const addInfoRow = (label: string, value: string, valueClass = '') => {
      const row = document.createElement('div')
      const labelElement = document.createElement('span')
      const valueElement = document.createElement('span')

      row.classList.add('flex', 'max-w-80', 'items-start', 'justify-between', 'gap-3')
      labelElement.classList.add('shrink-0', 'text-base-content/60')
      valueElement.classList.add('max-w-64', 'break-all', 'text-right')
      if (valueClass) valueElement.classList.add(valueClass)
      labelElement.textContent = label
      valueElement.textContent = value
      row.append(labelElement, valueElement)
      historyList.append(row)
    }

    if (group?.testUrl) addInfoRow(t('speedtestUrl'), group.testUrl)
    if (group?.expectedStatus !== undefined) {
      addInfoRow(t('expectedHttpStatus'), String(group.expectedStatus))
    }

    if (pingConfig) {
      if (pingConfig.destination) {
        addInfoRow(t('pingConfigDestination'), pingConfig.destination)
      }
      if (pingConfig.httpMethod) addInfoRow(t('httpMethod'), pingConfig.httpMethod)
      if (pingConfig.timeout !== undefined) {
        addInfoRow(t('pingConfigTimeout'), `${pingConfig.timeout} ms`)
      }
      if (pingConfig.connectivity) addInfoRow(t('connectivityCheck'), pingConfig.connectivity)

      if (typeof pingConfigHistory?.alive === 'boolean') {
        addInfoRow(
          t('destinationCheck'),
          t(pingConfigHistory.alive ? 'checkPassed' : 'checkFailed'),
          pingConfigHistory.alive ? 'text-success' : 'text-error',
        )
      }
    }
  }

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
