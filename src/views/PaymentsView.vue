<script setup>
import { onMounted, ref } from 'vue'
import { api, downloadFile } from '../api'
import { confirmDialog, notify } from '../dialog'
import { session } from '../session'

const rows = ref([])
const status = ref('')
const refundReason = ref('')

async function load() {
  try {
    const query = status.value ? `?status=${encodeURIComponent(status.value)}` : ''
    rows.value = await api(`/api/v1/payments${query}`)
  } catch (err) {
    await notify.error(err.message)
  }
}

async function refund(id) {
  const ok = await confirmDialog({
    title: 'Refund payment',
    message: `Refund payment #${id}?`,
    detail: refundReason.value
      ? `Reason: ${refundReason.value}`
      : 'No custom reason entered — “Ops refund” will be used.',
    confirmLabel: 'Refund',
    tone: 'danger'
  })
  if (!ok) return
  try {
    await api(`/api/v1/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason: refundReason.value || 'Ops refund' })
    })
    await notify.success(`Payment #${id} refund submitted.`)
    await load()
  } catch (err) {
    await notify.error(err.message, { title: 'Refund failed' })
  }
}

async function downloadReconcile() {
  try {
    const params = new URLSearchParams()
    if (status.value) params.set('status', status.value)
    const query = params.toString()
    await downloadFile(
      `/api/v1/payments/reconcile.csv${query ? `?${query}` : ''}`,
      'payments-reconcile.csv',
      'Reconcile export failed'
    )
    await notify.success('Reconcile CSV downloaded.')
  } catch (err) {
    await notify.error(err.message)
  }
}

async function downloadReceipt(id) {
  try {
    await downloadFile(
      `/api/v1/payments/${id}/receipt.pdf`,
      `receipt-${id}.pdf`,
      'Receipt download failed'
    )
  } catch (err) {
    await notify.error(err.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="page-toolbar">
    <p class="tagline">Payment status, refunds, and reconcile export</p>
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
      <button class="ghost" type="button" @click="downloadReconcile">Export reconcile CSV</button>
    </div>
  </div>

  <div class="card">
    <div class="filters">
      <label class="field">
        <span>Status</span>
        <select v-model="status" @change="load">
          <option value="">All</option>
          <option>PENDING</option>
          <option>SUCCEEDED</option>
          <option>FAILED</option>
          <option>REFUNDED</option>
          <option>PARTIALLY_REFUNDED</option>
        </select>
      </label>
      <label class="field field-wide">
        <span>Refund reason</span>
        <input v-model="refundReason" placeholder="Optional reason for ADMIN refunds" />
      </label>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Provider</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Booking</th>
          <th>Receipt</th>
          <th>Customer</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :class="{ fail: row.status === 'FAILED' }">
          <td>{{ row.id }}</td>
          <td>{{ row.provider }}</td>
          <td>{{ row.status }}</td>
          <td>{{ row.currency }} {{ (row.amountMinor / 100).toLocaleString() }}</td>
          <td>{{ row.bookingNumber || '—' }}</td>
          <td>{{ row.receiptNumber || '—' }}</td>
          <td>{{ row.customerEmail || '—' }}</td>
          <td>
            <div class="row-actions">
              <button
                v-if="session.user?.role === 'ADMIN' && (row.status === 'SUCCEEDED' || row.status === 'PARTIALLY_REFUNDED')"
                class="ghost"
                type="button"
                @click="refund(row.id)"
              >
                Refund
              </button>
              <button v-if="row.receiptNumber" class="ghost" type="button" @click="downloadReceipt(row.id)">PDF</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
