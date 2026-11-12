<script setup>
import { ref } from 'vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  autocomplete: { type: String, default: 'current-password' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  id: { type: String, default: undefined },
  name: { type: String, default: undefined }
})

const visible = ref(false)

function toggle() {
  visible.value = !visible.value
}
</script>

<template>
  <div class="pwd-input">
    <input
      :id="id"
      v-model="model"
      :name="name"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      :placeholder="placeholder"
    />
    <button
      class="ghost icon-btn pwd-toggle"
      type="button"
      :title="visible ? 'Hide password' : 'Show password'"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :disabled="disabled"
      @click="toggle"
    >
      <svg
        v-if="!visible"
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
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
        <circle cx="12" cy="12" r="3" />
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
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </button>
  </div>
</template>
