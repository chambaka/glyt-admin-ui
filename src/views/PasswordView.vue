<script setup>
import { computed, ref } from 'vue'
import { api, logout } from '../api'
import PasswordField from '../components/PasswordField.vue'
import { confirmDialog, notify } from '../dialog'
import { evaluatePassword } from '../passwordPolicy'
import { saveSession, session } from '../session'

const currentPassword = ref('')
const newPassword = ref('')
const busy = ref(false)

const pwdEval = computed(() =>
  evaluatePassword(newPassword.value, {
    email: session.user?.email || '',
    name: session.user?.fullName || ''
  })
)

async function save() {
  if (!pwdEval.value.valid) {
    await notify.warn(pwdEval.value.firstError, { title: 'Password requirements' })
    return
  }
  busy.value = true
  try {
    const body = await api('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: currentPassword.value, newPassword: newPassword.value })
    })
    await notify.success('Password updated. Continuing to the ops console.')
    saveSession(body)
  } catch (error) {
    await notify.error(error.message)
  } finally {
    busy.value = false
  }
}

async function signOut() {
  const ok = await confirmDialog({
    title: 'Sign out',
    message: 'Sign out without changing your password?',
    confirmLabel: 'Sign out',
    tone: 'warn'
  })
  if (ok) logout()
}
</script>

<template>
  <section class="auth-stage">
    <div class="auth-hero">
      <div class="auth-hero-inner">
        <div class="logo-plate">
          <img src="/logo.png" alt="GoLyt — Go light. Explore more." />
        </div>
        <div class="corridor">Secure access</div>
        <p>Set a new password before entering the ops console.</p>
      </div>
    </div>

    <div class="auth-panel">
      <form class="auth-form" @submit.prevent="save">
        <div class="form-kicker">Required</div>
        <h2>Change password</h2>
        <p class="lede">
          Use Nexus staff rules: at least 10 characters with upper, lower, number, and special (!@#$%^&*).
        </p>

        <label>Current password</label>
        <PasswordField v-model="currentPassword" autocomplete="current-password" />
        <label>New password</label>
        <PasswordField v-model="newPassword" autocomplete="new-password" />
        <ul class="pwd-rules" aria-label="Password requirements">
          <li
            v-for="rule in pwdEval.rules"
            :key="rule.id"
            :class="{ met: rule.met }"
          >
            {{ rule.label }}
          </li>
        </ul>

        <div class="auth-actions">
          <button type="submit" :disabled="busy || !pwdEval.valid">
            {{ busy ? 'Saving…' : 'Save & continue' }}
          </button>
          <button
            class="ghost icon-btn"
            type="button"
            title="Sign out"
            aria-label="Sign out"
            @click="signOut"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
