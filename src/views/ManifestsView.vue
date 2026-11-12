<script setup>
import { onMounted, ref } from 'vue'
import { api, downloadFile } from '../api'
import { notify } from '../dialog'

const rows = ref([])
const selected = ref(null)
const showDialog = ref(false)
const busy = ref(false)

async function load() {
  try {
    rows.value = await api('/api/v1/manifests')
  } catch (err) {
    await notify.error(err.message)
  }
}

async function viewManifest(row) {
  busy.value = true
  try {
    selected.value = await api(`/api/v1/manifests/${row.id}`)
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

async function downloadPdf(row) {
  try {
    await downloadFile(
      `/api/v1/manifests/${row.id}/pdf`,
      `${row.number || row.id}.pdf`,
      'PDF download failed'
    )
  } catch (err) {
    await notify.error(err.message)
  }
}

function field(value) {
  return value || '—'
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Airline handoff manifests</p>
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
          <th>Airline</th>
          <th>Flight</th>
          <th>Bags</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.number }}</td>
          <td>{{ row.airline }}</td>
          <td>{{ row.flightNumber }}</td>
          <td>{{ row.bagCount }}</td>
          <td>{{ row.status }}</td>
          <td>
            <div class="row-actions">
              <button
                class="ghost icon-btn"
                type="button"
                title="View manifest"
                aria-label="View manifest"
                :disabled="busy"
                @click="viewManifest(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <button
                class="ghost icon-btn"
                type="button"
                title="Download PDF"
                aria-label="Download PDF"
                @click="downloadPdf(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="6" class="ok">No manifests yet.</td>
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
      aria-labelledby="manifest-dialog-title"
    >
      <div class="modal-head">
        <h3 id="manifest-dialog-title">
          Manifest {{ selected.number || selected.id }}
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
            <span class="detail-label">Airline</span>
            <strong>{{ field(selected.airline) }}</strong>
          </div>
          <div>
            <span class="detail-label">Flight</span>
            <strong>{{ field(selected.flightNumber) }}</strong>
          </div>
          <div>
            <span class="detail-label">Status</span>
            <strong>{{ field(selected.status) }}</strong>
          </div>
          <div>
            <span class="detail-label">Route</span>
            <strong>{{ field(selected.route) }}</strong>
          </div>
          <div>
            <span class="detail-label">Date</span>
            <strong>{{ field(selected.manifestDate) }}</strong>
          </div>
          <div>
            <span class="detail-label">Prepared by</span>
            <strong>{{ field(selected.preparedBy) }}</strong>
          </div>
          <div>
            <span class="detail-label">Bags</span>
            <strong>{{ selected.bagCount ?? (selected.bags?.length ?? '—') }}</strong>
          </div>
          <div>
            <span class="detail-label">Total weight</span>
            <strong>{{ selected.totalWeight != null ? `${selected.totalWeight} kg` : '—' }}</strong>
          </div>
          <div>
            <span class="detail-label">Handover</span>
            <strong>{{ field(selected.handoverAt) }}</strong>
          </div>
          <div>
            <span class="detail-label">Received</span>
            <strong>{{ selected.receivedCount != null ? selected.receivedCount : '—' }}</strong>
          </div>
        </div>

        <label>Notes</label>
        <textarea :value="selected.notes || ''" rows="2" readonly placeholder="No notes" />

        <h3 v-if="selected.bags?.length" class="modal-section-title">Bags on manifest</h3>
        <table v-if="selected.bags?.length" class="compact-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer</th>
              <th>Seal</th>
              <th>Weight</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bag in selected.bags" :key="bag.id">
              <td>{{ bag.code }}</td>
              <td>{{ bag.customerName || '—' }}</td>
              <td>{{ bag.sealNumber || '—' }}</td>
              <td>{{ bag.weightKg != null ? `${bag.weightKg} kg` : '—' }}</td>
              <td>{{ bag.statusLabel || bag.status || '—' }}</td>
            </tr>
          </tbody>
        </table>

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
          <button
            class="icon-btn"
            type="button"
            title="Download PDF"
            aria-label="Download PDF"
            @click="downloadPdf(selected)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
