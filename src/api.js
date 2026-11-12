import { clearSession, saveSession, session } from './session'

const base = import.meta.env.VITE_API_URL || ''
const expiredMessage = 'Your session expired. Sign in again.'

let refreshInFlight = null

async function refreshSession() {
  if (!session.refresh) return false
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const renewed = await fetch(base + '/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken: session.refresh })
        })
        if (!renewed.ok) {
          endSession()
          return false
        }
        saveSession(await renewed.json())
        return true
      } catch {
        endSession()
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

function endSession() {
  if (session.user || session.token || session.refresh) {
    clearSession(expiredMessage)
  }
}

async function looksLikeExpiredSession(response) {
  if (response.status === 401) return true
  if (response.status !== 403) return false
  try {
    const text = await response.clone().text()
    if (!text) return true
    const body = JSON.parse(text)
    // Real API permission / password-change replies include an error message.
    return !body?.error
  } catch {
    return true
  }
}

async function authFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (session.token) headers.Authorization = `Bearer ${session.token}`

  let response = await fetch(base + path, { ...options, headers })

  if ((response.status === 401 || response.status === 403) && path !== '/api/v1/auth/refresh') {
    if (session.refresh) {
      const renewed = await refreshSession()
      if (renewed) {
        headers.Authorization = `Bearer ${session.token}`
        response = await fetch(base + path, { ...options, headers })
      }
    } else if (await looksLikeExpiredSession(response)) {
      endSession()
    }
  }

  if (session.user && await looksLikeExpiredSession(response)) {
    endSession()
  }

  return response
}

export async function api(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) }
  if (options.body) headers['Content-Type'] = 'application/json'

  const response = await authFetch(path, { ...options, headers })
  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  if (!response.ok) {
    if (!session.user && (response.status === 401 || response.status === 403)) {
      throw new Error(expiredMessage)
    }
    throw new Error(body?.error || 'Request failed')
  }
  return body
}

async function download(path, filename, failureMessage) {
  const response = await authFetch(path, {
    headers: { Accept: '*/*' }
  })
  if (!response.ok) {
    let message = failureMessage
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      if (!session.user) message = expiredMessage
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export async function downloadReport(kind, filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const query = params.toString()
  await download(
    `/api/v1/reports/${kind}${query ? `?${query}` : ''}`,
    `${kind}.csv`,
    'Report failed'
  )
}

export async function downloadFile(path, filename, failureMessage = 'Download failed') {
  await download(path, filename, failureMessage)
}

export async function logout() {
  const refresh = session.refresh
  try {
    if (refresh) {
      await fetch(base + '/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(session.token ? { Authorization: `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({ refreshToken: refresh })
      })
    }
  } catch {
    // The local session still ends if the API is unreachable.
  }
  clearSession()
}
