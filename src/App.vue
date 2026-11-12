<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { session } from './session'
import { logout } from './api'
import { confirmDialog } from './dialog'
import AppDialogs from './components/AppDialogs.vue'
import LoginView from './views/LoginView.vue'
import PasswordView from './views/PasswordView.vue'
import DashboardView from './views/DashboardView.vue'
import WorkloadView from './views/WorkloadView.vue'
import ExceptionsView from './views/ExceptionsView.vue'
import ReportsView from './views/ReportsView.vue'
import UsersView from './views/UsersView.vue'
import BagsView from './views/BagsView.vue'
import BookingsView from './views/BookingsView.vue'
import ManifestsView from './views/ManifestsView.vue'
import PaymentsView from './views/PaymentsView.vue'
import FacilitiesView from './views/FacilitiesView.vue'
import CatalogView from './views/CatalogView.vue'
import AirlinesView from './views/AirlinesView.vue'
import SupportView from './views/SupportView.vue'
import AuditView from './views/AuditView.vue'

const titles = {
  home: 'Dashboard',
  workload: 'Workload & SLA',
  bags: 'Bags',
  bookings: 'Bookings',
  manifests: 'Manifests',
  exceptions: 'Exceptions',
  support: 'Support',
  payments: 'Payments',
  facilities: 'Facilities',
  catalog: 'Catalog',
  configuration: 'Configuration',
  reports: 'Reports',
  audits: 'Audits',
  users: 'Users'
}

const navOpen = ref(false)
const pageTitle = computed(() => titles[session.page] || 'Ops console')

function go(page) {
  session.page = page
  navOpen.value = false
}

function toggleNav() {
  navOpen.value = !navOpen.value
}

function closeNav() {
  navOpen.value = false
}

async function signOut() {
  const ok = await confirmDialog({
    title: 'Sign out',
    message: 'Sign out of the GoLyt ops console?',
    confirmLabel: 'Sign out',
    tone: 'warn'
  })
  if (ok) logout()
}

watch(
  () => session.user,
  (user) => {
    if (!user) navOpen.value = false
  }
)

watch(navOpen, (open) => {
  document.body.classList.toggle('nav-locked', open)
})

onBeforeUnmount(() => {
  document.body.classList.remove('nav-locked')
})
</script>

<template>
  <AppDialogs />

  <div v-if="!session.user || session.user.mustChangePassword" class="app-shell auth-only">
    <LoginView v-if="!session.user" />
    <PasswordView v-else />
  </div>

  <div v-else class="app-shell" :class="{ 'nav-open': navOpen }">
    <header class="mobile-topbar">
      <button
        class="ghost icon-btn menu-toggle"
        type="button"
        :aria-expanded="navOpen"
        aria-controls="side-rail"
        :aria-label="navOpen ? 'Close menu' : 'Open menu'"
        @click="toggleNav"
      >
        <svg v-if="!navOpen" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div class="mobile-topbar-copy">
        <div class="eyebrow">Ops console</div>
        <strong>{{ pageTitle }}</strong>
      </div>
      <button
        class="ghost icon-btn"
        type="button"
        title="Sign out"
        aria-label="Sign out"
        @click="signOut"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </header>

    <div
      class="nav-backdrop"
      :class="{ show: navOpen }"
      aria-hidden="true"
      @click="closeNav"
    />

    <aside id="side-rail" class="side-rail" :aria-hidden="false">
      <div class="side-brand">
        <div class="logo-plate">
          <img src="/logo.png" alt="GoLyt — Go light. Explore more." />
        </div>
        <div class="route">KIA → Zanzibar ops</div>
      </div>

      <div class="nav-groups">
        <div>
          <div class="nav-group-label">Command</div>
          <div class="nav-group">
            <button type="button" :class="{ on: session.page === 'home' }" @click="go('home')">Dashboard</button>
            <button type="button" :class="{ on: session.page === 'workload' }" @click="go('workload')">Workload</button>
            <button type="button" :class="{ on: session.page === 'exceptions' }" @click="go('exceptions')">Exceptions</button>
            <button type="button" :class="{ on: session.page === 'support' }" @click="go('support')">Support</button>
          </div>
        </div>

        <div>
          <div class="nav-group-label">Corridor</div>
          <div class="nav-group">
            <button type="button" :class="{ on: session.page === 'bags' }" @click="go('bags')">Bags</button>
            <button type="button" :class="{ on: session.page === 'bookings' }" @click="go('bookings')">Bookings</button>
            <button type="button" :class="{ on: session.page === 'manifests' }" @click="go('manifests')">Manifests</button>
            <button type="button" :class="{ on: session.page === 'payments' }" @click="go('payments')">Payments</button>
          </div>
        </div>

        <div>
          <div class="nav-group-label">Admin</div>
          <div class="nav-group">
            <button type="button" :class="{ on: session.page === 'facilities' }" @click="go('facilities')">Facilities</button>
            <button type="button" :class="{ on: session.page === 'catalog' }" @click="go('catalog')">Catalog</button>
            <button type="button" :class="{ on: session.page === 'configuration' }" @click="go('configuration')">Configuration</button>
            <button type="button" :class="{ on: session.page === 'reports' }" @click="go('reports')">Reports</button>
            <button type="button" :class="{ on: session.page === 'audits' }" @click="go('audits')">Audits</button>
            <button
              v-if="session.user.role === 'ADMIN'"
              type="button"
              :class="{ on: session.page === 'users' }"
              @click="go('users')"
            >Users</button>
          </div>
        </div>
      </div>

      <div class="side-foot">
        <div class="who-rail">
          <strong>{{ session.user.fullName }}</strong>
          <small>{{ session.user.role }}</small>
        </div>
        <button
          class="ghost icon-btn"
          type="button"
          title="Sign out"
          aria-label="Sign out"
          @click="signOut"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>

    <main class="canvas" :key="session.page">
      <div class="canvas-top">
        <div>
          <div class="eyebrow">Ops console</div>
          <h1>{{ pageTitle }}</h1>
        </div>
      </div>

      <DashboardView v-if="session.page === 'home'" />
      <WorkloadView v-else-if="session.page === 'workload'" />
      <BagsView v-else-if="session.page === 'bags'" />
      <BookingsView v-else-if="session.page === 'bookings'" />
      <ManifestsView v-else-if="session.page === 'manifests'" />
      <ExceptionsView v-else-if="session.page === 'exceptions'" />
      <SupportView v-else-if="session.page === 'support'" />
      <PaymentsView v-else-if="session.page === 'payments'" />
      <FacilitiesView v-else-if="session.page === 'facilities'" />
      <CatalogView v-else-if="session.page === 'catalog'" />
      <AirlinesView v-else-if="session.page === 'configuration'" />
      <ReportsView v-else-if="session.page === 'reports'" />
      <AuditView v-else-if="session.page === 'audits'" />
      <UsersView v-else-if="session.page === 'users'" />
    </main>
  </div>
</template>
