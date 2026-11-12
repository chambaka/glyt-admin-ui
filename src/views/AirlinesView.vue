<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api'
import { confirmDialog, notify } from '../dialog'
import { session } from '../session'

const rows = ref([])
const busy = ref(false)
const showDialog = ref(false)
const dialogMode = ref('create') // create | edit
const selected = ref(null)

const isAdmin = () => session.user?.role === 'ADMIN'

const emptyForm = () => ({
  code: '',
  name: '',
  country: 'TZ',
  sortOrder: 100,
  active: true
})

const form = reactive(emptyForm())

async function load() {
  try {
    rows.value = await api('/api/v1/config/airlines')
  } catch (err) {
    await notify.error(err.message)
  }
}

function openCreate() {
  selected.value = null
  Object.assign(form, emptyForm())
  dialogMode.value = 'create'
  showDialog.value = true
}

function openEdit(row) {
  selected.value = row
  form.code = row.code || ''
  form.name = row.name || ''
  form.country = row.country || 'TZ'
  form.sortOrder = row.sortOrder ?? 100
  form.active = row.active !== false
  dialogMode.value = 'edit'
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  selected.value = null
}

async function save() {
  if (!isAdmin()) return
  busy.value = true
  try {
    if (dialogMode.value === 'create') {
      await api('/api/v1/config/airlines', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      closeDialog()
      await notify.success(`Airline ${form.code} created.`)
    } else if (selected.value) {
      await api(`/api/v1/config/airlines/${selected.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          sortOrder: form.sortOrder,
          active: form.active
        })
      })
      closeDialog()
      await notify.success(`Airline ${selected.value.code} updated.`)
    }
    await load()
  } catch (err) {
    await notify.error(err.message)
  } finally {
    busy.value = false
  }
}

async function toggleActive(row) {
  if (!isAdmin()) return
  const next = row.active === false
  const ok = await confirmDialog({
    title: next ? 'Activate airline' : 'Deactivate airline',
    message: next
      ? `Activate ${row.name} (${row.code})?`
      : `Deactivate ${row.name} (${row.code})?`,
    detail: next
      ? 'It will appear again in manifest airline dropdowns.'
      : 'It will be hidden from new manifests. Existing manifests keep the name.',
    confirmLabel: next ? 'Activate' : 'Deactivate',
    tone: next ? 'info' : 'warn'
  })
  if (!ok) return
  try {
    await api(`/api/v1/config/airlines/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: next })
    })
    await notify.success(next ? `${row.code} activated.` : `${row.code} deactivated.`)
    await load()
  } catch (err) {
    await notify.error(err.message)
  }
}

async function remove(row) {
  if (!isAdmin()) return
  const ok = await confirmDialog({
    title: 'Delete airline',
    message: `Delete ${row.name} (${row.code})?`,
    detail: 'Airlines referenced by manifests cannot be deleted — deactivate them instead.',
    confirmLabel: 'Delete',
    tone: 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/config/airlines/${row.id}`, { method: 'DELETE' })
    await notify.success(`${row.code} deleted.`)
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Cannot delete airline' })
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Tanzania corridor airlines used on manifests and reports</p>
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
      <button v-if="isAdmin()" type="button" @click="openCreate">Add airline</button>
    </div>
  </div>

  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Country</th>
          <th>Order</th>
          <th>Status</th>
          <th v-if="isAdmin()"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td :colspan="isAdmin() ? 6 : 5" class="muted">No airlines configured yet.</td>
        </tr>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.code }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.country }}</td>
          <td>{{ row.sortOrder }}</td>
          <td>{{ row.active ? 'Active' : 'Inactive' }}</td>
          <td v-if="isAdmin()">
            <div class="row-actions">
              <button
                class="ghost icon-btn"
                type="button"
                title="Edit airline"
                aria-label="Edit airline"
                @click="openEdit(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                class="ghost icon-btn"
                :class="{ 'danger-icon': row.active !== false }"
                type="button"
                :title="row.active === false ? 'Activate airline' : 'Deactivate airline'"
                :aria-label="row.active === false ? 'Activate airline' : 'Deactivate airline'"
                @click="toggleActive(row)"
              >
                <svg
                  v-if="row.active === false"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              </button>
              <button
                class="ghost icon-btn danger-icon"
                type="button"
                title="Delete airline"
                aria-label="Delete airline"
                @click="remove(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="showDialog" class="modal-backdrop" @click.self="closeDialog">
    <div class="modal-panel card" role="dialog" aria-modal="true">
      <h3>{{ dialogMode === 'create' ? 'Add airline' : 'Edit airline' }}</h3>
      <label class="field">
        <span>IATA / code</span>
        <input v-model="form.code" :disabled="dialogMode === 'edit'" maxlength="8" placeholder="e.g. PW" />
      </label>
      <label class="field">
        <span>Name</span>
        <input v-model="form.name" placeholder="Precision Air" />
      </label>
      <label class="field">
        <span>Country</span>
        <input v-model="form.country" maxlength="2" placeholder="TZ" />
      </label>
      <label class="field">
        <span>Sort order</span>
        <input v-model.number="form.sortOrder" type="number" min="0" />
      </label>
      <label class="check-row">
        <input v-model="form.active" type="checkbox" />
        Active (shown in dropdowns)
      </label>
      <div class="row-actions" style="margin-top: 16px; justify-content: flex-end">
        <button class="ghost" type="button" @click="closeDialog">Cancel</button>
        <button type="button" :disabled="busy" @click="save">
          {{ busy ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>
