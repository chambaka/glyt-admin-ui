<script setup>
import { ref } from 'vue'
import { downloadReport } from '../api'
import { notify } from '../dialog'

const busy = ref('')
const from = ref('')
const to = ref('')
const status = ref('')
const airline = ref('')

const reports = [
  { kind: 'movements', label: 'Movements', detail: 'Bag movement history across the corridor' },
  { kind: 'manifests', label: 'Manifests', detail: 'Flight manifests and airline handoffs' },
  { kind: 'storage', label: 'Storage', detail: 'Storage occupancy and slot usage' },
  { kind: 'exceptions', label: 'Exceptions', detail: 'Open and resolved exception records' },
  { kind: 'daily', label: 'Daily operations', detail: 'Day-by-day ops summary' },
  { kind: 'collections', label: 'Collections', detail: 'Payment and collection totals' }
]

async function download(kind) {
  busy.value = kind
  try {
    await downloadReport(kind, {
      from: from.value || undefined,
      to: to.value || undefined,
      status: status.value || undefined,
      airline: airline.value || undefined
    })
  } catch (err) {
    await notify.error(err.message)
  } finally {
    busy.value = ''
  }
}
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Export CSV reports with shared date and filter options</p>
  </div>

  <div class="card reports-filters">
    <div class="section-kicker">Filters</div>
    <div class="filter-grid">
      <label class="field">
        <span>From</span>
        <input v-model="from" type="date" />
      </label>
      <label class="field">
        <span>To</span>
        <input v-model="to" type="date" />
      </label>
      <label class="field">
        <span>Status</span>
        <input v-model="status" placeholder="e.g. READY" />
      </label>
      <label class="field">
        <span>Airline</span>
        <input v-model="airline" placeholder="Manifest airline" />
      </label>
    </div>
  </div>

  <div class="card">
    <div class="section-kicker">Downloads</div>
    <div class="report-list">
      <div v-for="report in reports" :key="report.kind" class="report-row">
        <div class="report-copy">
          <strong>{{ report.label }}</strong>
          <span>{{ report.detail }}</span>
        </div>
        <button
          type="button"
          class="ghost"
          :disabled="!!busy"
          @click="download(report.kind)"
        >
          {{ busy === report.kind ? 'Downloading…' : 'Download CSV' }}
        </button>
      </div>
    </div>
  </div>
</template>
