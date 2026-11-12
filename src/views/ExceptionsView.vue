<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../api'
import { confirmDialog, notify } from '../dialog'
import { session } from '../session'

const rows = ref([])
const busy = ref(false)
const showDialog = ref(false)
const selected = ref(null)

const form = reactive({
  description: '',
  priority: 'NORMAL',
  resolutionNotes: ''
})

const isAdmin = () => session.user?.role === 'ADMIN'

const canResolve = computed(
  () => selected.value && selected.value.status === 'OPEN' && isAdmin()
)

async function load() {
  try {
    rows.value = await api('/api/v1/exceptions')
  } catch (err) {
    await notify.error(err.message)
  }
}

function openResolve(row) {
  selected.value = row
  form.description = row.description || ''
  form.priority = row.priority || 'NORMAL'
  form.resolutionNotes = row.resolutionNotes || ''
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  selected.value = null
  form.description = ''
  form.priority = 'NORMAL'
  form.resolutionNotes = ''
}

function slaLabel(row) {
  if (!row) return '—'
  if (row.overdue) return `OVERDUE ${row.ageHours}h`
  if (row.dueAt) return `${row.ageHours ?? '—'}h / due ${row.dueAt}`
  return row.ageHours != null ? `${row.ageHours}h` : '—'
}

async function saveEdits() {
  if (!selected.value) return
  busy.value = true
  try {
    await api(`/api/v1/exceptions/${selected.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        description: form.description,
        priority: form.priority
      })
    })
    await notify.success('Exception details saved.')
    await load()
    const refreshed = rows.value.find((r) => r.id === selected.value.id)
    if (refreshed) {
      selected.value = refreshed
      form.description = refreshed.description || ''
      form.priority = refreshed.priority || 'NORMAL'
    }
  } catch (err) {
    await notify.error(err.message, { title: 'Could not save exception' })
  } finally {
    busy.value = false
  }
}

async function resolveException() {
  if (!selected.value) return
  const notes = form.resolutionNotes.trim()
  if (!notes) {
    await notify.warn('Resolution notes are required before closing this exception.')
    return
  }
  const ok = await confirmDialog({
    title: 'Resolve exception',
    message: `Mark exception for ${selected.value.bagCode} as resolved?`,
    detail: notes,
    confirmLabel: 'Resolve',
    tone: 'warn'
  })
  if (!ok) return

  busy.value = true
  try {
    const descriptionChanged = form.description !== (selected.value.description || '')
    const priorityChanged = form.priority !== (selected.value.priority || 'NORMAL')
    if (descriptionChanged || priorityChanged) {
      await api(`/api/v1/exceptions/${selected.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: form.description,
          priority: form.priority
        })
      })
    }
    await api(`/api/v1/exceptions/${selected.value.id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    })
    closeDialog()
    await notify.success('Exception resolved.')
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Could not resolve exception' })
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Bag incidents and SLA follow-up</p>
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
    <table>
      <thead>
        <tr>
          <th>Bag</th>
          <th>Type</th>
          <th>Priority</th>
          <th>Status</th>
          <th>SLA</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :class="{ fail: row.overdue }">
          <td>{{ row.bagCode }}</td>
          <td>{{ row.typeLabel || row.type }}</td>
          <td>{{ row.priority }}</td>
          <td>{{ row.status }}</td>
          <td>{{ slaLabel(row) }}</td>
          <td>{{ row.description }}</td>
          <td>
            <div class="row-actions">
              <button
                v-if="row.status === 'OPEN' && isAdmin()"
                class="ghost icon-btn"
                type="button"
                title="Resolve exception"
                aria-label="Resolve exception"
                @click="openResolve(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </button>
              <button
                v-else
                class="ghost icon-btn"
                type="button"
                title="View exception"
                aria-label="View exception"
                @click="openResolve(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="7" class="ok">No exceptions in this view.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-if="showDialog && selected"
    class="modal-backdrop"
    role="presentation"
    @click.self="closeDialog"
  >
    <div
      class="modal-panel modal-panel-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exception-dialog-title"
    >
      <div class="modal-head">
        <h3 id="exception-dialog-title">
          {{ canResolve ? 'Resolve exception' : 'Exception details' }}
        </h3>
        <button
          class="ghost icon-btn"
          type="button"
          title="Close"
          aria-label="Close"
          @click="closeDialog"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form class="modal-body" @submit.prevent="canResolve ? resolveException() : closeDialog()">
        <div class="detail-grid">
          <div>
            <span class="detail-label">Bag</span>
            <strong>{{ selected.bagCode }}</strong>
          </div>
          <div>
            <span class="detail-label">Type</span>
            <strong>{{ selected.typeLabel || selected.type }}</strong>
          </div>
          <div>
            <span class="detail-label">Status</span>
            <strong :class="{ fail: selected.overdue && selected.status === 'OPEN' }">
              {{ selected.status }}
            </strong>
          </div>
          <div>
            <span class="detail-label">SLA</span>
            <strong :class="{ fail: selected.overdue }">{{ slaLabel(selected) }}</strong>
          </div>
          <div>
            <span class="detail-label">Location</span>
            <strong>{{ selected.location || '—' }}</strong>
          </div>
          <div>
            <span class="detail-label">Raised by</span>
            <strong>{{ selected.raisedBy || '—' }}</strong>
          </div>
          <div>
            <span class="detail-label">Assigned</span>
            <strong>{{ selected.assignedTo || '—' }}</strong>
          </div>
          <div>
            <span class="detail-label">Opened</span>
            <strong>{{ selected.createdAt || '—' }}</strong>
          </div>
        </div>

        <label>Priority</label>
        <select v-model="form.priority" :disabled="!canResolve || busy">
          <option value="NORMAL">NORMAL</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        <label>Incident notes</label>
        <textarea
          v-model="form.description"
          rows="3"
          :disabled="!canResolve || busy"
          placeholder="What happened / what was found"
        />

        <template v-if="canResolve">
          <label>Resolution notes</label>
          <textarea
            v-model="form.resolutionNotes"
            rows="3"
            required
            :disabled="busy"
            placeholder="How this was closed"
          />
          <p class="muted tiny">Required to resolve. Incident notes and priority can be updated before closing.</p>
        </template>
        <template v-else-if="selected.resolutionNotes">
          <label>Resolution notes</label>
          <textarea :value="selected.resolutionNotes" rows="3" readonly />
          <p class="muted tiny">
            Resolved by {{ selected.resolvedBy || '—' }}
            <span v-if="selected.resolvedAt"> · {{ selected.resolvedAt }}</span>
          </p>
        </template>

        <div class="modal-actions">
          <button
            class="ghost icon-btn"
            type="button"
            title="Cancel"
            aria-label="Cancel"
            :disabled="busy"
            @click="closeDialog"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            v-if="canResolve"
            class="ghost icon-btn"
            type="button"
            title="Save changes"
            aria-label="Save changes"
            :disabled="busy"
            @click="saveEdits"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
          <button
            v-if="canResolve"
            class="icon-btn"
            type="submit"
            title="Resolve"
            aria-label="Resolve"
            :disabled="busy"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
