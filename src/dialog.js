import { reactive } from 'vue'

/**
 * Global notice / confirm dialog host state.
 * Mount once via <AppDialogs /> in App.vue.
 */
export const dialogState = reactive({
  open: false,
  mode: 'alert', // alert | confirm
  tone: 'info', // info | success | warn | error | danger
  title: '',
  message: '',
  detail: '',
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
  busy: false,
  _resolver: null
})

function present(options) {
  if (dialogState._resolver) {
    dialogState._resolver(false)
    dialogState._resolver = null
  }
  dialogState.open = true
  dialogState.mode = options.mode || 'alert'
  dialogState.tone = options.tone || 'info'
  dialogState.title = options.title || defaultTitle(options.tone, options.mode)
  dialogState.message = options.message || ''
  dialogState.detail = options.detail || ''
  dialogState.confirmLabel = options.confirmLabel || (options.mode === 'confirm' ? 'Confirm' : 'OK')
  dialogState.cancelLabel = options.cancelLabel || 'Cancel'
  dialogState.busy = false

  return new Promise((resolve) => {
    dialogState._resolver = resolve
  })
}

function defaultTitle(tone, mode) {
  if (mode === 'confirm') return 'Please confirm'
  if (tone === 'success') return 'Done'
  if (tone === 'error' || tone === 'danger') return 'Something went wrong'
  if (tone === 'warn') return 'Notice'
  return 'Notice'
}

export function closeDialog(result = false) {
  if (!dialogState.open) return
  dialogState.open = false
  dialogState.busy = false
  const resolve = dialogState._resolver
  dialogState._resolver = null
  if (resolve) resolve(result)
}

export function confirmDialog(options = {}) {
  return present({
    mode: 'confirm',
    tone: options.tone || 'danger',
    title: options.title,
    message: options.message,
    detail: options.detail,
    confirmLabel: options.confirmLabel || 'Confirm',
    cancelLabel: options.cancelLabel || 'Cancel'
  })
}

export function alertDialog(options = {}) {
  return present({
    mode: 'alert',
    tone: options.tone || 'info',
    title: options.title,
    message: options.message,
    detail: options.detail,
    confirmLabel: options.confirmLabel || 'OK'
  })
}

export const notify = {
  info(message, opts = {}) {
    return alertDialog({ ...opts, tone: 'info', message, title: opts.title || 'Notice' })
  },
  success(message, opts = {}) {
    return alertDialog({ ...opts, tone: 'success', message, title: opts.title || 'Success' })
  },
  warn(message, opts = {}) {
    return alertDialog({ ...opts, tone: 'warn', message, title: opts.title || 'Notice' })
  },
  error(message, opts = {}) {
    return alertDialog({ ...opts, tone: 'error', message, title: opts.title || 'Error' })
  }
}
