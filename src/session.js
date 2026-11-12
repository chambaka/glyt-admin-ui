import { reactive } from 'vue'

function readUser() {
  const raw = sessionStorage.getItem('golytUser')
  return raw ? JSON.parse(raw) : null
}

export const session = reactive({
  token: sessionStorage.getItem('golytToken'),
  refresh: sessionStorage.getItem('golytRefresh'),
  user: readUser(),
  page: 'home',
  authMessage: ''
})

export function saveSession(body) {
  session.token = body.token
  session.refresh = body.refreshToken
  session.user = body.user
  session.authMessage = ''
  sessionStorage.setItem('golytToken', body.token)
  sessionStorage.setItem('golytRefresh', body.refreshToken)
  sessionStorage.setItem('golytUser', JSON.stringify(body.user))
}

export function clearSession(message = '') {
  session.token = null
  session.refresh = null
  session.user = null
  session.page = 'home'
  session.authMessage = message
  sessionStorage.removeItem('golytToken')
  sessionStorage.removeItem('golytRefresh')
  sessionStorage.removeItem('golytUser')
}
