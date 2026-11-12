<script setup>
import { onMounted, ref } from 'vue'
import { api, downloadReport } from '../api'
import { notify } from '../dialog'

const rows = ref([])
const limit = ref(100)

async function load() {
  try {
    rows.value = await api(`/api/v1/audits?limit=${Number(limit.value) || 100}`)
  } catch (err) {
    await notify.error(err.message)
  }
}

async function exportCsv() {
  try {
    await downloadReport('audits')
  } catch (err) {
    await notify.error(err.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Recent operational actions</p>
    <div class="toolbar-actions">
      <button
        class="ghost icon-btn"
        type="button"
        title="Refresh"
        aria-label="Refresh"
        @click="load"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <polyline points="20 4 20 9 15 9" />
        </svg>
      </button>
      <button class="ghost" type="button" @click="exportCsv">Export CSV</button>
    </div>
  </div>

  <div class="card">
    <div class="filters">
      <label class="field">
        <span>Limit</span>
        <input v-model.number="limit" type="number" min="1" max="500" />
      </label>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>When</th>
          <th>User</th>
          <th>Location</th>
          <th>Action</th>
          <th>Previous</th>
          <th>Next</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.createdAt }}</td>
          <td>{{ row.userName }}</td>
          <td>{{ row.location || '—' }}</td>
          <td>{{ row.action }}</td>
          <td>{{ row.previousValue || '—' }}</td>
          <td>{{ row.newValue || '—' }}</td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="7" class="ok">No audit rows yet.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
