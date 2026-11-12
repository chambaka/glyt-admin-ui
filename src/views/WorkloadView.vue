<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'
import { notify } from '../dialog'

const data = ref(null)

const cards = [
  ['Open exceptions', 'openExceptions'],
  ['Overdue SLA', 'overdueExceptions'],
  ['Open support', 'openSupportTickets'],
  ['Pending payments', 'pendingPayments'],
  ['KIA in custody', 'bagsAtKia'],
  ['ZNZ in custody', 'bagsAtZnz'],
  ['Ready for collection', 'readyForCollection']
]

async function load() {
  try {
    data.value = await api('/api/v1/workload')
  } catch (err) {
    await notify.error(err.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Staff load and exception due times</p>
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
    </div>
  </div>

  <p v-if="!data">Loading workload…</p>
  <template v-else>
    <div class="grid">
      <div
        v-for="([label, key], i) in cards"
        :key="key"
        class="metric"
        :style="{ animationDelay: `${i * 35}ms` }"
      >
        <div class="label">{{ label }}</div>
        <div class="stat" :class="{ bad: (key === 'overdueExceptions' || key === 'openExceptions') && data[key] > 0 }">
          {{ data[key] }}
        </div>
      </div>
    </div>

    <div class="card">
      <h3>SLA queue</h3>
      <table>
        <thead>
          <tr>
            <th>Bag</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Age (h)</th>
            <th>Due</th>
            <th>Assigned</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.slaQueue" :key="row.id" :class="{ fail: row.overdue }">
            <td>{{ row.bagCode }}</td>
            <td>{{ row.typeLabel }}</td>
            <td>{{ row.priority }}</td>
            <td>{{ row.ageHours }}</td>
            <td>{{ row.overdue ? 'OVERDUE' : row.dueAt }}</td>
            <td>{{ row.assignedTo || '—' }}</td>
          </tr>
          <tr v-if="!data.slaQueue?.length">
            <td colspan="6" class="ok">No open exceptions.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Staff load</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Location</th>
            <th>Open exceptions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.staffLoads" :key="row.userId">
            <td>{{ row.fullName }}</td>
            <td>{{ row.role }}</td>
            <td>{{ row.location }}</td>
            <td>{{ row.openExceptions }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
