<template>
  <div
    v-if="hasVisibleItems"
    class="text-sm"
  >
    <template v-if="isVisibleBackendSwitch">
      <div class="settings-section-label">{{ $t('settingsSectionCurrentBackend') }}</div>
      <div class="settings-grid">
        <SettingItem
          :setting-key="k.backend"
          class="py-3"
        >
          <div class="flex w-full flex-col gap-3">
            <div class="flex items-center gap-2 px-1">
              <div class="indicator">
                <span
                  v-if="isCoreUpdateAvailable"
                  class="indicator-item top-1 -right-1 flex"
                >
                  <span class="bg-secondary absolute h-2 w-2 animate-ping rounded-full"></span>
                  <span class="bg-secondary h-2 w-2 rounded-full"></span>
                </span>
                <a
                  class="flex cursor-pointer items-center gap-2 font-semibold"
                  :href="coreBrand.url"
                  target="_blank"
                >
                  {{ $t('backend') }}
                  <BackendVersion class="text-sm font-normal" />
                </a>
              </div>
            </div>
            <BackendSwitch :show-actions="false" />
          </div>
        </SettingItem>
      </div>
    </template>

    <template v-if="hasVisibleActions">
      <div class="settings-section-label">{{ $t('settingsSectionCoreOperations') }}</div>
      <div class="settings-grid">
        <SettingItem
          v-for="action in backendActions"
          :key="action.key"
          :setting-key="action.key"
        >
          <div class="setting-item-label">{{ $t(action.label) }}</div>
          <button
            class="btn btn-sm min-w-11"
            :disabled="action.running"
            :aria-label="$t(action.label)"
            @click="action.run()"
          >
            <span
              v-if="action.running"
              class="loading loading-spinner h-4 w-4"
            ></span>
            <component
              :is="action.icon"
              v-else
              class="h-4 w-4"
            />
          </button>
        </SettingItem>
      </div>
    </template>

    <template v-if="showDaeRuntime">
      <div class="settings-section-label">{{ $t('daeRuntime') }}</div>
      <div class="settings-grid">
        <SettingItem
          :setting-key="k.daeRuntime"
          class="py-3"
        >
          <DaeRuntimePanel />
        </SettingItem>
      </div>
    </template>

    <template v-if="showDaeGeoData">
      <div class="settings-section-label">{{ $t('daeGeoData') }}</div>
      <div class="settings-grid">
        <SettingItem
          :setting-key="k.daeGeoData"
          class="py-3"
        >
          <DaeGeoDataPanel />
        </SettingItem>
      </div>
    </template>

    <template v-if="showDnsDiagnostics">
      <div class="settings-section-label">{{ $t('settingsSectionDiagnostics') }}</div>
      <div class="settings-grid">
        <SettingItem
          :setting-key="k.DNSQuery"
          class="py-3"
        >
          <DnsDiagnostics />
        </SettingItem>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { can } from '@/assembly/backend'
import { daeCapabilities } from '@/assembly/capabilities'
import { coreBrand, isCoreUpdateAvailable } from '@/assembly/version'
import BackendVersion from '@/components/common/BackendVersion.vue'
import BackendSwitch from '@/components/settings/backend/BackendSwitch.vue'
import DaeGeoDataPanel from '@/components/dae/DaeGeoDataPanel.vue'
import DaeRuntimePanel from '@/components/dae/DaeRuntimePanel.vue'
import DnsDiagnostics from '@/components/settings/backend/DnsDiagnostics.vue'
import SettingItem from '@/components/settings/SettingItem.vue'
import { backendActions } from '@/helper/backend-actions'
import { useIsSettingVisible } from '@/composables/use-setting-visibility'
import { isSettingVisible } from '@/helper/settings'
import { BACKEND_ITEM_KEYS } from '@/config/settings-items'
import { activeBackend } from '@/store/setup'
import { computed } from 'vue'

const k = BACKEND_ITEM_KEYS

const isVisibleBackendSwitch = useIsSettingVisible(k.backend)
const isVisibleDnsQuery = useIsSettingVisible(k.DNSQuery)
const isVisibleDaeRuntime = useIsSettingVisible(k.daeRuntime)
const isVisibleDaeGeoData = useIsSettingVisible(k.daeGeoData)
const hasVisibleActions = computed(() =>
  backendActions.value.some((action) => isSettingVisible(action.key)),
)
const showDaeRuntime = computed(
  () =>
    isVisibleDaeRuntime.value &&
    activeBackend.value?.type === 'dae' &&
    (can('runtimeSettings') || can('lifecycleControl') || can('datapath')),
)
const showDaeGeoData = computed(
  () =>
    isVisibleDaeGeoData.value &&
    activeBackend.value?.type === 'dae' &&
    daeCapabilities.value?.resources.geodata?.available === true,
)
const showDnsDiagnostics = computed(
  () =>
    isVisibleDnsQuery.value &&
    (can('dnsQuery') || can('dnsCache') || can('dnsLog') || can('dnsRules')),
)
const hasVisibleItems = computed(
  () =>
    isVisibleBackendSwitch.value ||
    hasVisibleActions.value ||
    showDaeRuntime.value ||
    showDaeGeoData.value ||
    showDnsDiagnostics.value,
)

</script>
