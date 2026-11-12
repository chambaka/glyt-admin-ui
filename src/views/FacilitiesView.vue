<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../api'
import { confirmDialog, notify } from '../dialog'
import { session } from '../session'

const locations = ref([])
const storage = ref([])
const busy = ref(false)
const showDialog = ref(false)
const editingId = ref(null)

const isAdmin = () => session.user?.role === 'ADMIN'

const emptyForm = () => ({
  code: '',
  name: '',
  locationType: 'AIRPORT',
  active: true
})

const form = reactive(emptyForm())
const dialogTitle = computed(() => (editingId.value ? 'Edit facility' : 'Add facility'))

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

function openCreate() {
  resetForm()
  showDialog.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.code = row.code
  form.name = row.name
  form.locationType = row.locationType || 'AIRPORT'
  form.active = row.active !== false
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

async function load() {
  try {
    ;[locations.value, storage.value] = await Promise.all([
      api('/api/v1/facilities/locations'),
      api('/api/v1/facilities/storage')
    ])
  } catch (err) {
    await notify.error(err.message)
  }
}

async function saveFacility() {
  busy.value = true
  try {
    if (editingId.value) {
      await api(`/api/v1/facilities/locations/${editingId.value}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          locationType: form.locationType,
          active: form.active
        })
      })
      closeDialog()
      await notify.success(`Facility ${form.code} updated.`)
    } else {
      await api('/api/v1/facilities/locations', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      closeDialog()
      await notify.success(`Facility ${form.code} created.`)
    }
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Could not save facility' })
  } finally {
    busy.value = false
  }
}

async function toggleFacilityActive(row) {
  const enabling = row.active === false
  const ok = await confirmDialog({
    title: enabling ? 'Activate facility' : 'Deactivate facility',
    message: enabling
      ? `Activate facility ${row.code}?`
      : `Deactivate facility ${row.code}?`,
    detail: enabling
      ? 'It will be available again for staff, storage, and ops.'
      : 'Prefer deactivate over delete when the code is still referenced.',
    confirmLabel: enabling ? 'Activate' : 'Deactivate',
    tone: enabling ? 'warn' : 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/facilities/locations/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: row.name,
        locationType: row.locationType || 'AIRPORT',
        active: enabling
      })
    })
    await notify.success(
      enabling ? `Facility ${row.code} activated.` : `Facility ${row.code} deactivated.`
    )
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Could not update facility' })
  }
}

async function deleteFacility(row) {
  const ok = await confirmDialog({
    title: 'Delete facility',
    message: `Delete facility ${row.code}?`,
    detail: 'This only works if no staff, storage slots, or bags still reference it.',
    confirmLabel: 'Delete facility',
    tone: 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/facilities/locations/${row.id}`, { method: 'DELETE' })
    await notify.success(`Facility ${row.code} deleted.`)
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Cannot delete facility' })
  }
}

const storageForm = reactive({
  code: '',
  facilityCode: 'ZNZ',
  active: true
})
const showStorageDialog = ref(false)
const editingStorageId = ref(null)
const storageBusy = ref(false)

const storageDialogTitle = computed(() =>
  editingStorageId.value ? 'Edit storage slot' : 'Add storage slot'
)

const facilityOptions = computed(() => {
  const codes = locations.value.map((l) => l.code)
  if (!codes.includes('ZNZ')) codes.push('ZNZ')
  if (!codes.includes('KIA')) codes.push('KIA')
  return [...new Set(codes)].sort()
})

function openStorageCreate() {
  editingStorageId.value = null
  storageForm.code = ''
  storageForm.facilityCode = facilityOptions.value[0] || 'ZNZ'
  storageForm.active = true
  showStorageDialog.value = true
}

function openStorageEdit(row) {
  editingStorageId.value = row.id
  storageForm.code = row.code
  storageForm.facilityCode = row.facilityCode
  storageForm.active = row.active !== false
  showStorageDialog.value = true
}

function closeStorageDialog() {
  showStorageDialog.value = false
}

async function saveStorage() {
  storageBusy.value = true
  try {
    if (editingStorageId.value) {
      await api(`/api/v1/facilities/storage/${editingStorageId.value}`, {
        method: 'PATCH',
        body: JSON.stringify({
          facilityCode: storageForm.facilityCode,
          active: storageForm.active
        })
      })
      closeStorageDialog()
      await notify.success(`Storage slot ${storageForm.code} updated.`)
    } else {
      await api('/api/v1/facilities/storage', {
        method: 'POST',
        body: JSON.stringify(storageForm)
      })
      closeStorageDialog()
      await notify.success(`Storage slot ${storageForm.code} created.`)
    }
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Could not save storage slot' })
  } finally {
    storageBusy.value = false
  }
}

async function toggleStorageActive(row) {
  const enabling = row.active === false
  if (!enabling && row.occupied) {
    await notify.warn(
      `Storage slot ${row.code} is occupied. Move or release the bag before deactivating.`
    )
    return
  }
  const ok = await confirmDialog({
    title: enabling ? 'Activate storage slot' : 'Deactivate storage slot',
    message: enabling
      ? `Activate storage slot ${row.code}?`
      : `Deactivate storage slot ${row.code}?`,
    detail: enabling
      ? 'Officers can shelve bags into this slot again.'
      : 'Inactive slots stay in history but should not receive new bags.',
    confirmLabel: enabling ? 'Activate' : 'Deactivate',
    tone: enabling ? 'warn' : 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/facilities/storage/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        facilityCode: row.facilityCode,
        active: enabling
      })
    })
    await notify.success(
      enabling
        ? `Storage slot ${row.code} activated.`
        : `Storage slot ${row.code} deactivated.`
    )
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Could not update storage slot' })
  }
}

