<script setup>
import { ref } from 'vue'
import { api } from '../api'
import { notify } from '../dialog'

const q = ref('')
const rows = ref([])
const selected = ref(null)

async function search() {
  try {
    const term = encodeURIComponent(q.value.trim())
    rows.value = await api(`/api/v1/bags?q=${term}`)
    selected.value = null
  } catch (err) {
    await notify.error(err.message)
  }
}

async function openBag(row) {
  try {
    selected.value = await api(`/api/v1/bags/${row.id}`)
  } catch (err) {
    await notify.error(err.message)
  }
}
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Search corridor bags by code, customer, phone, or passport</p>
    <div class="toolbar-actions">
      <button
        class="ghost icon-btn"
        type="button"
        title="Refresh"
        aria-label="Refresh"
        @click="search"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <polyline points="20 4 20 9 15 9" />
        </svg>
      </button>
    </div>
  </div>

  <div class="card">
    <div class="filters">
      <input v-model="q" placeholder="Bag, name, phone, passport" @keyup.enter="search" />
      <button
        class="ghost icon-btn"
        type="button"
        title="Search"
        aria-label="Search"
        @click="search"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" class="clickable" @click="openBag(row)">
          <td>{{ row.code }}</td>
          <td>{{ row.customerName }}</td>
          <td>{{ row.statusLabel || row.status }}</td>
          <td>{{ row.currentLocation }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="selected" class="card">
    <h3>{{ selected.code }} · {{ selected.customer?.fullName }}</h3>
    <p>{{ selected.statusLabel }} · {{ selected.currentLocation }}</p>
    <p>Seal {{ selected.sealNumber || '—' }} · Storage {{ selected.storageCode || '—' }}</p>
    <p v-if="selected.shareMessage" class="muted">{{ selected.shareMessage }}</p>
  </div>
</template>
