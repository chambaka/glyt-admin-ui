<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'
import { confirmDialog, notify } from '../dialog'
import { session } from '../session'

const rows = ref([])
const users = ref([])
const status = ref('OPEN')
const notes = ref('')
const activeId = ref(null)
const assignId = ref(null)
const assignee = ref('')

const canWrite = () => ['ADMIN', 'KIA_OFFICER', 'ZNZ_OFFICER'].includes(session.user?.role)

async function load() {
  try {
    const query = status.value ? `?status=${encodeURIComponent(status.value)}` : ''
    rows.value = await api(`/api/v1/support/inbox${query}`)
    if (canWrite()) {
      users.value = await api('/api/v1/users')
    }
  } catch (err) {
    await notify.error(err.message)
  }
}

async function assign(id) {
  try {
    await api(`/api/v1/support/inbox/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        assignedToId: assignee.value ? Number(assignee.value) : null
      })
    })
    assignId.value = null
    assignee.value = ''
    await notify.success('Ticket assigned.')
    await load()
  } catch (err) {
    await notify.error(err.message)
  }
}

async function resolve(id) {
  const ok = await confirmDialog({
    title: 'Resolve ticket',
    message: 'Mark this support ticket as resolved?',
    detail: notes.value ? `Notes: ${notes.value}` : 'No resolution notes entered.',
    confirmLabel: 'Resolve',
    tone: 'warn'
  })
  if (!ok) return
  try {
    await api(`/api/v1/support/inbox/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes.value })
    })
    notes.value = ''
    activeId.value = null
    await notify.success('Ticket resolved.')
    await load()
  } catch (err) {
    await notify.error(err.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Customer tickets triage</p>
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

  <div class="card">
    <div class="filters">
      <label class="field">
        <span>Status</span>
        <select v-model="status" @change="load">
          <option value="">All</option>
          <option>OPEN</option>
          <option>RESOLVED</option>
          <option>CLOSED</option>
        </select>
      </label>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Subject</th>
          <th>Customer</th>
          <th>Bag</th>
          <th>Status</th>
          <th>Assigned</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.id }}</td>
          <td>
            <strong>{{ row.subject }}</strong>
            <div class="muted">{{ row.body }}</div>
            <div v-if="row.resolutionNotes" class="muted">Resolution: {{ row.resolutionNotes }}</div>
          </td>
          <td>{{ row.customerName || row.customerEmail || '—' }}</td>
          <td>{{ row.bagCode || '—' }}</td>
          <td>{{ row.status }}</td>
          <td>{{ row.assignedTo || '—' }}</td>
          <td>{{ row.createdAt }}</td>
          <td>
            <div v-if="row.status === 'OPEN' && canWrite()" class="row-actions">
              <button
                v-if="assignId !== row.id"
                class="ghost"
                type="button"
                @click="assignId = row.id"
              >Assign</button>
              <form v-else class="row-actions" @submit.prevent="assign(row.id)">
                <select v-model="assignee">
                  <option value="">Unassigned</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">{{ u.fullName }}</option>
                </select>
                <button type="submit">Save</button>
              </form>
              <button
                v-if="activeId !== row.id"
                class="ghost"
                type="button"
                @click="activeId = row.id"
              >Resolve</button>
              <form v-else class="row-actions" @submit.prevent="resolve(row.id)">
                <input v-model="notes" placeholder="Resolution notes" required />
                <button type="submit">Close</button>
              </form>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="8" class="ok">No tickets in this view.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
