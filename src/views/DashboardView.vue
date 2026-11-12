<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'
import { notify } from '../dialog'

const data = ref(null)
const busy = ref(false)

const cards = [
  ['Received today', 'receivedToday'],
  ['Ready for airline', 'readyForAirline'],
  ['With airline', 'inAirlineCustody'],
  ['Zanzibar storage', 'zanzibarStorage'],
  ['Ready for collection', 'readyForCollection'],
  ['Open exceptions', 'openExceptions']
]

async function load() {
  busy.value = true
  try {
    data.value = await api('/api/v1/dashboard')
  } catch (err) {
    await notify.error(err.message)
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Live custody snapshot for the Kilimanjaro → Zanzibar corridor.</p>
    <div class="toolbar-actions">
      <button
        class="ghost icon-btn"
        type="button"
        title="Refresh"
        aria-label="Refresh"
        :disabled="busy"
        @click="load"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <polyline points="20 4 20 9 15 9" />
        </svg>
      </button>
    </div>
  </div>

  <p v-if="!data" class="loading-line">Loading corridor status…</p>
  <template v-else>
    <div class="corridor-strip">
      <div class="corridor-end">
        <small>Origin</small>
        Kilimanjaro
      </div>
      <div class="corridor-mid">custody flow →</div>
      <div class="corridor-end" style="text-align: right">
        <small>Destination</small>
        Zanzibar
      </div>
    </div>

    <div class="grid">
      <div
        v-for="([label, key], i) in cards"
        :key="key"
        class="metric"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <div class="label">{{ label }}</div>
        <div class="stat" :class="{ bad: key === 'openExceptions' && data[key] > 0 }">{{ data[key] }}</div>
      </div>
    </div>

    <div class="panel">
      <h3>Alerts</h3>
      <ul class="alert-list">
        <li v-if="!data.alerts?.length" class="ok">No open alerts. Operations are green.</li>
        <li
          v-for="alert in data.alerts"
          :key="alert.message"
          :class="alert.level === 'RED' ? 'err' : 'warn'"
        >{{ alert.message }}</li>
      </ul>
    </div>
  </template>
</template>
