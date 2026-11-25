<template>
  <div class="flex flex-1 items-center gap-1 truncate">
    <template v-if="proxyGroup.now">
      <Component
        class="text-base-content/40 h-3.5 w-3.5 shrink-0 outline-none"
        :is="isFixed ? LockClosedIcon : ArrowRightCircleIcon"
        @mouseenter="tipForFixed"
      />
      <ProxyName
        :name="proxyGroup.now"
        :class="
          isNowAGroup && 'hover:bg-base-300 hover:-mx-1 hover:rounded-lg hover:px-1 hover:shadow'
        "
        class="text-base-content text-xs md:text-sm"
        @click="handlerClickNow"
      />
      <template v-if="smartGroupNameInChain">
        <template
          v-if="(displayFinalOutbound || displaySmartTopNodes) && proxyGroup.now !== smartGroupNameInChain"
        >
          <ArrowRightCircleIcon class="text-base-content/40 h-3.5 w-3.5 shrink-0" />
          <ProxyName
            :name="smartGroupNameInChain"
            class="text-base-content text-xs md:text-sm"
          />
        </template>
        <template v-if="displaySmartTopNodes && smartTopCandidates.length">
          <ArrowRightCircleIcon class="text-base-content/40 h-3.5 w-3.5 shrink-0" />
          <span
            class="truncate text-base-content/60 text-xs md:text-sm"
            :title="$t('smartTopTooltip')"
          >
            {{ smartTopCandidates.map(abbreviateSmartName).join(' · ') }}
          </span>
        </template>
      </template>
      <template v-else-if="finalOutbound && displayFinalOutbound">
        <ArrowRightCircleIcon class="text-base-content/40 h-3.5 w-3.5 shrink-0" />
        <ProxyName
          :name="finalOutbound"
          class="text-base-content text-xs md:text-sm"
        />
      </template>
    </template>
    <template v-else-if="proxyGroup.type.toLowerCase() === PROXY_TYPE.LoadBalance">
      <CheckCircleIcon class="text-base-content/40 h-3.5 w-3.5 shrink-0" />
      <span class="text-base-content text-xs md:text-sm">
        {{ $t('loadBalance') }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { openProxyGroupChain } from '@/helper/proxy-group-chain'
import { PROXY_TYPE } from '@/constant'
import { useTooltip } from '@/composables/use-tooltip'
import { getNowProxyNodeName, proxyGroupList, proxyMap, smartWeightsMap } from '@/assembly/proxies'
import { displayFinalOutbound, displaySmartTopNodes } from '@/store/settings'
import { ArrowRightCircleIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProxyName from './ProxyName.vue'

const props = defineProps<{
  name: string
  mobile?: boolean
}>()
const proxyGroup = computed(() => proxyMap.value[props.name])
const { showTip } = useTooltip()
const { t } = useI18n()

const isFixed = computed(() => {
  return proxyGroup.value.fixed === proxyGroup.value.now
})

const tipForFixed = (e: Event) => {
  if (!isFixed.value) {
    return
  }

  showTip(e, t('tipForFixed', { type: proxyGroup.value.type }), {
    delay: [500, 0],
  })
}

const isNowAGroup = computed(() => {
  return proxyGroupList.value.includes(proxyGroup.value.now)
})

const smartGroupNameInChain = computed(() => {
  let node = proxyMap.value[props.name]
  const visited = new Set<string>()

  while (node && !visited.has(node.name)) {
    visited.add(node.name)
    if (node.type.toLowerCase() === PROXY_TYPE.Smart) return node.name
    if (!node.now || node.now === node.name) return ''
    node = proxyMap.value[node.now]
  }

  return ''
})

const smartTopCandidates = computed(() =>
  Object.values(smartWeightsMap.value[smartGroupNameInChain.value] ?? {})
    .sort((left, right) => right.Weight - left.Weight)
    .slice(0, 3)
    .map(({ Name }) => Name),
)

const abbreviateSmartName = (name: string) => {
  const characters = Array.from(name)
  return characters.length > 12 ? `${characters.slice(0, 11).join('')}…` : name
}

const finalOutbound = computed(() => {
  const now = getNowProxyNodeName(proxyGroup.value.now)

  if (now === proxyGroup.value.now) {
    return ''
  }

  return now
})

const handlerClickNow = (e: Event) => {
  if (isNowAGroup.value) {
    e.stopPropagation()
    openProxyGroupChain(props.name)
  }
}
</script>
