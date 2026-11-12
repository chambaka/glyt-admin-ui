<script setup>
import { computed } from 'vue'
import { closeDialog, dialogState } from '../dialog'

const toneClass = computed(() => `tone-${dialogState.tone}`)

const confirmKind = computed(() => {
  const label = (dialogState.confirmLabel || '').toLowerCase()
  const title = (dialogState.title || '').toLowerCase()
  if (/sign out|log out|logout/.test(label) || /sign out|log out|logout/.test(title)) {
    return 'logout'
  }
  if (/delete|remove|deactivate/.test(label) || dialogState.tone === 'danger') {
    return 'danger'
  }
  if (dialogState.tone === 'success' || /save|ok|confirm|resolve|enable|activate/.test(label)) {
    return 'check'
  }
  return 'check'
})
</script>

<template>
  <div
    v-if="dialogState.open"
    class="modal-backdrop notice-backdrop"
    role="presentation"
    @click.self="dialogState.mode === 'confirm' ? closeDialog(false) : closeDialog(true)"
  >
    <div
      class="modal-panel notice-panel"
      :class="toneClass"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="app-dialog-title"
      aria-describedby="app-dialog-message"
    >
      <div class="notice-head">
        <span class="notice-badge" aria-hidden="true">
          <svg
            v-if="confirmKind === 'logout' || dialogState.tone === 'warn'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <template v-if="confirmKind === 'logout'">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </template>
            <template v-else>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </template>
          </svg>
          <svg
            v-else-if="dialogState.tone === 'success'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <svg
            v-else-if="dialogState.tone === 'error' || dialogState.tone === 'danger'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
        <div>
          <h3 id="app-dialog-title">{{ dialogState.title }}</h3>
          <p id="app-dialog-message" class="notice-message">{{ dialogState.message }}</p>
          <p v-if="dialogState.detail" class="notice-detail">{{ dialogState.detail }}</p>
        </div>
      </div>

      <div class="modal-actions notice-actions">
        <button
          v-if="dialogState.mode === 'confirm'"
          class="ghost icon-btn"
          type="button"
          :title="dialogState.cancelLabel"
          :aria-label="dialogState.cancelLabel"
          @click="closeDialog(false)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          class="icon-btn"
          type="button"
          :class="{ danger: dialogState.tone === 'danger' || dialogState.tone === 'error' }"
          :title="dialogState.confirmLabel"
          :aria-label="dialogState.confirmLabel"
          @click="closeDialog(true)"
        >
          <svg
            v-if="confirmKind === 'logout'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <svg
            v-else-if="confirmKind === 'danger'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
