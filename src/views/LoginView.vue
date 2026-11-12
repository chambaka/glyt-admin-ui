<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api'
import PasswordField from '../components/PasswordField.vue'
import { notify } from '../dialog'
import { evaluatePassword } from '../passwordPolicy'
import { saveSession, session } from '../session'

const email = ref('lead@golyt.co.tz')
const password = ref('Golyt#2026')
const forgotEmail = ref('')
const resetCode = ref('')
const resetPassword = ref('')
const showForgot = ref(false)
const forgotStep = ref('request') // request | reset
const busy = ref(false)

onMounted(async () => {
  if (session.authMessage) {
    const msg = session.authMessage
    session.authMessage = ''
    await notify.warn(msg, { title: 'Session' })
  }
})

const resetEval = computed(() =>
  evaluatePassword(resetPassword.value, {
    email: (forgotEmail.value || email.value).trim(),
    name: ''
  })
)

async function signIn() {
  busy.value = true
  try {
    const body = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value.trim(), password: password.value })
    })
    if (body.user.role !== 'ADMIN' && body.user.role !== 'READONLY') {
      await notify.warn('KIA and Zanzibar officers sign in on the phone app.', {
        title: 'Wrong console'
      })
      return
    }
    saveSession(body)
  } catch (error) {
    await notify.error(error.message, { title: 'Sign in failed' })
  } finally {
    busy.value = false
  }
}

function openForgot() {
  showForgot.value = !showForgot.value
  if (showForgot.value) {
    forgotStep.value = 'request'
    forgotEmail.value = email.value
    resetCode.value = ''
    resetPassword.value = ''
  }
}

async function sendResetSms() {
  busy.value = true
  try {
    const body = await api('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: (forgotEmail.value || email.value).trim() })
    })
    const showToken = import.meta.env.DEV && body.resetToken
    await notify.success(
      showToken
        ? `${body.message}\n\nLocal SMS code: ${body.resetToken}`
        : body.message,
      { title: 'SMS reset' }
    )
    forgotStep.value = 'reset'
  } catch (error) {
    await notify.error(error.message)
  } finally {
    busy.value = false
  }
}

async function applyReset() {
  if (!resetEval.value.valid) {
    await notify.warn(resetEval.value.firstError, { title: 'Password requirements' })
    return
  }
  busy.value = true
  try {
    const body = await api('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: resetCode.value.trim(),
        password: resetPassword.value
      })
    })
    await notify.success(body.message, { title: 'Password updated' })
    showForgot.value = false
    forgotStep.value = 'request'
    password.value = ''
  } catch (error) {
    await notify.error(error.message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="auth-stage">
    <div class="auth-hero">
      <div class="auth-hero-inner">
        <div class="logo-plate">
          <img src="/logo.png" alt="GoLyt — Go light. Explore more." />
        </div>
        <div class="corridor">Kilimanjaro → Zanzibar</div>
        <p>
          The operations console for luggage custody across the corridor —
          exceptions, manifests, payments, and handoffs in one place.
        </p>
      </div>
    </div>

    <div class="auth-panel">
      <form class="auth-form" @submit.prevent="signIn">
        <div class="form-kicker">Staff access</div>
        <h2>Sign in</h2>
        <p class="lede">
          For operations lead and read-only accounts. Officers use the GoLyt phone app.
        </p>

        <label>Email</label>
        <input v-model="email" type="email" autocomplete="username" />
        <label>Password</label>
        <PasswordField v-model="password" autocomplete="current-password" />

        <div class="auth-actions">
          <button type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Enter console' }}</button>
          <a @click="openForgot">Forgot password</a>
        </div>

        <div v-if="showForgot" class="forgot-panel">
          <template v-if="forgotStep === 'request'">
            <label>Email for SMS reset</label>
            <input v-model="forgotEmail" type="email" :placeholder="email" />
            <p class="muted tiny">We send a short code by SMS to the phone on your account (same flow as Nexus).</p>
            <button class="ghost" type="button" :disabled="busy" @click="sendResetSms">
              {{ busy ? 'Sending…' : 'Send SMS code' }}
            </button>
          </template>
          <template v-else>
            <label>SMS code</label>
            <input
              v-model="resetCode"
              type="text"
              inputmode="text"
              autocomplete="one-time-code"
              maxlength="8"
              placeholder="5-character code"
            />
            <label>New password</label>
            <PasswordField v-model="resetPassword" autocomplete="new-password" />
            <ul class="pwd-rules" aria-label="Password requirements">
              <li
                v-for="rule in resetEval.rules"
                :key="rule.id"
                :class="{ met: rule.met }"
              >
                {{ rule.label }}
              </li>
            </ul>
            <div class="auth-actions">
              <button type="button" :disabled="busy || !resetEval.valid" @click="applyReset">
                {{ busy ? 'Saving…' : 'Set new password' }}
              </button>
              <button class="ghost" type="button" :disabled="busy" @click="sendResetSms">Resend SMS</button>
            </div>
          </template>
        </div>
      </form>
    </div>
  </section>
</template>
