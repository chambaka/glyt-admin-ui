<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../api'
import PasswordField from '../components/PasswordField.vue'
import { confirmDialog, notify } from '../dialog'
import { evaluatePassword, generateCompliantPassword } from '../passwordPolicy'
import { session } from '../session'

const rows = ref([])
const busy = ref(false)
const showDialog = ref(false)
const dialogMode = ref('create') // create | edit
const editingId = ref(null)

const emptyForm = () => ({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'KIA_OFFICER',
  location: 'KIA',
  active: true
})

const form = reactive(emptyForm())

const pwdEval = computed(() =>
  evaluatePassword(form.password, {
    email: form.email,
    name: form.fullName
  })
)

const dialogTitle = computed(() => (dialogMode.value === 'edit' ? 'Edit user' : 'Add user'))

const passwordRequired = computed(() => dialogMode.value === 'create')

const canSubmit = computed(() => {
  if (busy.value) return false
  if (passwordRequired.value) return pwdEval.value.valid
  if (form.password) return pwdEval.value.valid
  return true
})

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

function openCreate() {
  resetForm()
  dialogMode.value = 'create'
  showDialog.value = true
}

function openEdit(row) {
  editingId.value = row.id
  dialogMode.value = 'edit'
  form.fullName = row.fullName || ''
  form.email = row.email || ''
  form.phone = row.phone || ''
  form.password = ''
  form.role = row.role || 'KIA_OFFICER'
  form.location = row.location || 'ALL'
  form.active = row.active !== false
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  resetForm()
}

function suggestPassword() {
  form.password = generateCompliantPassword({
    email: form.email,
    name: form.fullName
  })
}

async function load() {
  try {
    rows.value = await api('/api/v1/users')
  } catch (err) {
    await notify.error(err.message)
  }
}

async function saveUser() {
  if (!form.phone?.trim()) {
    await notify.warn('A Tanzania phone number is required for SMS password delivery.', {
      title: 'Phone required'
    })
    return
  }
  if (passwordRequired.value && !pwdEval.value.valid) {
    await notify.warn(pwdEval.value.firstError, { title: 'Password requirements' })
    return
  }
  if (form.password && !pwdEval.value.valid) {
    await notify.warn(pwdEval.value.firstError, { title: 'Password requirements' })
    return
  }

  busy.value = true
  const email = form.email
  const creating = dialogMode.value === 'create'
  try {
    if (creating) {
      await api('/api/v1/users', { method: 'POST', body: JSON.stringify(form) })
      closeDialog()
      await notify.success(`User ${email} created. A welcome SMS was queued when configured.`)
    } else {
      const body = {
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
        location: form.location,
        active: form.active
      }
      if (form.password) body.password = form.password
      await api(`/api/v1/users/${editingId.value}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      closeDialog()
      await notify.success(`User ${email} updated.`)
    }
    await load()
  } catch (err) {
    await notify.error(err.message, {
      title: creating ? 'Could not create user' : 'Could not update user'
    })
  } finally {
    busy.value = false
  }
}

async function toggleActive(row) {
  const enabling = !row.active
  if (!enabling && session.user?.id === row.id) {
    await notify.warn('You cannot deactivate your own account.')
    return
  }
  const ok = await confirmDialog({
    title: enabling ? 'Activate user' : 'Deactivate user',
    message: enabling
      ? `Activate ${row.fullName} (${row.email})?`
      : `Deactivate ${row.fullName} (${row.email})? They will not be able to sign in.`,
    confirmLabel: enabling ? 'Activate' : 'Deactivate',
    tone: enabling ? 'warn' : 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/users/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: enabling })
    })
    await notify.success(enabling ? `${row.fullName} activated.` : `${row.fullName} deactivated.`)
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Could not update user' })
  }
}

async function deleteUser(row) {
  if (session.user?.id === row.id) {
    await notify.warn('You cannot delete your own account.')
    return
  }
  const ok = await confirmDialog({
    title: 'Delete user',
    message: `Delete ${row.fullName} (${row.email})?`,
    detail: 'Only unused accounts can be deleted. If the user has operational history, deactivate instead.',
    confirmLabel: 'Delete user',
    tone: 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/users/${row.id}`, { method: 'DELETE' })
    await notify.success(`${row.fullName} deleted.`)
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Cannot delete user' })
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Staff accounts for the ops console</p>
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
      <button type="button" @click="openCreate">Add user</button>
    </div>
  </div>

  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Role</th>
          <th>Location</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td colspan="7" class="muted">No users yet.</td>
        </tr>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.fullName }}</td>
          <td>{{ row.email }}</td>
          <td>{{ row.phone || '—' }}</td>
          <td>{{ row.role }}</td>
          <td>{{ row.location }}</td>
          <td>{{ row.active ? 'Active' : 'Disabled' }}</td>
          <td>
            <div class="row-actions">
              <button
                class="ghost icon-btn"
                type="button"
                title="Edit user"
                aria-label="Edit user"
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
                :title="row.active === false ? 'Activate user' : 'Deactivate user'"
                :aria-label="row.active === false ? 'Activate user' : 'Deactivate user'"
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </button>
              <button
                class="ghost icon-btn danger-icon"
                type="button"
                title="Delete user"
                aria-label="Delete user"
                @click="deleteUser(row)"
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
    <div
      class="modal-panel modal-panel-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-dialog-title"
    >
      <div class="modal-head">
        <h3 id="user-dialog-title">{{ dialogTitle }}</h3>
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

      <form class="modal-body" @submit.prevent="saveUser">
        <label>Name</label>
        <input v-model="form.fullName" required autocomplete="name" :disabled="busy" />
        <label>Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          :disabled="dialogMode === 'edit' || busy"
        />
        <p v-if="dialogMode === 'edit'" class="muted tiny">Email cannot change after create.</p>
        <label>Phone (SMS)</label>
        <input
          v-model="form.phone"
          type="tel"
          required
          autocomplete="tel"
          placeholder="+2557…"
          :disabled="busy"
        />
        <p class="muted tiny">
          {{ dialogMode === 'create'
            ? 'Welcome SMS with login details is sent to this number.'
            : 'Used for SMS password resets.' }}
        </p>
        <label>{{ dialogMode === 'create' ? 'Password' : 'New password (optional)' }}</label>
        <div class="pwd-field-row">
          <PasswordField
            v-model="form.password"
            :required="passwordRequired"
            autocomplete="new-password"
            :disabled="busy"
          />
          <button class="ghost" type="button" :disabled="busy" @click="suggestPassword">Generate</button>
        </div>
        <ul v-if="passwordRequired || form.password" class="pwd-rules" aria-label="Password requirements">
          <li
            v-for="rule in pwdEval.rules"
            :key="rule.id"
            :class="{ met: rule.met }"
          >
            {{ rule.label }}
          </li>
        </ul>
        <label>Role</label>
        <select v-model="form.role" :disabled="busy">
          <option>KIA_OFFICER</option>
          <option>ZNZ_OFFICER</option>
          <option>ADMIN</option>
          <option>READONLY</option>
        </select>
        <label>Location</label>
        <select v-model="form.location" :disabled="busy">
          <option>ALL</option>
          <option>KIA</option>
          <option>ZNZ</option>
        </select>
        <label v-if="dialogMode === 'edit'" class="check-row">
          <input v-model="form.active" type="checkbox" :disabled="busy" />
          Active
        </label>

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
            class="icon-btn"
            type="submit"
            :title="dialogMode === 'edit' ? 'Save changes' : 'Create user'"
            :aria-label="dialogMode === 'edit' ? 'Save changes' : 'Create user'"
            :disabled="!canSubmit"
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
