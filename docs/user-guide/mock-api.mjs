import http from 'node:http'

const adminUser = {
  id: 5,
  fullName: 'Amina Hassan',
  email: 'lead@golyt.co.tz',
  phone: '+255700000001',
  role: 'ADMIN',
  location: 'ALL',
  active: true,
  mustChangePassword: false
}

const users = [
  adminUser,
  {
    id: 2,
    fullName: 'John Mrema',
    email: 'kia@golyt.co.tz',
    phone: '+255700000002',
    role: 'KIA_OFFICER',
    location: 'KIA',
    active: true,
    mustChangePassword: false
  },
  {
    id: 3,
    fullName: 'Fatma Ali',
    email: 'znz@golyt.co.tz',
    phone: '+255700000003',
    role: 'ZNZ_OFFICER',
    location: 'ZNZ',
    active: true,
    mustChangePassword: false
  },
  {
    id: 4,
    fullName: 'Peter Mgaya',
    email: 'board@golyt.co.tz',
    phone: '+255700000004',
    role: 'READONLY',
    location: 'ALL',
    active: true,
    mustChangePassword: false
  }
]

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  })
  res.end(payload)
}

function text(res, status, body, type = 'text/plain') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  })
  res.end(body)
}

function authBody() {
  return {
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
    mustChangePassword: false,
    user: adminUser
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:8070')
  const path = url.pathname

  if (req.method === 'OPTIONS') {
    return json(res, 204, {})
  }

  if (path === '/actuator/health') {
    return json(res, 200, { status: 'UP' })
  }

  if (path === '/api/v1/auth/login' || path === '/api/v1/auth/refresh') {
    return json(res, 200, authBody())
  }

  if (path === '/api/v1/auth/forgot-password') {
    return json(res, 200, {
      message: 'If that email is registered with a phone number, an SMS reset code was sent.',
      resetToken: 'A7K3M'
    })
  }

  if (path === '/api/v1/auth/reset-password') {
    return json(res, 200, { message: 'Password updated. Sign in with the new password.', resetToken: null })
  }

  if (path === '/api/v1/auth/change-password') {
    return json(res, 200, authBody())
  }

  if (path === '/api/v1/auth/logout') {
    return json(res, 200, { message: 'Signed out' })
  }

  if (path === '/api/v1/dashboard') {
    return json(res, 200, {
      receivedToday: 18,
      readyForAirline: 6,
      inAirlineCustody: 4,
      zanzibarStorage: 11,
      readyForCollection: 5,
      openExceptions: 2,
      alerts: [
        { level: 'WARN', message: '2 bags overdue for Zanzibar collection' },
        { level: 'RED', message: '1 open seal mismatch at KIA' }
      ]
    })
  }

  if (path === '/api/v1/workload') {
    return json(res, 200, {
      openExceptions: 2,
      overdueExceptions: 1,
      openSupportTickets: 3,
      pendingPayments: 4,
      bagsAtKia: 9,
      bagsAtZnz: 11,
      readyForCollection: 5,
      staffLoads: [
        { userId: 2, fullName: 'John Mrema', role: 'KIA_OFFICER', location: 'KIA', openExceptions: 5 },
        { userId: 3, fullName: 'Fatma Ali', role: 'ZNZ_OFFICER', location: 'ZNZ', openExceptions: 4 }
      ],
      slaQueue: [
        { id: 11, bagCode: 'BAG-0042', typeLabel: 'Seal mismatch', priority: 'HIGH', ageHours: 5, overdue: true, dueAt: '2026-11-11T20:00:00Z', assignedTo: 'John Mrema' },
        { id: 12, bagCode: 'BAG-0031', typeLabel: 'Uncollected', priority: 'MEDIUM', ageHours: 2, overdue: false, dueAt: '2026-11-11T22:00:00Z', assignedTo: 'Fatma Ali' }
      ]
    })
  }

  if (path === '/api/v1/exceptions' || /^\/api\/v1\/exceptions\/\d+$/.test(path) || /^\/api\/v1\/exceptions\/\d+\/resolve$/.test(path)) {
    if (!globalThis.__mockExceptions) {
      globalThis.__mockExceptions = [
        {
          id: 11,
          bagId: 42,
          bagCode: 'BAG-0042',
          type: 'SEAL_MISMATCH',
          typeLabel: 'Seal mismatch',
          priority: 'HIGH',
          status: 'OPEN',
          location: 'KIA',
          description: 'Seal number does not match intake record',
          raisedBy: 'John Mrema',
          assignedTo: 'Amina Hassan',
          resolutionNotes: null,
          resolvedBy: null,
          resolvedAt: null,
          createdAt: '2026-11-11T08:10:00Z',
          dueAt: '2026-11-11T12:10:00Z',
          overdue: true,
          ageHours: 6
        },
        {
          id: 12,
          bagId: 31,
          bagCode: 'BAG-0031',
          type: 'COLLECTION_DELAYED',
          typeLabel: 'Collection delayed',
          priority: 'NORMAL',
          status: 'OPEN',
          location: 'ZNZ',
          description: 'Bag ready for collection beyond SLA window',
          raisedBy: 'Fatma Ali',
          assignedTo: null,
          resolutionNotes: null,
          resolvedBy: null,
          resolvedAt: null,
          createdAt: '2026-11-11T09:40:00Z',
          dueAt: '2026-11-11T17:40:00Z',
          overdue: false,
          ageHours: 4
        }
      ]
    }
    const list = globalThis.__mockExceptions
    const idMatch = path.match(/^\/api\/v1\/exceptions\/(\d+)/)
    const id = idMatch ? Number(idMatch[1]) : null
    const row = id == null ? null : list.find((r) => r.id === id)

    if (req.method === 'PATCH' && row) {
      return readBody(req).then((body) => {
        let data = {}
        try {
          data = JSON.parse(body || '{}')
        } catch {
          data = {}
        }
        if (data.description != null) row.description = data.description
        if (data.priority != null) row.priority = data.priority
        return json(res, 200, row)
      })
    }

    if (req.method === 'POST' && path.endsWith('/resolve') && row) {
      return readBody(req).then((body) => {
        let data = {}
        try {
          data = JSON.parse(body || '{}')
        } catch {
          data = {}
        }
        row.status = 'RESOLVED'
        row.resolutionNotes = data.notes || ''
        row.resolvedBy = 'Amina Hassan'
        row.resolvedAt = new Date().toISOString()
        row.overdue = false
        return json(res, 200, row)
      })
    }

    if (req.method === 'GET' && path === '/api/v1/exceptions') {
      return json(res, 200, list)
    }
  }

  if (path.startsWith('/api/v1/support/inbox')) {
    return json(res, 200, [
      {
        id: 21,
        subject: 'Where is my bag?',
        body: 'Customer asks for live status after landing in Zanzibar.',
        customerName: 'Neema Juma',
        status: 'OPEN',
        bagCode: 'BAG-0028',
        createdAt: '2026-11-11T10:12:00Z',
        assignedTo: null
      },
      {
        id: 22,
        subject: 'Collection hours',
        body: 'Needs desk opening hours for same-day pickup.',
        customerName: 'James Okello',
        status: 'OPEN',
        bagCode: 'BAG-0033',
        createdAt: '2026-11-11T12:40:00Z',
        assignedTo: 'Fatma Ali'
      }
    ])
  }

  if (path.startsWith('/api/v1/bags/') && path !== '/api/v1/bags/') {
    return json(res, 200, {
      id: 101,
      code: 'BAG-0042',
      status: 'AT_KIA',
      statusLabel: 'At Kilimanjaro',
      currentLocation: 'KIA',
      sealNumber: 'SL-77821',
      storageCode: null,
      shareMessage: 'Track your bag with GoLyt.',
      customer: { fullName: 'Asha Mwinyi', phone: '+255712000111' }
    })
  }

  if (path.startsWith('/api/v1/bags')) {
    return json(res, 200, [
      { id: 101, code: 'BAG-0042', customerName: 'Asha Mwinyi', status: 'AT_KIA', statusLabel: 'At Kilimanjaro', currentLocation: 'KIA' },
      { id: 102, code: 'BAG-0038', customerName: 'Daniel Kimaro', status: 'IN_STORAGE', statusLabel: 'Zanzibar storage', currentLocation: 'ZNZ' },
      { id: 103, code: 'BAG-0031', customerName: 'Grace Ally', status: 'READY_FOR_COLLECTION', statusLabel: 'Ready for collection', currentLocation: 'ZNZ' }
    ])
  }

  if (path === '/api/v1/bookings') {
    return json(res, 200, [
      { id: 501, bookingNumber: 'BK-1001', customerName: 'Asha Mwinyi', status: 'CONFIRMED', kiaArrivalDate: '2026-11-11', zanzibarTravelDate: '2026-11-12', zanzibarFlight: 'PW701' },
      { id: 502, bookingNumber: 'BK-1002', customerName: 'Daniel Kimaro', status: 'PAID', kiaArrivalDate: '2026-11-11', zanzibarTravelDate: '2026-11-12', zanzibarFlight: 'TC202' }
    ])
  }

  if (path === '/api/v1/manifests') {
    return json(res, 200, [
      { id: 301, number: 'MF-2026-0111', airline: 'Precision Air', flightNumber: 'PW701', status: 'CLOSED', bagCount: 14, departureDate: '2026-11-11' },
      { id: 302, number: 'MF-2026-0112', airline: 'Air Tanzania', flightNumber: 'TC202', status: 'OPEN', bagCount: 8, departureDate: '2026-11-12' }
    ])
  }

  if (path.startsWith('/api/v1/payments')) {
    if (path.endsWith('.csv') || path.endsWith('.pdf')) {
      return text(res, 200, 'id,status\n1,SUCCEEDED\n', 'text/csv')
    }
    return json(res, 200, [
      { id: 701, provider: 'MPESA', status: 'SUCCEEDED', amountMinor: 7500000, currency: 'TZS', bookingNumber: 'BK-1001', receiptNumber: 'R-9001', customerEmail: 'asha@example.com' },
      { id: 702, provider: 'CARD', status: 'PENDING', amountMinor: 5000000, currency: 'TZS', bookingNumber: 'BK-1002', receiptNumber: null, customerEmail: 'daniel@example.com' },
      { id: 703, provider: 'MPESA', status: 'FAILED', amountMinor: 5000000, currency: 'TZS', bookingNumber: 'BK-1003', receiptNumber: null, customerEmail: 'grace@example.com' }
    ])
  }

  if (path === '/api/v1/facilities/locations') {
    return json(res, 200, [
      { id: 1, code: 'KIA', name: 'Kilimanjaro International Airport', locationType: 'AIRPORT', active: true },
      { id: 2, code: 'ZNZ', name: 'Abeid Amani Karume International Airport', locationType: 'AIRPORT', active: true }
    ])
  }

  if (path === '/api/v1/facilities/storage') {
    return json(res, 200, [
      { id: 1, code: 'A-01', facilityCode: 'ZNZ', active: true, occupied: true, bagCode: 'BAG-0038' },
      { id: 2, code: 'A-02', facilityCode: 'ZNZ', active: true, occupied: false, bagCode: null },
      { id: 3, code: 'B-01', facilityCode: 'ZNZ', active: true, occupied: true, bagCode: 'BAG-0031' }
    ])
  }

  if (path === '/api/v1/catalog/services') {
    return json(res, 200, [
      { id: 1, code: 'DOOR_TO_DESK', name: 'Door to desk', description: 'Corridor custody KIA to ZNZ', amountMinor: 5000000, currency: 'TZS', unit: 'PER_BAG', sortOrder: 10, active: true },
      { id: 2, code: 'OVERWEIGHT', name: 'Overweight handling', description: 'Extra handling above threshold', amountMinor: 1500000, currency: 'TZS', unit: 'PER_BAG', sortOrder: 20, active: true }
    ])
  }

  if (path.startsWith('/api/v1/reports/')) {
    return text(res, 200, 'bag_id,status\nBAG-0042,AT_KIA\n', 'text/csv')
  }

  if (path.startsWith('/api/v1/audits')) {
    return json(res, 200, [
      { id: 1, createdAt: '2026-11-11T18:01:00Z', userName: 'Amina Hassan', action: 'user created', previousValue: null, newValue: 'kia.officer@golyt.co.tz', location: 'ALL' },
      { id: 2, createdAt: '2026-11-11T17:20:00Z', userName: 'John Mrema', action: 'bag received', previousValue: null, newValue: 'BAG-0042', location: 'KIA' },
      { id: 3, createdAt: '2026-11-11T16:05:00Z', userName: 'Fatma Ali', action: 'bag stored', previousValue: 'intake', newValue: 'A-01', location: 'ZNZ' }
    ])
  }

  if (path === '/api/v1/users') {
    return json(res, 200, users)
  }

  if (path.startsWith('/api/v1/users/')) {
    return json(res, 200, adminUser)
  }

  if (path.startsWith('/api/v1/manifests/') && path.endsWith('/pdf')) {
    return text(res, 200, '%PDF-1.4 mock', 'application/pdf')
  }

  json(res, 404, { error: `No mock for ${path}` })
})

server.listen(8070, () => {
  console.log('Mock API listening on http://localhost:8070')
})