async function deleteStorage(row) {
  if (row.occupied) {
    await notify.warn(`Storage slot ${row.code} is occupied and cannot be deleted.`)
    return
  }
  const ok = await confirmDialog({
    title: 'Delete storage slot',
    message: `Delete storage slot ${row.code}?`,
    detail: 'Occupied slots cannot be deleted.',
    confirmLabel: 'Delete slot',
    tone: 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/facilities/storage/${row.id}`, { method: 'DELETE' })
    await notify.success(`Storage slot ${row.code} deleted.`)
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Cannot delete storage slot' })
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Corridor facilities and storage slots</p>
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
      <button v-if="isAdmin()" type="button" @click="openCreate">Add facility</button>
    </div>
  </div>

  <div class="card">
    <h3>Facilities</h3>
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Type</th>
          <th>Status</th>
          <th v-if="isAdmin()"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!locations.length">
          <td :colspan="isAdmin() ? 5 : 4" class="muted">No facilities yet.</td>
        </tr>
        <tr v-for="row in locations" :key="row.id">
          <td>{{ row.code }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.locationType }}</td>
          <td>{{ row.active ? 'Active' : 'Inactive' }}</td>
          <td v-if="isAdmin()">
            <div class="row-actions">
              <button
                class="ghost icon-btn"
                type="button"
                title="Edit facility"
                aria-label="Edit facility"
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
                :title="row.active === false ? 'Activate facility' : 'Deactivate facility'"
                :aria-label="row.active === false ? 'Activate facility' : 'Deactivate facility'"
                @click="toggleFacilityActive(row)"
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </button>
              <button
                class="ghost icon-btn danger-icon"
                type="button"
                title="Delete facility"
                aria-label="Delete facility"
                @click="deleteFacility(row)"
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
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="section-toolbar">
      <h3>Storage slots</h3>
      <button v-if="isAdmin()" class="ghost" type="button" @click="openStorageCreate">Add slot</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Facility</th>
          <th>Occupied</th>
          <th>Bag</th>
          <th>Status</th>
          <th v-if="isAdmin()"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!storage.length">
          <td :colspan="isAdmin() ? 6 : 5" class="muted">No storage slots yet.</td>
        </tr>
        <tr v-for="row in storage" :key="row.id">
          <td>{{ row.code }}</td>
          <td>{{ row.facilityCode }}</td>
          <td>{{ row.occupied ? 'Yes' : 'No' }}</td>
          <td>{{ row.bagCode || '—' }}</td>
          <td>{{ row.active ? 'Active' : 'Inactive' }}</td>
          <td v-if="isAdmin()">
            <div class="row-actions">
              <button
                class="ghost icon-btn"
                type="button"
                title="Edit storage slot"
                aria-label="Edit storage slot"
                @click="openStorageEdit(row)"
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
                :title="row.active === false ? 'Activate storage slot' : 'Deactivate storage slot'"
                :aria-label="row.active === false ? 'Activate storage slot' : 'Deactivate storage slot'"
                :disabled="row.active !== false && row.occupied"
                @click="toggleStorageActive(row)"
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </button>
              <button
                class="ghost icon-btn danger-icon"
                type="button"
                title="Delete storage slot"
                aria-label="Delete storage slot"
                :disabled="row.occupied"
                @click="deleteStorage(row)"
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
      </tbody>
    </table>
  </div>

  <div
    v-if="showDialog"
    class="modal-backdrop"
    role="presentation"
    @click.self="closeDialog"
  >
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="facility-dialog-title">
      <div class="modal-head">
        <h3 id="facility-dialog-title">{{ dialogTitle }}</h3>
        <button class="ghost icon-btn" type="button" title="Close" aria-label="Close" @click="closeDialog">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <form class="modal-body" @submit.prevent="saveFacility">
        <label>Code</label>
        <input v-model="form.code" required :disabled="!!editingId" autocomplete="off" />
        <p v-if="editingId" class="muted tiny">Facility code cannot change after create (referenced by staff, storage, and bags).</p>
        <label>Name</label>
        <input v-model="form.name" required />
        <label>Type</label>
        <select v-model="form.locationType">
          <option>AIRPORT</option>
          <option>HUB</option>
          <option>DESK</option>
          <option>OTHER</option>
        </select>
        <label class="check-row">
          <input v-model="form.active" type="checkbox" />
          Active
        </label>
        <div class="modal-actions">
          <button class="ghost" type="button" @click="closeDialog">Cancel</button>
          <button type="submit" :disabled="busy">
            {{ busy ? 'Saving…' : editingId ? 'Save changes' : 'Create facility' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <div
    v-if="showStorageDialog"
    class="modal-backdrop"
    role="presentation"
    @click.self="closeStorageDialog"
  >
    <div class="modal-panel" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>{{ storageDialogTitle }}</h3>
        <button class="ghost icon-btn" type="button" title="Close" aria-label="Close" @click="closeStorageDialog">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <form class="modal-body" @submit.prevent="saveStorage">
        <label>Code</label>
        <input v-model="storageForm.code" required :disabled="!!editingStorageId" autocomplete="off" />
        <label>Facility</label>
        <select v-model="storageForm.facilityCode" required>
          <option v-for="code in facilityOptions" :key="code" :value="code">{{ code }}</option>
        </select>
        <label class="check-row">
          <input v-model="storageForm.active" type="checkbox" />
          Active
        </label>
        <div class="modal-actions">
          <button class="ghost" type="button" @click="closeStorageDialog">Cancel</button>
          <button type="submit" :disabled="storageBusy">
            {{ storageBusy ? 'Saving…' : editingStorageId ? 'Save changes' : 'Create slot' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
