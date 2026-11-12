<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../api'
import { confirmDialog, notify } from '../dialog'
import { session } from '../session'

const rows = ref([])
const busy = ref(false)
const showDialog = ref(false)
const dialogMode = ref('view') // view | edit | create
const selected = ref(null)

const isAdmin = () => session.user?.role === 'ADMIN'

const emptyForm = () => ({
  code: '',
  name: '',
  description: '',
  sortOrder: 100,
  currency: 'TZS',
  amountMinor: 5000000,
  unit: 'PER_BAG',
  active: true
})

const form = reactive(emptyForm())

const dialogTitle = computed(() => {
  if (dialogMode.value === 'create') return 'Add service'
  if (dialogMode.value === 'edit') return 'Edit service'
  return 'Service details'
})

const canEdit = computed(() => isAdmin() && (dialogMode.value === 'edit' || dialogMode.value === 'create'))

async function load() {
  try {
    rows.value = await api('/api/v1/catalog/services')
  } catch (err) {
    await notify.error(err.message)
  }
}

function money(row) {
  if (row?.amountMinor == null) return '—'
  return `${row.currency || 'TZS'} ${(row.amountMinor / 100).toLocaleString()}`
}

function fillForm(row) {
  form.code = row?.code || ''
  form.name = row?.name || ''
  form.description = row?.description || ''
  form.sortOrder = row?.sortOrder ?? 100
  form.currency = row?.currency || 'TZS'
  form.amountMinor = row?.amountMinor ?? 5000000
  form.unit = row?.unit || 'PER_BAG'
  form.active = row?.active !== false
}

function openView(row) {
  selected.value = row
  fillForm(row)
  dialogMode.value = 'view'
  showDialog.value = true
}

function openEdit(row) {
  selected.value = row
  fillForm(row)
  dialogMode.value = 'edit'
  showDialog.value = true
}

function openCreate() {
  selected.value = null
  Object.assign(form, emptyForm())
  dialogMode.value = 'create'
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  selected.value = null
}

async function saveService() {
  if (!canEdit.value) return
  busy.value = true
  try {
    if (dialogMode.value === 'create') {
      await api('/api/v1/catalog/services', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      closeDialog()
      await notify.success(`Service ${form.code} created.`)
    } else if (selected.value) {
      await api(`/api/v1/catalog/services/${selected.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          active: form.active,
          sortOrder: Number(form.sortOrder),
          currency: form.currency,
          amountMinor: Number(form.amountMinor),
          unit: form.unit
        })
      })
      closeDialog()
      await notify.success(`Service ${form.code} updated.`)
    }
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Could not save service' })
  } finally {
    busy.value = false
  }
}

async function deleteService(row) {
  const ok = await confirmDialog({
    title: 'Delete service',
    message: `Delete ${row.name} (${row.code})?`,
    detail: 'Only unused services can be deleted. If quotations already reference it, deactivate from Edit instead.',
    confirmLabel: 'Delete service',
    tone: 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/catalog/services/${row.id}`, { method: 'DELETE' })
    await notify.success(`${row.code} deleted.`)
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Cannot delete service' })
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Services and active prices</p>
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
      <button v-if="isAdmin()" type="button" @click="openCreate">Add service</button>
    </div>
  </div>

  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Price</th>
          <th>Unit</th>
          <th>Sort</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.code }}</td>
          <td>
            <strong>{{ row.name }}</strong>
            <div class="tagline">{{ row.description || '' }}</div>
          </td>
          <td>{{ money(row) }}</td>
          <td>{{ row.unit || '—' }}</td>
          <td>{{ row.sortOrder }}</td>
          <td>{{ row.active ? 'Active' : 'Inactive' }}</td>
          <td>
            <div class="row-actions">
              <button
                class="ghost icon-btn"
                type="button"
                title="View service"
                aria-label="View service"
                @click="openView(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <button
                v-if="isAdmin()"
                class="ghost icon-btn"
                type="button"
                title="Edit service"
                aria-label="Edit service"
                @click="openEdit(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                v-if="isAdmin()"
                class="ghost icon-btn danger-icon"
                type="button"
                title="Delete service"
                aria-label="Delete service"
                @click="deleteService(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="7" class="ok">No services in the catalog yet.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-if="showDialog"
    class="modal-backdrop"
    role="presentation"
    @click.self="closeDialog"
  >
    <div
      class="modal-panel modal-panel-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-dialog-title"
    >
      <div class="modal-head">
        <h3 id="catalog-dialog-title">{{ dialogTitle }}</h3>
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

      <form class="modal-body" @submit.prevent="canEdit ? saveService() : closeDialog()">
        <div v-if="dialogMode === 'view'" class="detail-grid">
          <div>
            <span class="detail-label">Code</span>
            <strong>{{ form.code || '—' }}</strong>
          </div>
          <div>
            <span class="detail-label">Status</span>
            <strong>{{ form.active ? 'Active' : 'Inactive' }}</strong>
          </div>
          <div>
            <span class="detail-label">Name</span>
            <strong>{{ form.name || '—' }}</strong>
          </div>
          <div>
            <span class="detail-label">Price</span>
            <strong>{{ money(form) }}</strong>
          </div>
          <div>
            <span class="detail-label">Unit</span>
            <strong>{{ form.unit || '—' }}</strong>
          </div>
          <div>
            <span class="detail-label">Sort</span>
            <strong>{{ form.sortOrder }}</strong>
          </div>
        </div>

        <template v-if="dialogMode === 'view'">
          <label>Description</label>
          <textarea :value="form.description || ''" rows="3" readonly placeholder="No description" />
        </template>

        <template v-else>
          <label>Code</label>
          <input
            v-model="form.code"
            required
            :disabled="dialogMode === 'edit' || busy"
            autocomplete="off"
          />
          <p v-if="dialogMode === 'edit'" class="muted tiny">Service code cannot change after create.</p>

          <label>Name</label>
          <input v-model="form.name" required :disabled="busy" />

          <label>Description</label>
          <textarea v-model="form.description" rows="3" :disabled="busy" />

          <label>Amount (minor units)</label>
          <input v-model.number="form.amountMinor" type="number" min="1" required :disabled="busy" />
          <p class="muted tiny">TZS 50,000.00 is entered as 5000000.</p>

          <label>Currency</label>
          <input v-model="form.currency" required :disabled="busy" />

          <label>Unit</label>
          <select v-model="form.unit" :disabled="busy">
            <option>PER_BAG</option>
            <option>PER_BOOKING</option>
            <option>FLAT</option>
          </select>

          <label>Sort order</label>
          <input v-model.number="form.sortOrder" type="number" :disabled="busy" />

          <label class="check-row">
            <input v-model="form.active" type="checkbox" :disabled="busy" />
            Active
          </label>
        </template>

        <div class="modal-actions">
          <button
            class="ghost icon-btn"
            type="button"
            title="Close"
            aria-label="Close"
            :disabled="busy"
            @click="closeDialog"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            v-if="dialogMode === 'view' && isAdmin()"
            class="ghost icon-btn"
            type="button"
            title="Edit service"
            aria-label="Edit service"
            @click="dialogMode = 'edit'"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            v-if="canEdit"
            class="icon-btn"
            type="submit"
            :title="dialogMode === 'create' ? 'Create service' : 'Save changes'"
            :aria-label="dialogMode === 'create' ? 'Create service' : 'Save changes'"
            :disabled="busy"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
