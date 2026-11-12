/** Allowed special characters for staff passwords (aligned with Soleil Nexus). */
export const PASSWORD_SPECIAL_CHARS = '!@#$%^&*'

const COMMON_PASSWORDS = new Set(
  [
    'password',
    'password1',
    'password12',
    'password123',
    'password1234',
    '123456',
    '1234567',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty',
    'qwerty123',
    'abc123',
    '111111',
    '123123',
    'admin',
    'admin123',
    'letmein',
    'welcome',
    'welcome1',
    'monkey',
    'dragon',
    'master',
    'login',
    'princess',
    'football',
    'shadow',
    'sunshine',
    'iloveyou',
    'trustno1',
    'passw0rd',
    'p@ssw0rd',
    'p@ssword',
    'changeme',
    'secret',
    'soleil',
    'soleiltech',
    'nexus',
    'golyt',
    'administrator',
    'root',
    'test1234',
    'Password1',
    'Password123',
    'Password1!',
    'Qwerty123',
    'Welcome1',
    'Welcome1!'
  ].map((p) => p.toLowerCase())
)

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'Be at least 10 characters long',
    test: (password) => password.length >= 10
  },
  {
    id: 'upper',
    label: 'Include at least one uppercase letter (A-Z)',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    id: 'lower',
    label: 'Include at least one lowercase letter (a-z)',
    test: (password) => /[a-z]/.test(password)
  },
  {
    id: 'digit',
    label: 'Include at least one number (0-9)',
    test: (password) => /[0-9]/.test(password)
  },
  {
    id: 'special',
    label: `Include at least one special character (${PASSWORD_SPECIAL_CHARS})`,
    test: (password) => new RegExp(`[${escapeForCharClass(PASSWORD_SPECIAL_CHARS)}]`).test(password)
  },
  {
    id: 'notIdentity',
    label: 'Not contain your username or email address',
    test: (password, ctx) => !containsIdentity(password, ctx)
  },
  {
    id: 'notCommon',
    label: 'Not be a commonly used password',
    test: (password) => !isCommonPassword(password)
  }
]

function escapeForCharClass(value) {
  return value.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')
}

function identityTokens(ctx) {
  const tokens = []
  const email = (ctx?.email || '').trim().toLowerCase()
  if (email) {
    tokens.push(email)
    const local = email.split('@')[0]
    if (local.length >= 3) tokens.push(local)
  }
  const name = (ctx?.name || '').trim().toLowerCase()
  if (name.length >= 3) {
    tokens.push(name)
    for (const part of name.split(/\s+/)) {
      if (part.length >= 3) tokens.push(part)
    }
  }
  return [...new Set(tokens)]
}

export function containsIdentity(password, ctx) {
  const pwd = password.toLowerCase()
  if (!pwd) return false
  return identityTokens(ctx).some((token) => token && pwd.includes(token))
}

export function isCommonPassword(password) {
  const normalized = password.trim().toLowerCase()
  if (!normalized) return false
  return COMMON_PASSWORDS.has(normalized)
}

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const SPECIAL = PASSWORD_SPECIAL_CHARS
const ALL = UPPER + LOWER + DIGITS + SPECIAL

function randomInt(max) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

function pick(chars) {
  return chars[randomInt(chars.length)]
}

function shuffle(chars) {
  const arr = [...chars]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

/**
 * @param {{ email?: string, name?: string }} [ctx]
 * @param {{ length?: number }} [opts]
 */
export function generateCompliantPassword(ctx = {}, opts = {}) {
  const length = Math.max(12, opts.length || 14)
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)]
    const rest = []
    for (let i = required.length; i < length; i += 1) {
      rest.push(pick(ALL))
    }
    const password = shuffle([...required, ...rest])
    if (evaluatePassword(password, ctx).valid) {
      return password
    }
  }
  throw new Error('Could not generate a compliant password')
}

/**
 * @param {string} password
 * @param {{ email?: string, name?: string }} [ctx]
 */
export function evaluatePassword(password, ctx = {}) {
  const value = password || ''
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: value ? rule.test(value, ctx) : false
  }))
  const metCount = rules.filter((r) => r.met).length
  const valid = value.length > 0 && metCount === rules.length
  const firstFailed = rules.find((r) => !r.met)

  let strength = 0
  let strengthLabel = 'Too weak'
  if (!value) {
    strength = 0
    strengthLabel = 'Enter a password'
  } else if (metCount <= 2) {
    strength = 1
    strengthLabel = 'Weak'
  } else if (metCount <= 4) {
    strength = 2
    strengthLabel = 'Fair'
  } else if (metCount <= 6) {
    strength = 3
    strengthLabel = 'Good'
  } else {
    strength = 4
    strengthLabel = 'Strong'
  }

  return {
    rules,
    metCount,
    totalRules: rules.length,
    valid,
    firstError: valid ? null : firstFailed?.label || 'Password does not meet requirements.',
    strength,
    strengthLabel,
    strengthPercent: Math.round((metCount / rules.length) * 100)
  }
}
