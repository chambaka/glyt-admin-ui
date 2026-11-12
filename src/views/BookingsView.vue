<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api'
import { notify } from '../dialog'

const rows = ref([])
const selected = ref(null)
const showDialog = ref(false)
const busy = ref(false)

async function load() {
  try {
    rows.value = await api('/api/v1/bookings')
  } catch (err) {
    await notify.error(err.message)
  }
}

async function viewBooking(row) {
  busy.value = true
  try {
    selected.value = await api(`/api/v1/bookings/${row.id}`)
  } catch {
    selected.value = row
  } finally {
    busy.value = false
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  selected.value = null
}

function field(value) {
  return value || '—'
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Corridor bookings</p>
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
    </div>
  </div>

  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Number</th>
          <th>Customer</th>
          <th>Status</th>
          <th>KIA date</th>
          <th>ZNZ date</th>
          <th>Flight</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.bookingNumber || row.number || row.id }}</td>
          <td>{{ row.customerName || ('#' + row.customerId) }}</td>
          <td>{{ row.status }}</td>
          <td>{{ row.kiaArrivalDate || '—' }}</td>
          <td>{{ row.zanzibarTravelDate || '—' }}</td>
          <td>{{ row.zanzibarFlight || row.internationalArrivalFlight || '—' }}</td>
          <td>
            <div class="row-actions">
              <button
                class="ghost icon-btn"
                type="button"
                title="View booking"
                aria-label="View booking"
                :disabled="busy"
                @click="viewBooking(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="7" class="ok">No bookings yet.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-if="showDialog && selected"
    class="modal-backdrop"
    role="presentation"
    @click.self="closeDialog"
  >
    <div
      class="modal-panel modal-panel-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-dialog-title"
    >
      <div class="modal-head">
        <h3 id="booking-dialog-title">
          Booking {{ selected.bookingNumber || selected.number || selected.id }}
        </h3>
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

      <div class="modal-body">
        <div class="detail-grid">
          <div>
            <span class="detail-label">Customer</span>
            <strong>{{ field(selected.customerName || (selected.customerId ? '#' + selected.customerId : null)) }}</strong>
          </div>
          <div>
            <span class="detail-label">Status</span>
            <strong>{{ field(selected.status) }}</strong>
          </div>
          <div>
            <span class="detail-label">KIA arrival</span>
            <strong>{{ field(selected.kiaArrivalDate) }}</strong>
          </div>
          <div>
            <span class="detail-label">ZNZ travel</span>
            <strong>{{ field(selected.zanzibarTravelDate) }}</strong>
          </div>
          <div>
            <span class="detail-label">Intl flight</span>
            <strong>{{ field(selected.internationalArrivalFlight) }}</strong>
          </div>
          <div>
            <span class="detail-label">ZNZ flight</span>
            <strong>{{ field(selected.zanzibarFlight) }}</strong>
          </div>
          <div>
            <span class="detail-label">Tour operator</span>
            <strong>{{ field(selected.tourOperator) }}</strong>
          </div>
          <div>
            <span class="detail-label">Reference</span>
            <strong>{{ field(selected.bookingReference) }}</strong>
          </div>
          <div>
            <span class="detail-label">Hotel</span>
            <strong>{{ field(selected.zanzibarHotel) }}</strong>
          </div>
        </div>

        <label>Notes</label>
        <textarea :value="selected.notes || ''" rows="3" readonly placeholder="No notes" />

        <div class="modal-actions">
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
      </div>
    </div>
  </div>
</template>
